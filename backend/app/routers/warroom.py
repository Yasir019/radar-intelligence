import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Competitor, User, WarRoom
from app.schemas import WarRoomOut, WarRoomTurn
from app.services import war_room as war_room_service

router = APIRouter(prefix="/api/warroom", tags=["war-room"])


def _to_out(wr: WarRoom) -> WarRoomOut:
    return WarRoomOut(
        id=wr.id,
        competitor_id=wr.competitor_id,
        competitor_name=wr.competitor.name,
        competitor_color=wr.competitor.color,
        rounds=wr.rounds,
        transcript=[WarRoomTurn(**t) for t in json.loads(wr.transcript_json)],
        created_at=wr.created_at,
    )


@router.post("/{competitor_id}", response_model=WarRoomOut)
def start_debate(
    competitor_id: int,
    rounds: int = Query(default=3, ge=1, le=5),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == user.id)
        .first()
    )
    if competitor is None:
        raise HTTPException(status_code=404, detail="Competitor not found")
    wr = war_room_service.run_debate(db, user, competitor, rounds)
    return _to_out(wr)


@router.post("/{competitor_id}/stream")
def stream_debate(
    competitor_id: int,
    rounds: int = Query(default=3, ge=1, le=5),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Server-sent events: each debate turn streams to the client the moment
    the AI finishes generating it; the saved session arrives last."""
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == user.id)
        .first()
    )
    if competitor is None:
        raise HTTPException(status_code=404, detail="Competitor not found")

    def event_stream():
        transcript: list[dict] = []
        for turn in war_room_service.generate_turns(db, competitor, rounds):
            transcript.append(turn)
            yield f"data: {json.dumps({'type': 'turn', 'turn': turn})}\n\n"
        wr = war_room_service.save_debate(db, user, competitor, rounds, transcript)
        session = _to_out(wr).model_dump(mode="json")
        yield f"data: {json.dumps({'type': 'done', 'session': session})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("", response_model=list[WarRoomOut])
def list_debates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = (
        db.query(WarRoom)
        .filter(WarRoom.user_id == user.id)
        .order_by(WarRoom.created_at.desc())
        .limit(20)
        .all()
    )
    return [_to_out(wr) for wr in sessions]


@router.get("/{war_room_id}", response_model=WarRoomOut)
def get_debate(war_room_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wr = db.query(WarRoom).filter(WarRoom.id == war_room_id, WarRoom.user_id == user.id).first()
    if wr is None:
        raise HTTPException(status_code=404, detail="War room session not found")
    return _to_out(wr)
