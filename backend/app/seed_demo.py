"""Idempotent demo data seeder.

Usage (from backend/):  python -m app.seed_demo

Creates demo@radar.app / demo1234 with 4 competitors, tracked URLs, ~30 days of
snapshots, realistic AI-analyzed change events, notifications, and one brief.
Re-running wipes and recreates the demo user's data only.
"""

import hashlib
from datetime import timedelta

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    Brief,
    ChangeEvent,
    Competitor,
    Notification,
    Snapshot,
    TrackedUrl,
    User,
    UserSettings,
    utcnow,
)
from app.services.brief_generator import _DEMO_BRIEF

DEMO_EMAIL = "demo@radar.app"
DEMO_PASSWORD = "demo1234"

COMPETITORS = [
    {"name": "Acme Analytics", "website": "https://acme-analytics.example.com", "color": "#6366f1",
     "notes": "Closest direct competitor; strong in mid-market."},
    {"name": "PipelineHQ", "website": "https://pipelinehq.example.com", "color": "#0ea5e9",
     "notes": "Fast-moving startup; aggressive on AI features."},
    {"name": "Metricly", "website": "https://metricly.example.com", "color": "#f59e0b",
     "notes": "Moving upmarket toward enterprise."},
    {"name": "DashForge", "website": "https://dashforge.example.com", "color": "#10b981",
     "notes": "Legacy player; slower release cadence."},
]

PAGE_TEMPLATES = {
    "pricing": (
        "{name} Pricing\n"
        "Simple plans for every team\n"
        "Starter\n$29 per user / month\nUp to 5 dashboards\nEmail support\n"
        "Pro\n{pro_price} per user / month\nUnlimited dashboards\nAPI access\nPriority support\n"
        "Enterprise\nCustom pricing\nSSO and SAML\nDedicated success manager\nAudit logs\n"
        "All plans include a 14-day free trial. No credit card required.\n"
        "{extra}"
    ),
    "changelog": (
        "{name} Changelog\n"
        "March 2026\nImproved dashboard load times by 40%\nNew CSV export options\n"
        "February 2026\nRedesigned onboarding flow\nBug fixes and stability improvements\n"
        "{extra}"
    ),
    "features": (
        "{name} Features\n"
        "Dashboards\nBuild interactive dashboards in minutes\n"
        "Integrations\nConnect 50+ data sources\n"
        "Collaboration\nShare reports with your whole team\n"
        "Security\nSOC 2 Type II certified\n"
        "{extra}"
    ),
    "blog": (
        "{name} Blog\n"
        "How modern teams use analytics to move faster\n"
        "5 dashboard mistakes to avoid\n"
        "Why data culture beats data tooling\n"
        "{extra}"
    ),
}

# (competitor_idx, page_type, days_ago, category, impact, summary, action, old_extra, new_extra)
CHANGE_SCRIPT = [
    (0, "pricing", 1, "pricing_change", 8,
     "Acme cut the Pro plan from $79 to $69 per user and introduced a usage-based 'Scale' add-on. This is a deliberate move against mid-market deals and will surface in competitive renewals within weeks.",
     "Refresh the Acme battlecard with the new pricing and prep objection handling for Q2 renewals.",
     "Pro price: $79", "Pro price: $69. New: Scale add-on — pay as you grow."),
    (0, "pricing", 9, "promotion", 5,
     "Acme added a limited-time 20% annual-billing discount banner to the pricing page, likely a quarter-end push.",
     "Monitor whether the promotion persists past quarter end; arm sales with a counter-offer.",
     "", "Limited offer: 20% off annual plans this month."),
    (0, "blog", 14, "messaging_change", 3,
     "New blog content emphasizes ROI case studies over feature tours — a shift toward value-based selling narratives.",
     "Consider commissioning two customer ROI case studies for our own blog.",
     "", "New post: How Acme customers save 12 hours a week."),
    (1, "changelog", 2, "new_feature", 7,
     "PipelineHQ shipped an AI-assisted reporting module that auto-generates narrative summaries of dashboards. Direct overlap with our Q3 roadmap item.",
     "Accelerate the AI reporting beta and notify sales about the new competitive overlap.",
     "", "New: AI Reports — automatic narrative summaries for any dashboard."),
    (1, "changelog", 12, "new_feature", 6,
     "Two workflow-automation improvements landed: scheduled data refreshes and Slack alert rules. Their automation surface is expanding quickly.",
     "Update the comparison matrix; highlight our deeper alerting logic in demos.",
     "", "Added scheduled refreshes and Slack alert rules."),
    (1, "pricing", 20, "pricing_change", 6,
     "PipelineHQ introduced a free tier with 2 dashboards, clearly aimed at bottom-up adoption in smaller teams.",
     "Evaluate a free-tier response or a time-boxed trial extension for SMB signups.",
     "", "New Free plan: 2 dashboards, 1 user, community support."),
    (2, "blog", 4, "messaging_change", 4,
     "Metricly's latest posts pivot to enterprise security and compliance topics (SOC 2, SSO, audit logs) — consistent with an upmarket repositioning.",
     "Review our enterprise landing page messaging against their new positioning.",
     "", "New post: Enterprise-grade security for data teams."),
    (2, "features", 10, "new_feature", 7,
     "The features page now lists role-based access control and audit logging — table-stakes enterprise capabilities they previously lacked.",
     "Ensure RBAC parity messaging is prominent in enterprise proposals.",
     "", "New: Role-based access control. New: Full audit logging."),
    (2, "pricing", 17, "pricing_change", 5,
     "Metricly removed public Enterprise pricing and replaced it with 'Contact sales', signaling higher, negotiated price points.",
     "Expect higher Metricly quotes in enterprise deals; adjust pricing guidance for reps.",
     "Enterprise: $199 per user / month", "Enterprise: Contact sales"),
    (3, "features", 6, "other", 2,
     "DashForge made minor copy adjustments on the features page with no substantive product changes.",
     "No action needed; keep monitoring.",
     "Share reports with your whole team", "Share live reports with your whole team"),
    (3, "changelog", 15, "new_feature", 4,
     "DashForge added dark mode and accessibility improvements — quality-of-life updates rather than strategic moves.",
     "None required; note their slower release cadence in the quarterly review.",
     "", "New: dark mode and improved keyboard navigation."),
    (3, "pricing", 25, "promotion", 3,
     "DashForge is offering 3 months free on annual plans for new customers — a standard acquisition promotion.",
     "No structural response needed; flag to sales in the weekly digest.",
     "", "New customers: get 3 months free on annual plans."),
    (0, "features", 22, "new_feature", 6,
     "Acme added embedded analytics (iframe + JS SDK) to their features page, opening a new product surface for B2B2C use cases.",
     "Scope an embedded-analytics discovery spike; several prospects have requested this.",
     "", "New: Embedded analytics — bring dashboards into your own product."),
    (1, "blog", 27, "messaging_change", 3,
     "PipelineHQ published a manifesto-style post on 'the end of static dashboards', positioning AI-native analytics as the future.",
     "Prepare a point-of-view response post from our head of product.",
     "", "New post: The end of static dashboards."),
]


