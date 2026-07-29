from sqlalchemy.orm import Session

from app.config import settings
from app.models import Battlecard, Competitor, User
from app.services.intel_context import competitor_changes, serialize_changes

SYSTEM_PROMPT = """You are a competitive-enablement specialist writing a sales battlecard for a \
B2B SaaS team competing against {competitor}. Using ONLY the tracked intelligence provided, write \
a crisp markdown battlecard with exactly these sections:

# Battlecard: {competitor}
## Snapshot  (2 sentences: who they are and their current strategic posture)
## Their Recent Moves  (3-5 bullets from the tracked changes, most important first)
## Their Strengths  (3 bullets — be honest)
## Their Weaknesses & Risks  (3-4 bullets — infer from their moves)
## How We Win  (3 concrete counter-plays)
## Objection Handling  (2-3 "If the prospect says X → respond Y" pairs)

Be specific, reference the actual tracked moves, keep it under 500 words. Markdown only."""

_DEMO_BATTLECARD = """# Battlecard: {name}

## Snapshot
{name} is an aggressive mid-market player currently competing on price and release velocity. Their recent moves suggest a land-grab strategy: win volume now, monetize expansion later.

## Their Recent Moves
- **Cut Pro pricing ~13%** and added a usage-based add-on (impact 8/10)
- Shipped AI-assisted reporting, closing a feature gap (impact 7/10)
- Launched a free tier aimed at bottom-up adoption (impact 6/10)

## Their Strengths
- Fast release cadence — features ship in weeks, not quarters
- Sharp price positioning for budget-conscious buyers
- Strong top-of-funnel motion with the new free tier

## Their Weaknesses & Risks
- Usage-based pricing creates unpredictable bills — the #1 churn driver in mid-market
- Discount-led selling trains customers to wait for promotions
- Supporting three pricing models at once strains their success team
- Free-tier users rarely convert without heavy nurture spend

## How We Win
1. **Lead with total cost of ownership** — show the 12-month bill, not the sticker
2. **Sell predictability** — flat pricing + included features vs their add-on maze
3. **Target their upgrade cliff** — their free/Starter users who hit limits are our best prospects

## Objection Handling
- **"They're cheaper."** → "Their sticker is lower; their invoice isn't. Here's a 12-month comparison including their usage add-on."
- **"They just shipped AI reporting."** → "Shipped ≠ mature. Ask them about accuracy guarantees and data controls — then let's demo ours side by side."
"""


def generate_battlecard(db: Session, user: User, competitor: Competitor) -> Battlecard:
    if settings.effective_demo_mode:
        content = _DEMO_BATTLECARD.format(name=competitor.name)
    else:
        from groq import Groq

        events = competitor_changes(db, competitor)
        client = Groq(api_key=settings.groq_api_key)
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(competitor=competitor.name)},
                {
                    "role": "user",
                    "content": (
                        f"Competitor: {competitor.name} ({competitor.website})\n"
                        + (f"Analyst notes: {competitor.notes}\n" if competitor.notes else "")
                        + f"\nTracked changes (last 90 days):\n{serialize_changes(events)}"
                    ),
                },
            ],
            max_tokens=2048,
        )
        content = completion.choices[0].message.content or "(battlecard generation returned empty)"

    battlecard = Battlecard(user_id=user.id, competitor_id=competitor.id, content_md=content)
    db.add(battlecard)
    db.commit()
    db.refresh(battlecard)
    return battlecard
