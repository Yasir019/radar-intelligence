import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileText,
  Filter,
  MoreVertical,
  Rocket,
  Search,
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
import type { ChangeEvent, DashboardStats } from "../api/types";
import { CompanyLogo } from "../components/CompanyLogo";

const RANGE_OPTIONS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 180, label: "6M" },
  { days: 365, label: "1Y" },
];

const categoryLabels: Record<string, string> = {
  new_feature: "Product & features",
  pricing_change: "Pricing",
  messaging_change: "Content",
  promotion: "Partnerships",
  other: "Other",
};

const movementPill: Record<string, string> = {
  new_feature: "border-violet-200 bg-violet-50 text-violet-600",
  pricing_change: "border-orange-200 bg-orange-50 text-orange-600",
  messaging_change: "border-sky-200 bg-sky-50 text-sky-600",
  promotion: "border-emerald-200 bg-emerald-50 text-emerald-600",
  other: "border-slate-200 bg-slate-50 text-slate-500",
};

const activityPill: Record<string, string> = {
  "Very high": "border-emerald-200 bg-emerald-50 text-emerald-700",
  High: "border-green-200 bg-green-50 text-green-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-50 text-slate-500",
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

function Growth({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
      {Math.abs(value)}%
    </span>
  );
}

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [showTopMovement, setShowTopMovement] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<DashboardStats>(`/stats/dashboard?days=${days}`).then((response) => setDashboard(response.data)),
      api.get<ChangeEvent[]>("/changes?limit=100").then((response) => setChanges(response.data)),
    ]).finally(() => setLoading(false));
  }, [days]);

  const priorityAlerts = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return changes
      .filter(
        (change) =>
          new Date(`${change.detected_at}${/z$|[+-]\d\d:\d\d$/i.test(change.detected_at) ? "" : "Z"}`).getTime() >= cutoff,
      )
      .sort(
        (a, b) =>
          (b.impact_score ?? 0) - (a.impact_score ?? 0) ||
          new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
      )
      .slice(0, 4);
  }, [changes, days]);

  const filteredCompetitors = useMemo(() => {
    if (!dashboard) return [];
    const query = search.trim().toLowerCase();
    return dashboard.competitors.filter(
      (competitor) =>
        (!query || competitor.competitor_name.toLowerCase().includes(query)) &&
        (!activeOnly || competitor.activity_score >= 35),
    );
  }, [activeOnly, dashboard, search]);

  useEffect(() => {
    setPage(1);
  }, [search, activeOnly, days]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredCompetitors.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleCompetitors = filteredCompetitors.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading || !dashboard) {
    return <div className="card p-12 text-center text-sm text-gray-400">Preparing dashboard…</div>;
  }

  const chartData = dashboard.timeline.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const summaryMetrics = [
    {
      label: "Competitors",
      value: dashboard.summary.competitors,
      growth: null,
      icon: Building2,
      style: "bg-[#eee8ff] text-[#6745cf]",
    },
    {
      label: "Total changes",
      value: dashboard.summary.total_changes,
      growth: dashboard.summary.changes_growth_pct,
      icon: TrendingUp,
      style: "bg-[#e8f7f0] text-[#188e68]",
    },
    {
      label: "High impact",
      value: dashboard.summary.high_impact,
      growth: dashboard.summary.high_impact_growth_pct,
      icon: AlertTriangle,
      style: "bg-[#eee8ff] text-[#7651dc]",
    },
    {
      label: "New launches",
      value: dashboard.summary.new_launches,
      growth: dashboard.summary.launches_growth_pct,
      icon: Rocket,
      style: "bg-[#fff2df] text-[#e68b25]",
    },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-3">
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card overflow-hidden !rounded-xl">
          <div className="px-4 pb-0 pt-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="!font-['Georgia'] !text-[18px] !font-bold !tracking-[-0.02em]">Market movement</h1>
                <p className="mt-0.5 text-[10px] text-[#97919d]">Activity volume over time</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-[#e6e2e9] bg-[#faf9fb] p-0.5">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => setDays(option.days)}
                      className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold transition ${
                        days === option.days
                          ? "bg-[#2e2559] text-white shadow-sm"
                          : "text-[#89838f] hover:text-[#3d3745]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6e2e9] bg-white text-[#77717e]"
                  aria-label="Chart filters"
                >
                  <Filter size={13} />
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                ["#6544d7", "All activity"],
                ["#8a6aef", "Product & features"],
                ["#f07b43", "Pricing"],
                ["#1b9a72", "Partnerships"],
                ["#2696df", "Leadership"],
              ].map(([color, label]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#ece9ef] bg-white px-2 py-1 text-[8px] font-semibold text-[#716b76]"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-[265px] px-2 pt-2 sm:px-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: -28, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e5eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#99939f" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#99939f" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 9,
                    border: "1px solid #ded9e6",
                    boxShadow: "0 8px 20px rgba(49,31,90,.1)",
                    fontSize: 10,
                  }}
                  formatter={(value) => [value as number, "Changes"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6041da"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#6041da", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid border-t border-[#ebe8ee] sm:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map(({ label, value, growth, icon: Icon, style }, index) => (
              <div
                key={label}
                className={`flex min-h-[74px] items-center gap-3 px-4 py-3 ${
                  index > 0 ? "border-t border-[#ebe8ee] sm:border-l xl:border-t-0" : ""
                } ${index === 2 ? "sm:border-t xl:border-t-0" : ""}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style}`}>
                  <Icon size={14} />
                </span>
                <div>
                  <p className="text-[9px] font-medium text-[#8d8793]">{label}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <strong className="text-[17px] leading-none text-[#211b2a]">{value}</strong>
                    {growth !== null && <Growth value={growth} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="card overflow-hidden !rounded-xl">
          <div className="flex items-center justify-between border-b border-[#ebe8ee] px-4 py-3.5">
            <h2 className="font-['Georgia'] text-[17px] font-bold text-[#211b2a]">Priority alerts</h2>
            <a href="#competitor-activity" className="text-[9px] font-bold text-[#6041c9]">
              View all
            </a>
          </div>
          {priorityAlerts.length === 0 ? (
            <div className="flex h-[344px] flex-col items-center justify-center px-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={17} />
              </span>
              <p className="mt-3 text-xs font-bold text-[#312b37]">No priority alerts</p>
              <p className="mt-1 text-[10px] leading-4 text-[#98929d]">Important competitor moves will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#efecf1]">
              {priorityAlerts.map((change) => {
                const score = change.impact_score ?? 0;
                const severity =
                  score >= 7
                    ? { label: "High", icon: "bg-red-50 text-red-500", pill: "bg-red-50 text-red-500" }
                    : score >= 4
                      ? { label: "Medium", icon: "bg-amber-50 text-amber-500", pill: "bg-amber-50 text-amber-600" }
                      : { label: "Low", icon: "bg-emerald-50 text-emerald-600", pill: "bg-emerald-50 text-emerald-600" };
                return (
                  <li key={change.id}>
                    <Link
                      to={`/changes/${change.id}`}
                      className="group flex min-h-[84px] items-start gap-3 px-4 py-3 transition hover:bg-[#fbfafc]"
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severity.icon}`}>
                        {change.category === "messaging_change" ? <FileText size={13} /> : <AlertTriangle size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-extrabold text-[#332d39]">{change.competitor_name}</p>
                        <p className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-[#79737e]">
                          {change.summary ?? "Radar is analyzing this movement."}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-[8px] text-[#a09aa4]">{formatDateTime(change.detected_at)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${severity.pill}`}>
                            {severity.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={12} className="mt-5 text-[#b5afb9] transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </section>

      <section id="competitor-activity" className="card overflow-hidden !rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-['Georgia'] text-[17px] font-bold text-[#211b2a]">Competitor activity</h2>
            <span className="hidden text-[9px] text-[#938d98] sm:inline">Snapshot of competitor movement</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-8 w-[170px] items-center gap-2 rounded-lg border border-[#e4e1e7] bg-white px-3 text-[#98929e]">
              <Search size={12} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search competitors"
                className="!w-full !border-0 !bg-transparent !p-0 !text-[9px] !shadow-none !outline-none placeholder:!text-[#aaa5ae] focus:!ring-0"
              />
            </label>
            <button
              type="button"
              onClick={() => setActiveOnly((current) => !current)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[9px] font-bold ${
                activeOnly
                  ? "border-[#7758d3] bg-[#f1edff] text-[#6041c9]"
                  : "border-[#e4e1e7] bg-white text-[#77717d]"
              }`}
            >
              <Filter size={11} />
              Filters
            </button>
            <button
              type="button"
              onClick={() => setShowTopMovement((current) => !current)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[9px] font-bold ${
                showTopMovement
                  ? "border-[#e4e1e7] bg-white text-[#77717d]"
                  : "border-[#7758d3] bg-[#f1edff] text-[#6041c9]"
              }`}
            >
              <Columns3 size={11} />
              Columns
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#e9e6eb] bg-[#faf9fa] text-[8px] font-bold text-[#6f6974]">
                <th className="px-4 py-2.5">Competitor</th>
                <th className="px-3 py-2.5">Activity score</th>
                <th className="px-3 py-2.5">Change vs. prior {days} days</th>
                <th className="px-3 py-2.5">High impact</th>
                {showTopMovement && <th className="px-3 py-2.5">Top movement</th>}
                <th className="px-3 py-2.5">Last change</th>
                <th className="px-3 py-2.5">Trend</th>
                <th className="w-8 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efecf0]">
              {visibleCompetitors.map((competitor) => {
                const trendData = competitor.trend.map((value, index) => ({ index, value }));
                return (
                  <tr key={competitor.competitor_id} className="text-[9px] text-[#5f5964] transition hover:bg-[#fbfafc]">
                    <td className="px-4 py-2">
                      <Link
                        to={`/competitors/${competitor.competitor_id}`}
                        className="flex items-center gap-2 font-extrabold text-[#2f2935]"
                      >
                        <CompanyLogo
                          name={competitor.competitor_name}
                          logoUrl={competitor.competitor_logo_url}
                          color={competitor.competitor_color}
                          size={25}
                          className="rounded-md shadow-none"
                        />
                        {competitor.competitor_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-[10px] text-[#2e2833]">{competitor.activity_score}</strong>
                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${activityPill[competitor.activity_level]}`}>
                          {competitor.activity_level}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Growth value={competitor.change_percent} />
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                          competitor.high_impact > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {competitor.high_impact}
                      </span>
                    </td>
                    {showTopMovement && (
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${
                            movementPill[competitor.top_movement] ?? movementPill.other
                          }`}
                        >
                          {categoryLabels[competitor.top_movement] ?? "Other"}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-[#77717c]">
                      {competitor.last_change ? formatDateTime(competitor.last_change) : "No changes yet"}
                    </td>
                    <td className="h-9 w-32 px-3 py-1">
                      <ResponsiveContainer width="100%" height={25}>
                        <LineChart data={trendData}>
                          <Line type="monotone" dataKey="value" stroke="#6746d7" strokeWidth={1.4} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>
                    <td className="px-2 py-2">
                      <Link
                        to={`/competitors/${competitor.competitor_id}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[#8f8994] hover:bg-[#f0edf3]"
                        aria-label={`Open ${competitor.competitor_name}`}
                      >
                        <MoreVertical size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#ebe8ec] px-4 py-2.5 text-[8px] text-[#8e8893]">
          <span>
            {filteredCompetitors.length === 0
              ? "0 competitors"
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredCompetitors.length)} of ${filteredCompetitors.length} competitors`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e4e0e7] disabled:opacity-35"
            >
              <ChevronLeft size={10} />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .slice(0, 4)
              .map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-6 min-w-6 rounded-md px-1.5 font-bold ${
                    safePage === pageNumber ? "bg-[#2f255e] text-white" : "border border-[#e4e0e7] text-[#77717d]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={safePage === pageCount}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e4e0e7] disabled:opacity-35"
            >
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end pb-1">
        <Link to="/brief" className="inline-flex items-center gap-1 text-[9px] font-bold text-[#6041c9]">
          Open full intelligence brief <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
