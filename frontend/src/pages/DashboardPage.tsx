import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  Filter,
  Link2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import type { ChangeEvent, Competitor, StatsOverview } from "../api/types";
import { CompanyLogo } from "../components/CompanyLogo";

type MovementFilter = "all" | "high" | "pricing" | "features";

const metricStyles = [
  { icon: Building2, iconClass: "bg-[#f0eaff] text-[#6d45d8]" },
  { icon: Link2, iconClass: "bg-[#e6f7f0] text-[#159268]" },
  { icon: TrendingUp, iconClass: "bg-[#e7f3ff] text-[#1688d4]" },
  { icon: AlertTriangle, iconClass: "bg-[#fff0e8] text-[#ef624c]" },
];

const categoryLabels: Record<string, string> = {
  pricing_change: "Pricing",
  new_feature: "Product & features",
  messaging_change: "Messaging",
  promotion: "Promotion",
  other: "Other",
};

function formatDateTime(value: string): string {
  const normalized = /z$|[+-]\d\d:\d\d$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function matchesFilter(change: ChangeEvent, filter: MovementFilter): boolean {
  if (filter === "all") return true;
  if (filter === "high") return (change.impact_score ?? 0) >= 7;
  if (filter === "pricing") return change.category === "pricing_change" || change.page_type === "pricing";
  return change.category === "new_feature" || change.page_type === "features";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [checkingAll, setCheckingAll] = useState(false);
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("all");

  const load = () =>
    Promise.all([
      api.get<StatsOverview>("/stats/overview").then((response) => setStats(response.data)),
      api.get<ChangeEvent[]>("/changes?limit=200").then((response) => setChanges(response.data)),
      api.get<Competitor[]>("/competitors").then((response) => setCompetitors(response.data)),
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

  const movementData = useMemo(() => {
    if (!stats) return [];
    if (movementFilter === "all") {
      return stats.timeline.map((point) => ({
        ...point,
        label: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
    }
    const counts = new Map<string, number>();
    changes.filter((change) => matchesFilter(change, movementFilter)).forEach((change) => {
      const key = change.detected_at.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return stats.timeline.map((point) => ({
      ...point,
      count: counts.get(point.date.slice(0, 10)) ?? 0,
      label: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [changes, movementFilter, stats]);

  const priorityAlerts = useMemo(
    () =>
      [...changes]
        .filter((change) => (change.impact_score ?? 0) >= 4)
        .sort(
          (a, b) =>
            (b.impact_score ?? 0) - (a.impact_score ?? 0) ||
            new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
        )
        .slice(0, 4),
    [changes],
  );

  const metricData = stats
    ? [
        ["Competitors", stats.competitors, "Active workspace"],
        ["Tracked pages", stats.tracked_urls, "Currently monitored"],
        ["Changes this week", stats.changes_7d, "Detected in 7 days"],
        ["High impact", stats.high_impact_7d, "Need attention"],
      ]
    : [];

  if (!stats) {
    return <div className="card p-12 text-center text-sm text-gray-400">Loading intelligence…</div>;
  }

  const rangeStart = stats.timeline[0]?.date
    ? new Date(stats.timeline[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Last 30 days";
  const rangeEnd = stats.timeline.at(-1)?.date
    ? new Date(stats.timeline.at(-1)!.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 py-1">
        <div>
          <h1 className="!text-[26px] !font-extrabold">Good morning. Here’s what moved.</h1>
          <p className="mt-1 text-sm text-[#7d8797]">Your market activity, analyzed and prioritized by Radar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#e2dfe8] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#5f6672]">
            <CalendarDays size={15} className="text-[#7a6e91]" />
            {rangeStart}{rangeEnd ? ` – ${rangeEnd}` : ""}
          </div>
          <Link
            to="/brief"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6541cf] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(101,65,207,0.24)] transition hover:bg-[#5533bd]"
          >
            <Sparkles size={15} />
            Generate brief
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricData.map(([label, value, helper], index) => {
          const style = metricStyles[index];
          const Icon = style.icon;
          return (
            <div key={label} className="card flex min-h-[108px] items-center gap-4 px-5 py-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}>
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#737785]">{label}</p>
                <p className="mt-0.5 text-[24px] font-extrabold leading-none tracking-[-0.04em] text-[#161322]">
                  {value}
                </p>
                <p className="mt-2 text-[10px] font-medium text-[#9a9daa]">{helper}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#1f1a2d]">Market movement</h2>
              <p className="mt-0.5 text-[11px] text-[#9995a2]">Activity volume over the last 30 days</p>
            </div>
            <button
              type="button"
              onClick={checkAll}
              disabled={checkingAll}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e2dfe8] bg-white px-3 py-2 text-[11px] font-bold text-[#625b70] transition hover:bg-[#faf9fc] disabled:opacity-50"
            >
              {checkingAll ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {checkingAll ? "Scanning" : "Scan now"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All activity"],
                ["high", "High impact"],
                ["pricing", "Pricing"],
                ["features", "Product & features"],
              ] as [MovementFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMovementFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition ${
                  movementFilter === value
                    ? "border-[#8b6ee8] bg-[#f1edff] text-[#5d3ac3]"
                    : "border-[#ebe8ef] bg-white text-[#7d7885] hover:bg-[#faf9fc]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementData} margin={{ top: 12, right: 10, left: -26, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceaf0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9996a2" }}
                  tickLine={false}
                  axisLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9996a2" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e3dfeb",
                    boxShadow: "0 8px 24px rgba(60,35,110,.1)",
                    fontSize: 11,
                  }}
                  formatter={(value) => [value as number, "Changes"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6945d5"
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: "#fff", stroke: "#6945d5", strokeWidth: 1.8 }}
                  activeDot={{ r: 4, fill: "#6945d5" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ece9f1] px-5 py-4">
            <div>
              <h2 className="text-base font-extrabold text-[#1f1a2d]">Priority alerts</h2>
              <p className="mt-0.5 text-[11px] text-[#9995a2]">Moves worth reviewing now</p>
            </div>
            <AlertTriangle size={16} className="text-[#e45d55]" />
          </div>
          {priorityAlerts.length === 0 ? (
            <div className="flex min-h-[295px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} />
              </span>
              <p className="mt-3 text-sm font-bold text-[#383243]">No priority alerts</p>
              <p className="mt-1 text-xs leading-5 text-[#9995a2]">Important competitor moves will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0edf3]">
              {priorityAlerts.map((change) => {
                const high = (change.impact_score ?? 0) >= 7;
                return (
                  <li key={change.id}>
                    <Link
                      to={`/changes/${change.id}`}
                      className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#faf9fc]"
                    >
                      <CompanyLogo
                        name={change.competitor_name}
                        logoUrl={change.competitor_logo_url}
                        color={change.competitor_color}
                        size={32}
                        className="rounded-lg shadow-none"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[11px] font-extrabold text-[#2a2534]">
                            {change.competitor_name}
                          </span>
                          <span
                            className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              high ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {high ? "High" : "Medium"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#777180]">
                          {change.summary ?? "Analysis pending."}
                        </p>
                        <p className="mt-1 text-[9px] text-[#aaa5b0]">{formatDateTime(change.detected_at)}</p>
                      </div>
                      <ChevronRight size={13} className="mt-2 text-[#b9b4c0] transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e6ed] px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-[#1f1a2d]">Competitor activity</h2>
            <p className="mt-0.5 text-[11px] text-[#9995a2]">A real-time snapshot of monitored companies</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-lg border border-[#e3e0e8] bg-white px-3 py-2 text-[10px] text-[#8b8792] sm:flex">
              <Filter size={12} />
              Last 30 days
            </span>
            <Link
              to="/competitors"
              className="inline-flex items-center gap-1 rounded-lg bg-[#f1edff] px-3 py-2 text-[10px] font-bold text-[#5e3ac4]"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {competitors.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-bold text-[#393341]">No competitors yet</p>
            <Link to="/competitors" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#6541cf]">
              Add your first competitor <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ebe8ef] bg-[#faf9fb] text-[9px] font-bold uppercase tracking-[0.08em] text-[#918b99]">
                  <th className="px-5 py-3">Competitor</th>
                  <th className="px-4 py-3">Pages monitored</th>
                  <th className="px-4 py-3">Changes</th>
                  <th className="px-4 py-3">High impact</th>
                  <th className="px-4 py-3">Top movement</th>
                  <th className="px-4 py-3">Last change</th>
                  <th className="px-4 py-3">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0edf3]">
                {competitors.slice(0, 7).map((competitor) => {
                  const competitorChanges = changes.filter((change) => change.competitor_id === competitor.id);
                  const activePages = competitor.tracked_urls.filter((trackedUrl) => trackedUrl.is_active).length;
                  const highImpact = competitorChanges.filter((change) => (change.impact_score ?? 0) >= 7).length;
                  const categoryCounts = new Map<string, number>();
                  competitorChanges.forEach((change) => {
                    const category = change.category ?? "other";
                    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
                  });
                  const topCategory =
                    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
                  const latest = competitorChanges[0];
                  const trendKeys = stats.timeline.slice(-14).map((point) => point.date.slice(0, 10));
                  const trendData = trendKeys.map((date) => ({
                    date,
                    value: competitorChanges.filter((change) => change.detected_at.slice(0, 10) === date).length,
                  }));

                  return (
                    <tr key={competitor.id} className="text-[11px] text-[#5f5968] transition hover:bg-[#fbfaff]">
                      <td className="px-5 py-3">
                        <Link
                          to={`/competitors/${competitor.id}`}
                          className="flex items-center gap-2.5 font-bold text-[#282331]"
                        >
                          <CompanyLogo
                            name={competitor.name}
                            logoUrl={competitor.logo_url}
                            color={competitor.color}
                            size={28}
                            className="rounded-md shadow-none"
                          />
                          {competitor.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-[#282331]">{activePages}</span>
                        <span className="ml-1 text-[#aaa5b0]">active</span>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-[#282331]">{competitorChanges.length}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex min-w-6 justify-center rounded-full px-2 py-1 text-[9px] font-bold ${
                            highImpact > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {highImpact}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-[#ddd3f7] bg-[#f5f1ff] px-2.5 py-1 text-[9px] font-bold text-[#6541c8]">
                          {categoryLabels[topCategory] ?? "Other"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-[#7e7886]">
                        {latest ? formatDateTime(latest.detected_at) : "No changes yet"}
                      </td>
                      <td className="h-10 w-28 px-4 py-1">
                        <ResponsiveContainer width="100%" height={30}>
                          <LineChart data={trendData}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#6d4bd2"
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 pb-1 text-[10px] text-[#a09aa7]">
        <FileText size={12} />
        Intelligence updates automatically as Radar scans your tracked pages.
      </div>
    </div>
  );
}
