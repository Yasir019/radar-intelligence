import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Competitor, Prediction, User
from app.schemas import PredictionOut
from app.services import predictor as predictor_service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


def _to_out(p: Prediction) -> PredictionOut:
    return PredictionOut(
        id=p.id,
        competitor_id=p.competitor_id,
        strategy_profile=p.strategy_profile,
        threat_level=p.threat_level,
        moves=json.loads(p.moves_json),
        generated_at=p.generated_at,
    )


def _owned_competitor(db: Session, user: User, competitor_id: int) -> Competitor:
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == user.id)
        .first()
    )
    if competitor is None:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitor


@router.post("/{competitor_id}", response_model=PredictionOut)
def generate(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    competitor = _owned_competitor(db, user, competitor_id)
    return _to_out(predictor_service.generate_prediction(db, user, competitor))


@router.get("/{competitor_id}/latest", response_model=PredictionOut | None)
def latest(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _owned_competitor(db, user, competitor_id)
    prediction = (
        db.query(Prediction)
        .filter(Prediction.competitor_id == competitor_id, Prediction.user_id == user.id)
        .order_by(Prediction.generated_at.desc())
        .first()
    )
    return _to_out(prediction) if prediction else None
