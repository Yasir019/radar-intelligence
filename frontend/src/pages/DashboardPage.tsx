import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Link2,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ChangeEvent, StatsOverview } from "../api/types";
import { ActivityChart } from "../components/ActivityChart";
import { ChangeTimeline } from "../components/ChangeTimeline";
import { ImpactChart } from "../components/ImpactChart";
import { secondaryBtn } from "../components/Modal";

const metricStyles = [
  { icon: Building2, color: "bg-[#fff1ec] text-[#e66440]", dot: "bg-[#e66440]" },
  { icon: Link2, color: "bg-[#eaf8ef] text-[#168451]", dot: "bg-[#168451]" },
  { icon: Activity, color: "bg-[#f0ecff] text-[#7457ea]", dot: "bg-[#7457ea]" },
  { icon: AlertTriangle, color: "bg-[#ffedf2] text-[#e43d6c]", dot: "bg-[#e43d6c]" },
];

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

  const metrics = stats
    ? [
        ["Competitors", stats.competitors],
        ["Tracked pages", stats.tracked_urls],
        ["Changes this week", stats.changes_7d],
        ["High impact", stats.high_impact_7d],
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7457ea]">
            Intelligence overview
          </p>
          <h1>Good morning. Here’s what moved.</h1>
          <p className="mt-1 text-sm text-[#7c8a9d]">
            Your market activity, analyzed and prioritized by Radar.
          </p>
        </div>
        <button onClick={checkAll} disabled={checkingAll} className={secondaryBtn}>
          {checkingAll ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Check all now
        </button>
      </div>

      <section className="card grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value], index) => {
          const style = metricStyles[index];
          const Icon = style.icon;
          return (
            <div
              key={label}
              className="relative flex min-h-[108px] items-center gap-4 border-b border-[#edf2f8] px-6 py-5 last:border-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.color}`}>
                <Icon size={17} />
              </span>
              <div>
                <div className="text-xs font-semibold text-[#627087]">{label}</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-[#171527]">
                  {value}
                </div>
              </div>
              <span className={`absolute right-5 top-5 h-1.5 w-1.5 rounded-full ${style.dot}`} />
            </div>
          );
        })}
      </section>

      {stats && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ActivityChart data={stats.timeline} />
          <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl bg-[#332064] p-7 text-white shadow-[0_18px_40px_rgba(55,32,110,0.24)]">
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#9d82ff]" />
            <div className="absolute -bottom-28 left-10 h-60 w-60 rotate-12 rounded-[42%] bg-[#6541cc]" />
            <div className="relative">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4b2ca0]">
                AI ready
              </span>
              <h2 className="mt-5 max-w-[210px] text-[22px] font-extrabold leading-[1.18] tracking-[-0.035em]">
                Turn market changes into your next move.
              </h2>
              <p className="mt-3 max-w-[220px] text-xs leading-5 text-blue-100">
                Generate a focused brief from every signal Radar collected this week.
              </p>
            </div>
            <Link
              to="/brief"
              className="relative mt-auto flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#171527] transition hover:bg-violet-50"
            >
              <Sparkles size={14} className="text-[#7457ea]" />
              Open AI brief
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {stats && (
        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ImpactChart data={stats.impact_distribution} />
          <ChangeTimeline changes={changes} />
        </section>
      )}
    </div>
  );
}
