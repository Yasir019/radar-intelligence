import logging
from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Brief, ChangeEvent, Competitor, TrackedUrl, User, utcnow

logger = logging.getLogger(__name__)

BRIEF_SYSTEM_PROMPT = """You are a competitive intelligence analyst writing a weekly brief \
for a B2B SaaS leadership team. You receive a list of detected competitor changes with AI \
analyses. Write a crisp, skimmable markdown brief with these sections:

# Competitive Intelligence Brief
## Executive Summary  (3-5 bullets, lead with the highest-impact items)
## Competitor Highlights  (one short subsection per competitor with changes)
## Threats & Opportunities
## Recommended Actions  (numbered, concrete, owner-agnostic)

Be specific, reference impact scores, and keep it under 700 words. Markdown only."""

_DEMO_BRIEF = """# Competitive Intelligence Brief

## Executive Summary
- **Acme Analytics cut Pro pricing by ~15%** (impact 8/10) — the most significant move this period; direct pressure on our mid-market tier.
- **PipelineHQ shipped AI-assisted reporting** (impact 7/10), overlapping with our Q3 roadmap item.
- Metricly is repositioning toward enterprise with new security/compliance messaging (impact 4/10).
- Overall competitor activity is up ~30% vs. the prior period, concentrated on pricing pages.

## Competitor Highlights
### Acme Analytics
Restructured pricing with a lower Pro price point and a usage-based add-on. Their positioning now emphasizes "pay for what you use" — expect this to appear in competitive deals within weeks.

### PipelineHQ
Changelog shows an AI-assisted reporting module and two workflow-automation improvements. Their velocity on AI features is accelerating.

### Metricly
Blog and homepage messaging shifted toward enterprise buyers (SOC 2, SSO, audit logs). Likely moving upmarket.

### DashForge
Minor copy updates only; no substantive changes detected.

## Threats & Opportunities
- **Threat:** Price-led displacement in mid-market renewals (Acme).
- **Threat:** Feature-parity erosion on AI reporting (PipelineHQ).
- **Opportunity:** Metricly's upmarket shift may leave SMB customers underserved — a wedge for targeted campaigns.

## Recommended Actions
1. Refresh the Acme battlecard with the new pricing and prep objection handling for renewals this quarter.
2. Pull forward the AI reporting beta announcement to blunt PipelineHQ's momentum.
3. Launch an SMB-focused comparison page targeting Metricly's departing segment.
"""


def _collect_changes(db: Session, user: User, days: int) -> list[ChangeEvent]:
    since = utcnow() - timedelta(days=days)
    return (
        db.query(ChangeEvent)
        .join(TrackedUrl, ChangeEvent.tracked_url_id == TrackedUrl.id)
        .join(Competitor, TrackedUrl.competitor_id == Competitor.id)
        .filter(Competitor.user_id == user.id, ChangeEvent.detected_at >= since)
        .order_by(ChangeEvent.detected_at.desc())
        .all()
    )


def _serialize_changes(changes: list[ChangeEvent]) -> str:
    rows = []
    for c in changes:
        rows.append(
            f"- [{c.detected_at:%Y-%m-%d}] {c.tracked_url.competitor.name} | "
            f"{c.tracked_url.page_type} | category={c.category or 'n/a'} | "
            f"impact={c.impact_score or 'n/a'}/10 | {c.summary or 'analysis pending'}"
        )
    return "\n".join(rows) if rows else "(no changes detected in this period)"


def generate_brief(db: Session, user: User, days: int = 7) -> Brief:
    changes = _collect_changes(db, user, days)

    if settings.effective_demo_mode:
        content = _DEMO_BRIEF
    else:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": BRIEF_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Period: last {days} days. Detected competitor changes:\n\n"
                        + _serialize_changes(changes)
                    ),
                },
            ],
            max_tokens=4096,
        )
        content = completion.choices[0].message.content or "(empty brief)"

    brief = Brief(user_id=user.id, period_days=days, content_md=content)
    db.add(brief)
    db.commit()
    db.refresh(brief)
    return brief
