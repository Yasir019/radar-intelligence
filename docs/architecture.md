# Radar — Architecture Notes

## Request flows

### Scheduled check (n8n Flow A)
1. n8n Schedule trigger fires hourly → `POST /api/checks/run` with `X-API-Key`.
2. Backend sweeps every active tracked URL:
   - httpx GET (15s timeout, browser UA, redirects followed)
   - BeautifulSoup strips `script/style/nav/footer/header/svg/iframe/form`
   - text normalized, capped at 50k chars, SHA-256 hashed
   - hash equal to last snapshot → no-op; different → new snapshot
3. If a prior snapshot existed, a `change_event` is created and immediately:
   - **analyzed** — changed regions (±2 lines context, ≤8k chars/side) sent to
     Groq `openai/gpt-oss-120b` with a JSON-schema `response_format`; validated
     against the `ChangeAnalysis` Pydantic model (1 retry)
   - **alerted** — in-app notification always; POST to `N8N_WEBHOOK_URL`
     (Flow C) if set; direct Slack POST if impact ≥ user threshold
4. The endpoint returns `{checked_urls, errors, new_changes[]}` — n8n splits
   `new_changes` and Slack-alerts items with `impact_score >= 7`.

### Instant fanout (n8n Flow C)
Backend → n8n webhook happens inside the check pipeline (step 3), so alerts fire
the moment a change is analyzed — the hourly schedule is just the sweep cadence.

### Weekly brief (n8n Flow B)
n8n → `POST /api/briefs/generate?days=7` → backend serializes the window's
change events compactly and asks the LLM for a structured markdown brief
(executive summary / per-competitor highlights / threats & opportunities /
recommended actions) → n8n converts to HTML and delivers.

## Demo mode

`config.effective_demo_mode = DEMO_MODE or not GROQ_API_KEY`

| Live path | Demo path |
|---|---|
| Groq API call per change | deterministic canned analysis per page type |
| LLM-written brief | polished pre-written brief |
| n8n schedules checks | seeded 30-day history, nothing to crawl |

The demo experience is seeded by `python -m app.seed_demo` (idempotent; only
touches the demo user's data): 4 competitors × 4 typed URLs, baseline snapshots
31 days back, 14 scripted change events whose old/new snapshots produce real
diffs, matching notifications, and one brief.

## Auth model

- **Users**: JWT (HS256, 7-day expiry) via `Authorization: Bearer`.
- **Machines (n8n)**: static `X-API-Key` == `SERVICE_API_KEY`; machine calls
  operate across all users (n8n is the org-level automation).
- All user-facing queries join through `Competitor.user_id` for scoping.

## Deliberate non-choices

- No Celery/Redis/APScheduler — scheduling is n8n's job; keeps the app simple.
- No Alembic — `create_all()` at startup is the right altitude for SQLite.
- Slack via incoming-webhook HTTP nodes — keeps the exported n8n JSON
  credential-free.
