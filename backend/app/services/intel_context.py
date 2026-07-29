"""Shared helper: serialize a user's tracked intel compactly for LLM prompts."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import ChangeEvent, Competitor, TrackedUrl, User, utcnow


def competitor_changes(db: Session, competitor: Competitor, days: int = 90, limit: int = 25) -> list[ChangeEvent]:
    since = utcnow() - timedelta(days=days)
    return (
        db.query(ChangeEvent)
        .join(TrackedUrl)
        .filter(TrackedUrl.competitor_id == competitor.id, ChangeEvent.detected_at >= since)
        .order_by(ChangeEvent.detected_at.desc())
        .limit(limit)
        .all()
    )


def serialize_changes(events: list[ChangeEvent]) -> str:
    if not events:
        return "(no tracked changes in this period)"
    return "\n".join(
        f"- [{e.detected_at:%b %d}] {e.tracked_url.page_type} | {e.category or 'change'} "
        f"| impact {e.impact_score or '?'}/10 | {e.summary or 'change detected'}"
        for e in events
    )


def full_intel_context(db: Session, user: User, days: int = 45, max_chars: int = 9000) -> str:
    """Everything Radar knows, compact — used by Ask Radar."""
    competitors = db.query(Competitor).filter(Competitor.user_id == user.id).all()
    parts: list[str] = []
    for competitor in competitors:
        events = competitor_changes(db, competitor, days=days, limit=12)
        parts.append(
            f"## {competitor.name} ({competitor.website})"
            + (f"\nNotes: {competitor.notes}" if competitor.notes else "")
            + f"\nTracked changes (last {days} days):\n{serialize_changes(events)}"
        )
    context = "\n\n".join(parts) if parts else "(no competitors tracked yet)"
    return context[:max_chars]
