from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_caller, get_current_user
from app.database import get_db
from app.models import Brief, User
from app.schemas import BriefOut
from app.services import brief_generator

router = APIRouter(prefix="/api/briefs", tags=["briefs"])


@router.post("/generate", response_model=BriefOut)
def generate(
    days: int = Query(default=7, ge=1, le=90),
    caller: User | None = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Generate a competitive brief. n8n calls this with X-API-Key (brief is
    generated for every user); the UI calls it with a JWT."""
    if caller is not None:
        return brief_generator.generate_brief(db, caller, days)

    # Service call: generate for all users, return the first (n8n reads content_md).
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users exist yet")
    briefs = [brief_generator.generate_brief(db, u, days) for u in users]
    return briefs[0]


@router.get("", response_model=list[BriefOut])
def list_briefs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Brief)
        .filter(Brief.user_id == user.id)
        .order_by(Brief.generated_at.desc())
        .limit(20)
        .all()
    )


@router.get("/{brief_id}", response_model=BriefOut)
def get_brief(brief_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    brief = db.query(Brief).filter(Brief.id == brief_id, Brief.user_id == user.id).first()
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not found")
    return brief
