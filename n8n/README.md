# n8n Automation — "Radar" Workflow

One workflow, three flows, three triggers. This is the automation layer of the
Competitor Intelligence Radar: n8n owns **scheduling and alert delivery**, the
FastAPI backend owns **crawling, change detection, and AI analysis**.

```
Flow A  Every hour ──▶ POST /api/checks/run ──▶ split changes ──▶ impact ≥ 7? ──▶ Slack alert
Flow B  Mon 08:00 ──▶ POST /api/briefs/generate ──▶ markdown → HTML ──▶ Slack brief
Flow C  Webhook  ◀── backend POSTs each analyzed change ──▶ route by category ──▶ Slack channels
```

## Live workflow (already created via n8n MCP)

The workflow has been created directly in the n8n cloud instance:

> **https://airdropshunter.app.n8n.cloud/workflow/3SudoqVvY9C71jJM**

To finish setup, open it and:

1. **Fill the URL placeholders** on the HTTP Request nodes:
   - `Run Competitor Checks` / `Generate Weekly Brief` → your Radar API base URL.
     The cloud n8n cannot reach `localhost` — expose the local API with a tunnel
     (`ngrok http 8000` or `cloudflared tunnel --url http://localhost:8000`) and
     use that URL, e.g. `https://abc123.ngrok.app/api/checks/run`.
   - The four `Slack …` nodes → Slack incoming-webhook URL(s)
     (or a https://webhook.site URL for testing).
2. **Create the "Radar Service API Key" credential** (Header Auth):
   name = `X-API-Key`, value = the `SERVICE_API_KEY` from `backend/.env`.
3. **Publish** the workflow (top-right) to activate the schedules and webhook.

## Alternative: local import

Running n8n locally instead? `npx n8n` → **Workflows → Import from file** →
select `workflows/radar.json` (same workflow; creates a NEW workflow named
"Radar", nothing existing is modified), then apply steps 1-3 above — locally
you can keep `http://localhost:8000` URLs directly.

## Wire the instant fanout (Flow C)

Copy the production webhook URL from the "Change webhook" node
(`http://localhost:5678/webhook/radar-alerts`) into `backend/.env`:

```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/radar-alerts
```

Restart the backend. Every newly analyzed change is now pushed to n8n the
moment it is detected — no polling.

## Test it

- **Flow A**: open the workflow, select the "Every hour" trigger, click
  *Execute workflow*. You should see the API response with `new_changes` flow
  through the branch. (Force a change first: edit a stored snapshot's
  `content_text` in `backend/radar.db`, then execute.)
- **Flow B**: execute from the "Monday 08:00" trigger — a markdown brief is
  generated and delivered.
- **Flow C**: with `N8N_WEBHOOK_URL` set, hit "Check now" in the Radar UI on a
  URL with a forced change; the webhook fires instantly.

## Notes

- Slack delivery uses plain HTTP Request nodes against incoming-webhook URLs so
  the exported JSON contains **no credentials**. Swap them for native Slack
  nodes with OAuth credentials if you prefer.
- The backend works fully without n8n (manual "Check now", direct Slack
  fallback, demo mode) — n8n adds hands-off automation on top.
