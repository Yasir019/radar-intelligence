import { Activity, AlertTriangle, Building2, Link2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ChangeEvent, StatsOverview } from "../api/types";
import { ActivityChart } from "../components/ActivityChart";
import { ChangeTimeline } from "../components/ChangeTimeline";
import { ImpactChart } from "../components/ImpactChart";
import { secondaryBtn } from "../components/Modal";

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
  const [checkingAll, setCheckingAll] = useState(false);

  const load = () =>
    Promise.all([
      api.get<StatsOverview>("/stats/overview").then((r) => setStats(r.data)),
      api.get<ChangeEvent[]>("/changes?limit=10").then((r) => setChanges(r.data)),
    ]);

  useEffect(() => {
    load();
  }, []);

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
        <button onClick={checkAll} disabled={checkingAll} className={secondaryBtn}>
          {checkingAll ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Check all now
        </button>
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
    </div>
  );
}
