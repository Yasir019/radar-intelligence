import { Activity, AlertTriangle, Building2, Link2, Loader2, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ChangeEvent, Competitor, StatsOverview } from "../api/types";
import { ActivityChart } from "../components/ActivityChart";
import { ChangeTimeline } from "../components/ChangeTimeline";
import { CompetitorCard } from "../components/CompetitorCard";
import { ImpactChart } from "../components/ImpactChart";
import { inputClass, Modal, primaryBtn, secondaryBtn } from "../components/Modal";

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([
      api.get<StatsOverview>("/stats/overview").then((r) => setStats(r.data)),
      api.get<ChangeEvent[]>("/changes?limit=8").then((r) => setChanges(r.data)),
      api.get<Competitor[]>("/competitors").then((r) => setCompetitors(r.data)),
    ]);

  useEffect(() => {
    load();
  }, []);

  const changesByCompetitor = new Map<number, number>();
  for (const c of changes) {
    if (c.competitor_id != null) {
      changesByCompetitor.set(c.competitor_id, (changesByCompetitor.get(c.competitor_id) ?? 0) + 1);
    }
  }

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/competitors", {
        name,
        website: website.startsWith("http") ? website : `https://${website}`,
        color: COLORS[competitors.length % COLORS.length],
      });
      setAddOpen(false);
      setName("");
      setWebsite("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const checkAll = async () => {
    setCheckingAll(true);
    try {
      await api.post("/checks/run");
      await load();
    } finally {
      setCheckingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            What your competitors changed, analyzed by AI
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={checkAll} disabled={checkingAll} className={secondaryBtn}>
            {checkingAll ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Check all now
          </button>
          <button onClick={() => setAddOpen(true)} className={primaryBtn}>
            <Plus size={15} />
            Add competitor
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Building2} label="Competitors" value={stats.competitors} accent="bg-indigo-50 text-indigo-600" />
          <StatCard icon={Link2} label="Tracked pages" value={stats.tracked_urls} accent="bg-sky-50 text-sky-600" />
          <StatCard icon={Activity} label="Changes (7d)" value={stats.changes_7d} accent="bg-emerald-50 text-emerald-600" />
          <StatCard icon={AlertTriangle} label="High impact (7d)" value={stats.high_impact_7d} accent="bg-red-50 text-red-600" />
        </div>
      )}

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityChart data={stats.timeline} />
          <ImpactChart data={stats.impact_distribution} />
        </div>
      )}

      <ChangeTimeline changes={changes} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Competitors</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {competitors.map((c) => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              changeCount={changesByCompetitor.get(c.id) ?? 0}
            />
          ))}
        </div>
        {competitors.length === 0 && (
          <div className="card p-10 text-center text-sm text-gray-400">
            No competitors yet — add your first one to start monitoring.
          </div>
        )}
      </div>

      <Modal title="Add competitor" open={addOpen} onClose={() => setAddOpen(false)}>
        <form onSubmit={addCompetitor} className="space-y-3">
          <input
            required
            placeholder="Company name (e.g. Acme Analytics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            required
            placeholder="Website (e.g. acme.com)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add competitor
          </button>
        </form>
      </Modal>
    </div>
  );
}
