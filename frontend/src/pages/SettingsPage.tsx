import { Check, Copy, Loader2, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { UserSettings } from "../api/types";
import { inputClass, primaryBtn } from "../components/Modal";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-500">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          {value}
        </code>
        <button
          onClick={copy}
          className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [webhook, setWebhook] = useState("");
  const [threshold, setThreshold] = useState(7);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<UserSettings>("/settings").then((r) => {
      setSettings(r.data);
      setWebhook(r.data.slack_webhook_url ?? "");
      setThreshold(r.data.alert_impact_threshold);
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", {
        slack_webhook_url: webhook || null,
        alert_impact_threshold: threshold,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-10 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Alerts and automation configuration</p>
      </div>

      <form onSubmit={save} className="card space-y-5 p-6">
        <h3 className="text-sm font-semibold text-gray-900">Alerts</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Slack incoming webhook URL (direct fallback when n8n is not running)
          </label>
          <input
            placeholder="https://hooks.slack.com/services/…"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Alert impact threshold — notify externally when impact ≥{" "}
            <span className="font-semibold text-gray-900">{threshold}</span>/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>1 — everything</span>
            <span>10 — only critical</span>
          </div>
        </div>
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saved ? "Saved" : "Save settings"}
        </button>
      </form>

      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Workflow size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">n8n Automation</h3>
            <p className="text-xs text-gray-400">
              The "Radar" workflow in n8n schedules checks, routes alerts, and delivers weekly briefs
            </p>
          </div>
        </div>
        <CopyField
          label="Check endpoint (n8n HTTP Request node, Flow A)"
          value="https://radar-api-1mdq.onrender.com/api/checks/run"
        />
        <CopyField
          label="Brief endpoint (Flow B)"
          value="https://radar-api-1mdq.onrender.com/api/briefs/generate?days=7"
        />
        <p className="text-xs leading-5 text-gray-400">
          The n8n "Radar" workflow is already configured and live: hourly checks (Flow A), the Monday
          08:00 brief (Flow B), and instant alert fanout via webhook (Flow C). These endpoints are shown
          for reference — n8n authenticates with the{" "}
          <code className="rounded bg-gray-100 px-1">X-API-Key</code> header set to the backend's{" "}
          <code className="rounded bg-gray-100 px-1">SERVICE_API_KEY</code>.
        </p>
      </div>
    </div>
  );
}
