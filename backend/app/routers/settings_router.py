from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, UserSettings
from app.schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_settings(db: Session, user: User) -> UserSettings:
    if user.settings is None:
        user.settings = UserSettings(user_id=user.id)
        db.add(user.settings)
        db.commit()
        db.refresh(user)
    return user.settings


@router.get("", response_model=SettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_settings(db, user)


@router.put("", response_model=SettingsOut)
def update_settings(
    body: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    user_settings = _get_settings(db, user)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user_settings, field, value)
    db.commit()
    db.refresh(user_settings)
    return user_settings
