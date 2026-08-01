import time
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserSettings

bearer_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 7

# Short-lived cache for verified Supabase tokens: token -> (email, expires_at)
_supabase_token_cache: dict[str, tuple[str, float]] = {}
_SUPABASE_CACHE_TTL = 60.0


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def _try_legacy_token(db: Session, token: str) -> User | None:
    """Our own JWT (demo account / pre-Supabase users)."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        return db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def _verify_supabase_token(token: str) -> str | None:
    """Validate a Supabase Auth access token and require a confirmed email."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        return None
    cached = _supabase_token_cache.get(token)
    if cached and cached[1] > time.monotonic():
        return cached[0]
    try:
        response = httpx.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                # Use the server-only key when available. Supabase accepts the
                # caller's bearer token for identity while this key authorizes
                # the backend-to-Supabase verification request.
                "apikey": settings.supabase_service_role_key or settings.supabase_anon_key,
                "Authorization": f"Bearer {token}",
            },
            timeout=10.0,
        )
        if response.status_code != 200:
            return None
        payload = response.json()
        email = (payload.get("email") or "").strip().lower()
        if not email:
            return None
        confirmed = bool(payload.get("email_confirmed_at") or payload.get("confirmed_at"))
        if not confirmed:
            return None
        _supabase_token_cache[token] = (email, time.monotonic() + _SUPABASE_CACHE_TTL)
        if len(_supabase_token_cache) > 1000:
            now = time.monotonic()
            for key in [k for k, v in _supabase_token_cache.items() if v[1] <= now]:
                _supabase_token_cache.pop(key, None)
        return email
    except httpx.HTTPError:
        return None


def _try_supabase_token(db: Session, token: str) -> User | None:
    """Supabase Auth token (email/password or Google OAuth via Supabase).
    Maps to a local users row, creating it on first login."""
    email = _verify_supabase_token(token)
    if email is None:
        return None
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, password_hash="supabase-auth")
        user.settings = UserSettings()
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _resolve_user(db: Session, token: str) -> User | None:
    return _try_legacy_token(db, token) or _try_supabase_token(db, token)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = _resolve_user(db, credentials.credentials)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user


def get_caller(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_api_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Machine endpoints: accept the service API key (returns None = all users)
    or a user token (returns that user)."""
    if x_api_key is not None:
        if x_api_key == settings.service_api_key:
            return None
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    if credentials is not None:
        user = _resolve_user(db, credentials.credentials)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
