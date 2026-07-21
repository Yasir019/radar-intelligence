import json
import logging
import time
from collections.abc import Iterator
from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models import ChangeEvent, Competitor, TrackedUrl, User, WarRoom, utcnow

logger = logging.getLogger(__name__)

ATTACKER_SYSTEM = """You are the ruthless Chief Strategy Officer of {competitor}. You are in a live \
strategy debate against a rival B2B SaaS company. Attack their market position aggressively using \
YOUR company's recent moves (listed below) as ammunition. Be specific, confident, and cutting — \
reference your actual moves. Speak in first person plural ("we"). Maximum 110 words per turn. \
No pleasantries, go straight for the throat."""

DEFENDER_SYSTEM = """You are the sharp VP of Strategy defending our B2B SaaS company in a live \
debate against {competitor}'s strategist. Counter their attacks by exposing the weaknesses, risks \
and desperation hidden in their recent moves (listed below). Be specific and confident — turn \
their own moves against them. Speak in first person plural ("we"). Maximum 110 words per turn. \
End each turn on the front foot."""

REFEREE_SYSTEM = """You are a neutral competitive-strategy analyst refereeing a debate between \
{competitor}'s strategist and a rival's defender. Read the full transcript and deliver a verdict: \
(1) who argued more convincingly and why (one sentence), (2) the 3 most important strategic \
takeaways for the defending company, numbered. Maximum 130 words. Be decisive."""

_DEMO_TRANSCRIPT = [
    {"role": "attacker", "speaker": "Acme Analytics — Chief Strategist",
     "text": "We just cut our Pro plan to $69 and shipped a usage-based Scale add-on. Your mid-market customers are already doing the math — why pay more for less flexibility? Every renewal conversation you have this quarter now starts with our pricing page open in a second tab. We move faster, we price sharper, and your roadmap is reacting to ours."},
    {"role": "defender", "speaker": "Our VP of Strategy",
     "text": "A 13% price cut isn't strategy — it's margin panic. You've trained your market to wait for discounts, and usage-based pricing means your customers' bills are now unpredictable — the #1 churn driver in mid-market. We compete on trust and total cost of ownership, not sticker price. Your 'Scale add-on' is a paywall on growth; ours is included. Renewals aren't won on a pricing page — they're won on twelve months of reliability."},
    {"role": "attacker", "speaker": "Acme Analytics — Chief Strategist",
     "text": "Call it panic — our pipeline calls it momentum. We also launched embedded analytics this month, opening the B2B2C surface you haven't touched. While you defend renewals, we're expanding the market. Your AI reporting is still 'on the roadmap'; ours ships in weeks. Buyers don't wait for roadmaps."},
    {"role": "defender", "speaker": "Our VP of Strategy",
     "text": "Shipping fast and shipping right aren't the same thing. Embedded analytics with your permission model is a security review nightmare — enterprise buyers will find that out in procurement. Meanwhile our AI reporting beta is live with design partners who actually influence analyst reports. You're sprinting into surface area you can't support. We'll take the customers who read past the press release."},
    {"role": "attacker", "speaker": "Acme Analytics — Chief Strategist",
     "text": "Procurement fears are the last refuge of the slower vendor. Our free tier is filling the top of the funnel you're paying CAC for. In six months your SMB base becomes our expansion pipeline. Price, velocity, and reach — we hold all three levers now."},
    {"role": "defender", "speaker": "Our VP of Strategy",
     "text": "Free tiers fill funnels with users who never pay — ask your CFO about conversion math at $0. You now support three pricing models, two new surfaces, and a discount-trained customer base, all at once. That's not three levers — that's three fires. We'll keep converting the customers who value depth over discounts, and we'll be there when yours churn."},
    {"role": "verdict", "speaker": "Referee — Neutral Analyst",
     "text": "The defender argued more convincingly — they consistently reframed Acme's volume of moves as unmanaged risk rather than momentum. Key takeaways: 1) Prepare a total-cost-of-ownership battlecard before renewal season; Acme's price cut will anchor every negotiation. 2) Accelerate the AI reporting beta announcement — the roadmap-vs-shipped gap is the attacker's sharpest weapon. 3) Monitor Acme's free-tier conversion signals; if it works, an SMB defense play becomes urgent within two quarters."},
]


