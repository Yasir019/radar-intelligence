import hashlib
import logging
import re

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.models import ChangeEvent, Snapshot, TrackedUrl, utcnow
from app.services import ai_analyzer, alerts

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
MAX_CONTENT_CHARS = 50_000
STRIP_TAGS = ["script", "style", "noscript", "nav", "footer", "header", "svg", "iframe", "form"]


def clean_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(STRIP_TAGS):
        tag.decompose()
    text = soup.get_text(separator="\n")
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)
    return text[:MAX_CONTENT_CHARS]


def fetch_page_text(url: str) -> str:
    response = httpx.get(
        url,
        timeout=15.0,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
    )
    response.raise_for_status()
    return clean_html(response.text)


def check_url(db: Session, tracked_url: TrackedUrl) -> ChangeEvent | None:
    """Fetch a tracked URL, snapshot it if content changed, and create a change
    event (with AI analysis + alerts) when a prior snapshot exists.

    Returns the new ChangeEvent, or None. Never raises — errors are recorded on
    the TrackedUrl row.
    """
    tracked_url.last_checked_at = utcnow()
    try:
        text = fetch_page_text(tracked_url.url)
    except Exception as exc:  # network errors, HTTP errors, parse errors
        tracked_url.last_status = f"error: {exc}"[:500]
        db.commit()
        logger.warning("Check failed for %s: %s", tracked_url.url, exc)
        return None

    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    latest: Snapshot | None = (
        db.query(Snapshot)
        .filter(Snapshot.tracked_url_id == tracked_url.id)
        .order_by(Snapshot.fetched_at.desc(), Snapshot.id.desc())
        .first()
    )

    if latest is not None and latest.content_hash == content_hash:
        tracked_url.last_status = "ok"
        db.commit()
        return None

    snapshot = Snapshot(tracked_url_id=tracked_url.id, content_hash=content_hash, content_text=text)
    db.add(snapshot)
    tracked_url.last_status = "ok"
    db.commit()
    db.refresh(snapshot)

    if latest is None:
        # First snapshot — baseline only, nothing to compare against.
        return None

    event = ChangeEvent(
        tracked_url_id=tracked_url.id,
        old_snapshot_id=latest.id,
        new_snapshot_id=snapshot.id,
        analysis_status="pending",
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    ai_analyzer.analyze_change_event(db, event)
    alerts.notify_change(db, event)
    return event