def _page_text(name: str, page_type: str, extra: str, pro_price: str = "$79") -> str:
    template = PAGE_TEMPLATES[page_type]
    return template.format(name=name, extra=extra, pro_price=pro_price).strip()


def _snapshot(db, tracked_url_id: int, text: str, fetched_at) -> Snapshot:
    snap = Snapshot(
        tracked_url_id=tracked_url_id,
        content_hash=hashlib.sha256(text.encode("utf-8")).hexdigest(),
        content_text=text,
        fetched_at=fetched_at,
    )
    db.add(snap)
    db.flush()
    return snap


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            db.delete(existing)
            db.commit()

        user = User(email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD))
        user.settings = UserSettings(alert_impact_threshold=7)
        db.add(user)
        db.flush()

        now = utcnow()
        competitors: list[Competitor] = []
        urls: dict[tuple[int, str], TrackedUrl] = {}

        for idx, spec in enumerate(COMPETITORS):
            competitor = Competitor(user_id=user.id, **spec, created_at=now - timedelta(days=35))
            db.add(competitor)
            db.flush()
            competitors.append(competitor)
            for page_type in ["pricing", "changelog", "features", "blog"]:
                tracked = TrackedUrl(
                    competitor_id=competitor.id,
                    url=f"{spec['website']}/{page_type}",
                    page_type=page_type,
                    last_checked_at=now - timedelta(hours=1),
                    last_status="ok",
                    created_at=now - timedelta(days=35),
                )
                db.add(tracked)
                db.flush()
                urls[(idx, page_type)] = tracked

        # Baseline snapshots 30 days ago for every URL.
        latest_snapshot: dict[int, Snapshot] = {}
        for (idx, page_type), tracked in urls.items():
            text = _page_text(COMPETITORS[idx]["name"], page_type, extra="")
            snap = _snapshot(db, tracked.id, text, now - timedelta(days=31))
            latest_snapshot[tracked.id] = snap

        # Change events (oldest first so snapshots chain correctly).
        for entry in sorted(CHANGE_SCRIPT, key=lambda e: -e[2]):
            idx, page_type, days_ago, category, impact, summary, action, old_extra, new_extra = entry
            tracked = urls[(idx, page_type)]
            name = COMPETITORS[idx]["name"]
            detected = now - timedelta(days=days_ago, hours=idx * 2 + 3)

            old_snap = latest_snapshot[tracked.id]
            if old_extra and old_extra in old_snap.content_text:
                new_text = old_snap.content_text.replace(old_extra, new_extra)
            elif old_extra:
                new_text = old_snap.content_text + "\n" + new_extra
            else:
                new_text = old_snap.content_text + "\n" + new_extra

            new_snap = _snapshot(db, tracked.id, new_text, detected)
            latest_snapshot[tracked.id] = new_snap

            event = ChangeEvent(
                tracked_url_id=tracked.id,
                old_snapshot_id=old_snap.id,
                new_snapshot_id=new_snap.id,
                detected_at=detected,
                summary=summary,
                category=category,
                impact_score=impact,
                recommended_action=action,
                analysis_status="done",
            )
            db.add(event)
            db.flush()

            db.add(Notification(
                user_id=user.id,
                change_event_id=event.id,
                title=f"{name}: {category} (impact {impact}/10)",
                body=summary,
                is_read=days_ago > 7,
                created_at=detected,
            ))

        db.add(Brief(
            user_id=user.id,
            period_days=7,
            content_md=_DEMO_BRIEF,
            generated_at=now - timedelta(days=1),
        ))

        db.commit()
        print(f"Seeded demo data for {DEMO_EMAIL} (password: {DEMO_PASSWORD})")
        print(f"  {len(competitors)} competitors, {len(urls)} tracked URLs, "
              f"{len(CHANGE_SCRIPT)} change events")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
