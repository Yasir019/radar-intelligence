from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Battlecard,
    ChangeEvent,
    Competitor,
    Notification,
    Prediction,
    Snapshot,
    TrackedUrl,
    User,
    WarRoom,
)
from app.schemas import (
    CompetitorCreate,
    CompetitorOut,
    CompetitorUpdate,
    TrackedUrlCreate,
    TrackedUrlOut,
    TrackedUrlUpdate,
)
from app.services.alerts import notify_competitor_added, notify_url_added

router = APIRouter(prefix="/api/competitors", tags=["competitors"])


def _get_owned_competitor(db: Session, user: User, competitor_id: int) -> Competitor:
    competitor = (
        db.query(Competitor)
        .options(joinedload(Competitor.tracked_urls))
        .filter(Competitor.id == competitor_id, Competitor.user_id == user.id)
        .first()
    )
    if competitor is None:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitor


def _get_owned_url(db: Session, user: User, url_id: int) -> TrackedUrl:
    tracked = (
        db.query(TrackedUrl)
        .join(Competitor)
        .filter(TrackedUrl.id == url_id, Competitor.user_id == user.id)
        .first()
    )
    if tracked is None:
        raise HTTPException(status_code=404, detail="Tracked URL not found")
    return tracked


@router.get("", response_model=list[CompetitorOut])
def list_competitors(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Competitor)
        .options(joinedload(Competitor.tracked_urls))
        .filter(Competitor.user_id == user.id)
        .order_by(Competitor.created_at.asc())
        .all()
    )


@router.post("", response_model=CompetitorOut, status_code=status.HTTP_201_CREATED)
def create_competitor(
    body: CompetitorCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    competitor = Competitor(user_id=user.id, **body.model_dump())
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    notify_competitor_added(competitor.name, competitor.website)
    return competitor


@router.get("/{competitor_id}", response_model=CompetitorOut)
def get_competitor(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return _get_owned_competitor(db, user, competitor_id)


@router.put("/{competitor_id}", response_model=CompetitorOut)
def update_competitor(
    competitor_id: int,
    body: CompetitorUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competitor = _get_owned_competitor(db, user, competitor_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(competitor, field, value)
    db.commit()
    db.refresh(competitor)
    return competitor


@router.delete("/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_competitor(
    competitor_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    competitor = _get_owned_competitor(db, user, competitor_id)

    # Delete dependants explicitly. The Supabase schema uses foreign keys for
    # intelligence records, so relying only on the ORM relationship cascade
    # leaves battlecards/predictions/war rooms (and change snapshots) behind.
    tracked_ids = [tracked.id for tracked in competitor.tracked_urls]
    if tracked_ids:
        change_ids = [
            row[0]
            for row in db.query(ChangeEvent.id).filter(ChangeEvent.tracked_url_id.in_(tracked_ids)).all()
        ]
        if change_ids:
            db.query(Notification).filter(Notification.change_event_id.in_(change_ids)).delete(
                synchronize_session=False
            )
            db.query(ChangeEvent).filter(ChangeEvent.id.in_(change_ids)).delete(synchronize_session=False)
        db.query(Snapshot).filter(Snapshot.tracked_url_id.in_(tracked_ids)).delete(synchronize_session=False)
        db.query(TrackedUrl).filter(TrackedUrl.id.in_(tracked_ids)).delete(synchronize_session=False)

    db.query(Battlecard).filter(Battlecard.competitor_id == competitor.id).delete(synchronize_session=False)
    db.query(Prediction).filter(Prediction.competitor_id == competitor.id).delete(synchronize_session=False)
    db.query(WarRoom).filter(WarRoom.competitor_id == competitor.id).delete(synchronize_session=False)
    db.delete(competitor)
    db.commit()


@router.post("/{competitor_id}/urls", response_model=TrackedUrlOut, status_code=status.HTTP_201_CREATED)
def add_url(
    competitor_id: int,
    body: TrackedUrlCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competitor = _get_owned_competitor(db, user, competitor_id)
    tracked = TrackedUrl(competitor_id=competitor.id, url=body.url, page_type=body.page_type)
    db.add(tracked)
    db.commit()
    db.refresh(tracked)
    notify_url_added(competitor.name, tracked.url, tracked.page_type)
    return tracked


@router.put("/urls/{url_id}", response_model=TrackedUrlOut)
def update_url(
    url_id: int,
    body: TrackedUrlUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracked = _get_owned_url(db, user, url_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(tracked, field, value)
    db.commit()
    db.refresh(tracked)
    return tracked


@router.delete("/urls/{url_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_url(url_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tracked = _get_owned_url(db, user, url_id)
    db.delete(tracked)
    db.commit()
