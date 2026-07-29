import json
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Competitor, Prediction, User
from app.schemas import PredictionAnalysis
from app.services.intel_context import competitor_changes, serialize_changes

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a competitive-strategy forecaster. You receive the tracked history of a \
competitor's website changes (pricing, features, messaging, promotions). Your job:

1. strategy_profile — read the PATTERN behind their moves and describe their "Strategy DNA" in 2-3 \
sentences (e.g. "price-aggressive fast-follower moving upmarket").
2. threat_level — score 1-10 how dangerous their current trajectory is.
3. moves — predict the 3 most likely NEXT moves, each with a timeframe, a confidence percentage, \
and a one-sentence rationale grounded in the observed pattern. Be bold but evidence-based.

Respond with JSON only."""

_DEMO_ANALYSIS = PredictionAnalysis(
    strategy_profile=(
        "A price-aggressive fast-follower: they watch the market leader ship, replicate within weeks, "
        "and undercut on price. Recent moves show a deliberate shift from SMB land-grab toward "
        "mid-market expansion, funded by usage-based monetization."
    ),
    threat_level=7,
    moves=[
        {
            "move": "Launch an annual-commit discount tier to lock in the customers won via price cuts",
            "timeframe": "4-6 weeks",
            "confidence": 74,
            "rationale": "Price-led acquisition always precedes a retention lock-in play, and their promo cadence points to quarter-end.",
        },
        {
            "move": "Expand AI features from reporting into automated insights/alerts",
            "timeframe": "6-10 weeks",
            "confidence": 66,
            "rationale": "Their changelog shows compounding AI investment and they market each increment aggressively.",
        },
        {
            "move": "Introduce enterprise tier with SSO/audit logs and gated pricing",
            "timeframe": "one quarter",
            "confidence": 55,
            "rationale": "Hiding public enterprise pricing is the classic precursor to a negotiated upmarket motion.",
        },
    ],
)


def generate_prediction(db: Session, user: User, competitor: Competitor) -> Prediction:
    if settings.effective_demo_mode:
        analysis = _DEMO_ANALYSIS
    else:
        from groq import Groq

        events = competitor_changes(db, competitor)
        client = Groq(api_key=settings.groq_api_key)
        request = dict(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Competitor: {competitor.name} ({competitor.website})\n"
                        + (f"Analyst notes: {competitor.notes}\n" if competitor.notes else "")
                        + f"\nTracked change history (last 90 days):\n{serialize_changes(events)}"
                    ),
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {"name": "prediction", "schema": PredictionAnalysis.model_json_schema()},
            },
            max_tokens=2048,
        )
        analysis = None
        last_error: Exception | None = None
        for _ in range(2):
            try:
                completion = client.chat.completions.create(**request)
                content = completion.choices[0].message.content or ""
                analysis = PredictionAnalysis.model_validate_json(content)
                break
            except Exception as exc:
                last_error = exc
                logger.warning("Prediction attempt failed: %s", exc)
        if analysis is None:
            raise RuntimeError(f"Prediction failed after retry: {last_error}")

    prediction = Prediction(
        user_id=user.id,
        competitor_id=competitor.id,
        strategy_profile=analysis.strategy_profile,
        threat_level=analysis.threat_level,
        moves_json=json.dumps([m.model_dump() for m in analysis.moves]),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
