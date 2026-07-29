from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Battlecard, Competitor, User
from app.schemas import BattlecardOut
from app.services import battlecards as battlecard_service

router = APIRouter(prefix="/api/battlecards", tags=["battlecards"])


def _owned_competitor(db: Session, user: User, competitor_id: int) -> Competitor:
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == user.id)
        .first()
    )
    if competitor is None:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitor


@router.post("/{competitor_id}", response_model=BattlecardOut)
def generate(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    competitor = _owned_competitor(db, user, competitor_id)
    return battlecard_service.generate_battlecard(db, user, competitor)


@router.get("/{competitor_id}/latest", response_model=BattlecardOut | None)
def latest(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _owned_competitor(db, user, competitor_id)
    return (
        db.query(Battlecard)
        .filter(Battlecard.competitor_id == competitor_id, Battlecard.user_id == user.id)
        .order_by(Battlecard.generated_at.desc())
        .first()
    )
