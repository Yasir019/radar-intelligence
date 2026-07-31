import logging

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ChangeEvent, Notification

logger = logging.getLogger(__name__)


def _event_payload(event: ChangeEvent) -> dict:
    tracked_url = event.tracked_url
    competitor = tracked_url.competitor
    return {
        "change_event_id": event.id,
        "competitor": competitor.name,
        "url": tracked_url.url,
        "page_type": tracked_url.page_type,
        "category": event.category,
        "impact_score": event.impact_score,
        "summary": event.summary,
        "recommended_action": event.recommended_action,
        "detected_at": event.detected_at.isoformat(),
    }


def notify_change(db: Session, event: ChangeEvent) -> None:
    """In-app notification always; n8n webhook fanout + direct Slack fallback
    for high-impact changes. Failures are logged, never raised."""
    tracked_url = event.tracked_url
    competitor = tracked_url.competitor
    user = competitor.user
    impact = event.impact_score or 0

    notification = Notification(
        user_id=user.id,
        change_event_id=event.id,
        title=f"{competitor.name}: {event.category or 'change detected'}"
        + (f" (impact {impact}/10)" if impact else ""),
        body=event.summary or f"A change was detected on {tracked_url.url}.",
    )
    db.add(notification)
    db.commit()

    # n8n instant fanout (Flow C) — n8n decides routing.
    if settings.n8n_webhook_url:
        try:
            httpx.post(settings.n8n_webhook_url, json=_event_payload(event), timeout=10.0)
        except Exception as exc:
            logger.warning("n8n webhook post failed: %s", exc)

    # Direct Slack fallback when n8n isn't in the loop.
    user_settings = user.settings
    if (
        user_settings
        and user_settings.slack_webhook_url
        and impact >= user_settings.alert_impact_threshold
    ):
        text = (
            f":rotating_light: *{competitor.name}* — {event.category} "
            f"(impact {impact}/10)\n{event.summary}\n"
            f"_Recommended:_ {event.recommended_action}\n{tracked_url.url}"
        )
        try:
            httpx.post(user_settings.slack_webhook_url, json={"text": text}, timeout=10.0)
        except Exception as exc:
            logger.warning("Slack webhook post failed: %s", exc)


def notify_competitor_added(competitor_name: str, website: str) -> None:
    """Send a lightweight lifecycle event to the Radar n8n webhook."""
    _post_n8n_event(
        {
            "competitor": competitor_name,
            "url": website,
            "category": "competitor_added",
            "impact_score": 0,
            "summary": f"New competitor added to Radar: {competitor_name}",
        }
    )


def notify_url_added(competitor_name: str, url: str, page_type: str) -> None:
    """Send a tracked-page event so the Slack branch runs immediately."""
    _post_n8n_event(
        {
            "competitor": competitor_name,
            "url": url,
            "page_type": page_type,
            "category": "page_added",
            "impact_score": 0,
            "summary": f"New {page_type} page added for {competitor_name}",
        }
    )


def _post_n8n_event(payload: dict) -> None:
    if not settings.n8n_webhook_url:
        return
    try:
        httpx.post(settings.n8n_webhook_url, json=payload, timeout=10.0)
    except Exception as exc:
        logger.warning("n8n lifecycle webhook post failed: %s", exc)
