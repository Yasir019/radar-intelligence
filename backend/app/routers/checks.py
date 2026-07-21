from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_caller
from app.database import get_db
from app.models import Competitor, TrackedUrl, User
from app.routers.changes import enrich_change_event
from app.schemas import CheckRunResult
from app.services import crawler

router = APIRouter(prefix="/api/checks", tags=["checks"])


def _active_urls(db: Session, caller: User | None) -> list[TrackedUrl]:
    query = db.query(TrackedUrl).join(Competitor).filter(TrackedUrl.is_active.is_(True))
    if caller is not None:
        query = query.filter(Competitor.user_id == caller.id)
    return query.all()


@router.post("/run", response_model=CheckRunResult)
def run_checks(caller: User | None = Depends(get_caller), db: Session = Depends(get_db)):
    """Sweep all active tracked URLs. Called by n8n (X-API-Key) on a schedule,
    or by a logged-in user. Returns newly detected change events."""
    urls = _active_urls(db, caller)
    new_changes = []
    errors = 0
    for tracked in urls:
        event = crawler.check_url(db, tracked)
        if tracked.last_status and tracked.last_status.startswith("error"):
            errors += 1
        if event is not None:
            new_changes.append(enrich_change_event(event))
    return CheckRunResult(checked_urls=len(urls), errors=errors, new_changes=new_changes)


@router.post("/run/{url_id}", response_model=CheckRunResult)
def run_check_single(
    url_id: int, caller: User | None = Depends(get_caller), db: Session = Depends(get_db)
):
    """'Check now' for a single tracked URL."""
    query = db.query(TrackedUrl).join(Competitor).filter(TrackedUrl.id == url_id)
    if caller is not None:
        query = query.filter(Competitor.user_id == caller.id)
    tracked = query.first()
    if tracked is None:
        raise HTTPException(status_code=404, detail="Tracked URL not found")

    event = crawler.check_url(db, tracked)
    errors = 1 if tracked.last_status and tracked.last_status.startswith("error") else 0
    return CheckRunResult(
        checked_urls=1,
        errors=errors,
        new_changes=[enrich_change_event(event)] if event else [],
    )
