from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ChangeEvent, Competitor, TrackedUrl, User, utcnow
from app.schemas import ImpactBucket, StatsOverview, TimelineBucket

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview", response_model=StatsOverview)
def overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    competitors = db.query(Competitor).filter(Competitor.user_id == user.id).count()
    tracked_urls = (
        db.query(TrackedUrl).join(Competitor).filter(Competitor.user_id == user.id).count()
    )

    now = utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    base = (
        db.query(ChangeEvent)
        .join(TrackedUrl)
        .join(Competitor)
        .filter(Competitor.user_id == user.id)
    )
    changes_7d = base.filter(ChangeEvent.detected_at >= week_ago).count()
    high_impact_7d = base.filter(
        ChangeEvent.detected_at >= week_ago, ChangeEvent.impact_score >= 7
    ).count()

    # Timeline: changes per day over the last 30 days.
    day_expr = func.date(ChangeEvent.detected_at)
    rows = (
        db.query(day_expr.label("day"), func.count(ChangeEvent.id))
        .join(TrackedUrl, ChangeEvent.tracked_url_id == TrackedUrl.id)
        .join(Competitor, TrackedUrl.competitor_id == Competitor.id)
        .filter(Competitor.user_id == user.id, ChangeEvent.detected_at >= month_ago)
        .group_by(day_expr)
        .all()
    )
    counts_by_day = {str(day): count for day, count in rows}
    timeline = []
    for offset in range(29, -1, -1):
        day = (now - timedelta(days=offset)).date().isoformat()
        timeline.append(TimelineBucket(date=day, count=counts_by_day.get(day, 0)))

    # Impact distribution 1-10 across the last 30 days.
    impact_rows = (
        db.query(ChangeEvent.impact_score, func.count(ChangeEvent.id))
        .join(TrackedUrl, ChangeEvent.tracked_url_id == TrackedUrl.id)
        .join(Competitor, TrackedUrl.competitor_id == Competitor.id)
        .filter(
            Competitor.user_id == user.id,
            ChangeEvent.detected_at >= month_ago,
            ChangeEvent.impact_score.isnot(None),
        )
        .group_by(ChangeEvent.impact_score)
        .all()
    )
    counts_by_impact = {impact: count for impact, count in impact_rows}
    impact_distribution = [
        ImpactBucket(impact=i, count=counts_by_impact.get(i, 0)) for i in range(1, 11)
    ]

    return StatsOverview(
        competitors=competitors,
        tracked_urls=tracked_urls,
        changes_7d=changes_7d,
        high_impact_7d=high_impact_7d,
        timeline=timeline,
        impact_distribution=impact_distribution,
    )
