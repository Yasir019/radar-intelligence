from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.logo import company_logo_url
from app.models import ChangeEvent, Competitor, TrackedUrl, User, utcnow
from app.schemas import (
    DashboardCompetitorRow,
    DashboardStats,
    DashboardSummary,
    ImpactBucket,
    StatsOverview,
    TimelineBucket,
)

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _growth_percent(current: int, previous: int) -> int:
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100)


def _activity_level(score: int) -> str:
    if score >= 80:
        return "Very high"
    if score >= 60:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"


def _naive_utc(value):
    return value.replace(tzinfo=None) if value.tzinfo is not None else value


@router.get("/overview", response_model=StatsOverview)
def overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    competitors = db.query(Competitor).filter(Competitor.user_id == user.id).count()
    tracked_urls = (
        db.query(TrackedUrl).join(Competitor).filter(Competitor.user_id == user.id).count()
    )

    now = utcnow().replace(tzinfo=None)
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


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    days: int = Query(default=30, ge=7, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Decision-ready dashboard metrics derived from existing monitoring history."""
    now = utcnow().replace(tzinfo=None)
    current_start = now - timedelta(days=days)
    previous_start = now - timedelta(days=days * 2)

    competitors = (
        db.query(Competitor)
        .options(joinedload(Competitor.tracked_urls))
        .filter(Competitor.user_id == user.id)
        .order_by(Competitor.created_at.asc())
        .all()
    )
    events = (
        db.query(ChangeEvent)
        .options(joinedload(ChangeEvent.tracked_url).joinedload(TrackedUrl.competitor))
        .join(TrackedUrl)
        .join(Competitor)
        .filter(
            Competitor.user_id == user.id,
            ChangeEvent.detected_at >= previous_start,
        )
        .order_by(ChangeEvent.detected_at.desc())
        .all()
    )

    current_events = [
        event for event in events if _naive_utc(event.detected_at) >= current_start
    ]
    previous_events = [
        event for event in events if _naive_utc(event.detected_at) < current_start
    ]
    current_high = [event for event in current_events if (event.impact_score or 0) >= 7]
    previous_high = [event for event in previous_events if (event.impact_score or 0) >= 7]
    current_launches = [event for event in current_events if event.category == "new_feature"]
    previous_launches = [event for event in previous_events if event.category == "new_feature"]

    counts_by_day: dict[str, int] = {}
    for event in current_events:
        day = event.detected_at.date().isoformat()
        counts_by_day[day] = counts_by_day.get(day, 0) + 1

    timeline = []
    day_keys = []
    for offset in range(days - 1, -1, -1):
        day = (now - timedelta(days=offset)).date().isoformat()
        day_keys.append(day)
        timeline.append(TimelineBucket(date=day, count=counts_by_day.get(day, 0)))

    competitor_rows = []
    for competitor in competitors:
        current = [
            event for event in current_events if event.tracked_url.competitor_id == competitor.id
        ]
        previous = [
            event for event in previous_events if event.tracked_url.competitor_id == competitor.id
        ]
        high_impact = sum(1 for event in current if (event.impact_score or 0) >= 7)
        active_pages = sum(1 for tracked_url in competitor.tracked_urls if tracked_url.is_active)
        impact_weight = sum(event.impact_score or 0 for event in current)
        recency_bonus = (
            10
            if current and _naive_utc(current[0].detected_at) >= now - timedelta(days=7)
            else 0
        )
        activity_score = min(
            100,
            active_pages * 8 + len(current) * 6 + round(impact_weight / 2) + recency_bonus,
        )

        category_counts: dict[str, int] = {}
        for event in current:
            category = event.category or "other"
            category_counts[category] = category_counts.get(category, 0) + 1
        top_movement = (
            max(category_counts.items(), key=lambda item: item[1])[0]
            if category_counts
            else "other"
        )

        trend_counts = {day: 0 for day in day_keys}
        for event in current:
            day = event.detected_at.date().isoformat()
            if day in trend_counts:
                trend_counts[day] += 1

        competitor_rows.append(
            DashboardCompetitorRow(
                competitor_id=competitor.id,
                competitor_name=competitor.name,
                competitor_color=competitor.color,
                competitor_logo_url=company_logo_url(competitor.website),
                activity_score=activity_score,
                activity_level=_activity_level(activity_score),
                change_percent=_growth_percent(len(current), len(previous)),
                total_changes=len(current),
                high_impact=high_impact,
                top_movement=top_movement,
                last_change=current[0].detected_at if current else None,
                trend=[trend_counts[day] for day in day_keys],
            )
        )

    competitor_rows.sort(
        key=lambda row: (row.activity_score, row.total_changes, row.high_impact),
        reverse=True,
    )

    return DashboardStats(
        days=days,
        timeline=timeline,
        summary=DashboardSummary(
            competitors=len(competitors),
            total_changes=len(current_events),
            changes_growth_pct=_growth_percent(len(current_events), len(previous_events)),
            high_impact=len(current_high),
            high_impact_growth_pct=_growth_percent(len(current_high), len(previous_high)),
            new_launches=len(current_launches),
            launches_growth_pct=_growth_percent(len(current_launches), len(previous_launches)),
        ),
        competitors=competitor_rows,
    )
