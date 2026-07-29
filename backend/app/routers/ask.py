import json
import time

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import AskRequest
from app.services.intel_context import full_intel_context

router = APIRouter(prefix="/api/ask", tags=["ask-radar"])

SYSTEM_PROMPT = """You are Radar's intelligence analyst assistant. Answer the user's questions \
using ONLY the competitive intelligence provided below (their tracked competitors and detected \
changes). Be specific — cite competitor names, dates, impact scores. If the intel doesn't contain \
the answer, say so plainly and suggest what to track. Keep answers tight: short paragraphs or \
bullets, no fluff. You may do simple reasoning across changes (trends, comparisons, priorities).

=== TRACKED INTELLIGENCE ===
{context}
=== END INTELLIGENCE ==="""

_DEMO_ANSWER = (
    "Based on your tracked intel: **Acme Analytics is your most active threat** — a pricing cut "
    "(impact 8/10) plus an embedded-analytics launch in the last 30 days. **PipelineHQ** is the "
    "fastest shipper (AI reporting, free tier). My priority list this week:\n\n"
    "1. Prep the Acme battlecard before renewals — their $69 Pro price will come up\n"
    "2. Brief product on PipelineHQ's AI reporting overlap\n"
    "3. Watch Metricly's enterprise pivot — low urgency, high direction-signal\n\n"
    "*(Demo mode — connect a Groq API key for live answers over your real data.)*"
)


@router.post("/stream")
def ask_stream(
    body: AskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """SSE: streams the assistant's answer token-by-token."""
    context = full_intel_context(db, user)

    def event_stream():
        if settings.effective_demo_mode:
            for word in _DEMO_ANSWER.split(" "):
                yield f"data: {json.dumps({'type': 'delta', 'text': word + ' '})}\n\n"
                time.sleep(0.02)
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        messages = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context)}]
        messages += [m.model_dump() for m in body.messages[-10:]]

        stream = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            max_tokens=1536,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield f"data: {json.dumps({'type': 'delta', 'text': delta})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
