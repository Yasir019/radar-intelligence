from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ChangeEvent, Competitor, TrackedUrl, User
from app.schemas import ChangeEventOut, DiffResponse
from app.services.differ import structured_diff

router = APIRouter(prefix="/api/changes", tags=["changes"])


def enrich_change_event(event: ChangeEvent) -> ChangeEventOut:
    out = ChangeEventOut.model_validate(event)
    tracked = event.tracked_url
    out.url = tracked.url
    out.page_type = tracked.page_type
    out.competitor_id = tracked.competitor.id
    out.competitor_name = tracked.competitor.name
    out.competitor_color = tracked.competitor.color
    return out


def _owned_event(db: Session, user: User, change_id: int) -> ChangeEvent:
    event = (
        db.query(ChangeEvent)
        .join(TrackedUrl)
        .join(Competitor)
        .filter(ChangeEvent.id == change_id, Competitor.user_id == user.id)
        .first()
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Change event not found")
    return event


@router.get("", response_model=list[ChangeEventOut])
def list_changes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    competitor_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    min_impact: int | None = Query(default=None, ge=1, le=10),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = (
        db.query(ChangeEvent)
        .join(TrackedUrl)
        .join(Competitor)
        .filter(Competitor.user_id == user.id)
    )
    if competitor_id is not None:
        query = query.filter(Competitor.id == competitor_id)
    if category is not None:
        query = query.filter(ChangeEvent.category == category)
    if min_impact is not None:
        query = query.filter(ChangeEvent.impact_score >= min_impact)
    events = (
        query.order_by(ChangeEvent.detected_at.desc()).offset(offset).limit(limit).all()
    )
    return [enrich_change_event(e) for e in events]


@router.get("/{change_id}", response_model=ChangeEventOut)
def get_change(change_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return enrich_change_event(_owned_event(db, user, change_id))


@router.get("/{change_id}/diff", response_model=DiffResponse)
def get_change_diff(
    change_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    event = _owned_event(db, user, change_id)
    lines = structured_diff(event.old_snapshot.content_text, event.new_snapshot.content_text)
    return DiffResponse(
        change_event_id=event.id,
        old_fetched_at=event.old_snapshot.fetched_at,
        new_fetched_at=event.new_snapshot.fetched_at,
        lines=lines,
    )