def _competitor_moves(db: Session, competitor: Competitor, days: int = 45) -> str:
    since = utcnow() - timedelta(days=days)
    events = (
        db.query(ChangeEvent)
        .join(TrackedUrl)
        .filter(TrackedUrl.competitor_id == competitor.id, ChangeEvent.detected_at >= since)
        .order_by(ChangeEvent.detected_at.desc())
        .limit(15)
        .all()
    )
    if not events:
        return "(no tracked moves in the last 45 days — argue from general market position)"
    return "\n".join(
        f"- [{e.detected_at:%b %d}] {e.category or 'change'} (impact {e.impact_score or '?'}/10): {e.summary or 'change detected'}"
        for e in events
    )


def _transcript_text(transcript: list[dict]) -> str:
    return "\n\n".join(f"{t['speaker']}: {t['text']}" for t in transcript)


def generate_turns(db: Session, competitor: Competitor, rounds: int = 3) -> Iterator[dict]:
    """Yield debate turns one at a time, as each is generated."""
    if settings.effective_demo_mode:
        for turn_dict in _DEMO_TRANSCRIPT[: rounds * 2] + [_DEMO_TRANSCRIPT[-1]]:
            time.sleep(1.2)  # simulate generation so the demo streams realistically
            yield turn_dict
        return

    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    moves = _competitor_moves(db, competitor)
    transcript: list[dict] = []

    def turn(system: str, instruction: str) -> str:
        # gpt-oss is a reasoning model: give headroom so reasoning tokens
        # don't starve the visible answer, and retry once if it comes back empty.
        for attempt_tokens in (900, 1800):
            completion = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system.format(competitor=competitor.name)},
                    {
                        "role": "user",
                        "content": (
                            f"{competitor.name}'s recent tracked moves:\n{moves}\n\n"
                            f"Debate so far:\n{_transcript_text(transcript) or '(debate is starting)'}\n\n"
                            f"{instruction}"
                        ),
                    },
                ],
                max_tokens=attempt_tokens,
            )
            text = (completion.choices[0].message.content or "").strip()
            if text:
                return text
        return "(strategist paused — no argument delivered this turn)"

    for round_number in range(1, rounds + 1):
        attack = turn(
            ATTACKER_SYSTEM,
            f"Round {round_number}/{rounds}. Deliver your attack now."
            + (" Open the debate with your strongest move." if round_number == 1 else " Escalate — counter their last defense."),
        )
        attack_turn = {
            "role": "attacker",
            "speaker": f"{competitor.name} — Chief Strategist",
            "text": attack,
        }
        transcript.append(attack_turn)
        yield attack_turn

        defense = turn(
            DEFENDER_SYSTEM,
            f"Round {round_number}/{rounds}. Counter the attacker's latest argument now.",
        )
        defense_turn = {"role": "defender", "speaker": "Our VP of Strategy", "text": defense}
        transcript.append(defense_turn)
        yield defense_turn

    verdict = turn(REFEREE_SYSTEM, "The debate has ended. Deliver your verdict now.")
    yield {"role": "verdict", "speaker": "Referee — Neutral Analyst", "text": verdict}


def save_debate(
    db: Session, user: User, competitor: Competitor, rounds: int, transcript: list[dict]
) -> WarRoom:
    war_room = WarRoom(
        user_id=user.id,
        competitor_id=competitor.id,
        rounds=rounds,
        transcript_json=json.dumps(transcript),
    )
    db.add(war_room)
    db.commit()
    db.refresh(war_room)
    return war_room


def run_debate(db: Session, user: User, competitor: Competitor, rounds: int = 3) -> WarRoom:
    transcript = list(generate_turns(db, competitor, rounds))
    return save_debate(db, user, competitor, rounds, transcript)
