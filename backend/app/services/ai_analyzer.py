import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models import ChangeEvent
from app.schemas import ChangeAnalysis
from app.services.differ import changed_excerpt

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a competitive intelligence analyst for a B2B SaaS company. \
You receive the old and new versions of a competitor web page and must assess the \
competitive significance of the change.

Guidelines:
- Focus on substantive changes: pricing, plans, limits, features, positioning, promotions.
- Ignore boilerplate, dates, cookie banners, and cosmetic churn. If the change is purely \
cosmetic, use category "other" and an impact_score of 1-2.
- impact_score: 1-3 minor, 4-6 notable, 7-8 significant, 9-10 urgent competitive threat.
- recommended_action must be one concrete, specific step the team can take this week.
Respond with JSON only."""

_DEMO_ANALYSES: dict[str, ChangeAnalysis] = {
    "pricing": ChangeAnalysis(
        summary="The competitor restructured their pricing page: the Pro tier price changed and a new usage-based add-on appeared. This suggests a move toward value-based pricing that could undercut our mid-market positioning.",
        category="pricing_change",
        impact_score=8,
        recommended_action="Run a win/loss price-sensitivity review for mid-market deals and prepare a battlecard update within the week.",
    ),
    "changelog": ChangeAnalysis(
        summary="A new release entry was added to the competitor's changelog introducing workflow automation capabilities. This closes a gap with our automation offering.",
        category="new_feature",
        impact_score=6,
        recommended_action="Brief the product team on the new capability and update the competitive comparison page.",
    ),
    "blog": ChangeAnalysis(
        summary="A new blog post signals a repositioning toward enterprise buyers, emphasizing security and compliance messaging.",
        category="messaging_change",
        impact_score=4,
        recommended_action="Review our enterprise landing page messaging against their new positioning.",
    ),
    "features": ChangeAnalysis(
        summary="The features page now lists an AI-assisted reporting module that was not present before. This is a direct overlap with our roadmap item.",
        category="new_feature",
        impact_score=7,
        recommended_action="Accelerate the AI reporting beta and notify sales about the new competitive overlap.",
    ),
    "other": ChangeAnalysis(
        summary="Content on the page was updated with minor copy adjustments and no substantive product or pricing changes.",
        category="other",
        impact_score=2,
        recommended_action="No action needed; keep monitoring.",
    ),
}


def _demo_analysis(page_type: str) -> ChangeAnalysis:
    return _DEMO_ANALYSES.get(page_type, _DEMO_ANALYSES["other"])


def _build_user_prompt(competitor: str, page_type: str, url: str, old_text: str, new_text: str) -> str:
    old_ex, new_ex = changed_excerpt(old_text, new_text)
    return (
        f"Competitor: {competitor}\n"
        f"Page type: {page_type}\n"
        f"URL: {url}\n\n"
        "A change was detected on this page. Analyze its competitive significance.\n\n"
        f"<old_version>\n{old_ex}\n</old_version>\n\n"
        f"<new_version>\n{new_ex}\n</new_version>"
    )


def analyze_change(competitor: str, page_type: str, url: str, old_text: str, new_text: str) -> ChangeAnalysis:
    if settings.effective_demo_mode:
        return _demo_analysis(page_type)

    from groq import Groq  # imported lazily so demo mode needs no key

    client = Groq(api_key=settings.groq_api_key)
    schema = ChangeAnalysis.model_json_schema()
    request = dict(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(competitor, page_type, url, old_text, new_text)},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "change_analysis", "schema": schema},
        },
        max_tokens=1024,
    )

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            completion = client.chat.completions.create(**request)
            content = completion.choices[0].message.content or ""
            return ChangeAnalysis.model_validate_json(content)
        except Exception as exc:
            last_error = exc
            logger.warning("Groq analysis attempt %d failed: %s", attempt + 1, exc)
    raise RuntimeError(f"AI analysis failed after retry: {last_error}")


def analyze_change_event(db: Session, event: ChangeEvent) -> None:
    """Run the AI analysis for a stored change event and persist the result."""
    tracked_url = event.tracked_url
    competitor = tracked_url.competitor
    try:
        analysis = analyze_change(
            competitor=competitor.name,
            page_type=tracked_url.page_type,
            url=tracked_url.url,
            old_text=event.old_snapshot.content_text,
            new_text=event.new_snapshot.content_text,
        )
        event.summary = analysis.summary
        event.category = analysis.category
        event.impact_score = analysis.impact_score
        event.recommended_action = analysis.recommended_action
        event.analysis_status = "done"
    except Exception as exc:
        logger.error("Analysis failed for change event %d: %s", event.id, exc)
        event.analysis_status = "failed"
    db.commit()
