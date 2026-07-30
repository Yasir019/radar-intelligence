import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock3,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ChangeEvent, Competitor, StatsOverview } from "../api/types";
import { ActivityChart } from "../components/ActivityChart";
import { CompanyLogo } from "../components/CompanyLogo";
import { ImpactChart } from "../components/ImpactChart";
import { secondaryBtn } from "../components/Modal";

const metricStyles = [
  { icon: AlertTriangle, color: "bg-[#ffedf2] text-[#d92f5f]" },
  { icon: ScanSearch, color: "bg-[#f0ecff] text-[#7457ea]" },
  { icon: Building2, color: "bg-[#fff1ec] text-[#e66440]" },
  { icon: Link2, color: "bg-[#eaf8ef] text-[#168451]" },
];

function formatTime(value: string): string {
  const normalized = /z$|[+-]\d\d:\d\d$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function lastCheckedLabel(competitor: Competitor): string {
  const dates = competitor.tracked_urls
    .map((trackedUrl) => trackedUrl.last_checked_at)
    .filter((value): value is string => Boolean(value));
  if (dates.length === 0) return "Not scanned yet";
  const latest = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return `Checked ${formatTime(latest)}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [checkingAll, setCheckingAll] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const load = () =>
    Promise.all([
      api.get<StatsOverview>("/stats/overview").then((response) => setStats(response.data)),
      api.get<ChangeEvent[]>("/changes?limit=20").then((response) => setChanges(response.data)),
      api.get<Competitor[]>("/competitors").then((response) => setCompetitors(response.data)),
    ]);

  useEffect(() => {
    load();
  }, []);

  const checkAll = async () => {
    setCheckingAll(true);
    setScanMessage(null);
    try {
      const response = await api.post<{ checked_urls: number; errors: number; new_changes: ChangeEvent[] }>(
        "/checks/run",
      );
      await load();
      const detected = response.data.new_changes.length;
      setScanMessage(
        detected > 0
          ? `${detected} new ${detected === 1 ? "change" : "changes"} detected.`
          : "Scan complete. No new changes detected.",
      );
    } finally {
      setCheckingAll(false);
    }
  };

  const urgentChanges = changes.filter((change) => (change.impact_score ?? 0) >= 7).slice(0, 3);
  const latestChanges = changes.slice(0, 6);

  const changesByCompetitor = useMemo(() => {
    const counts = new Map<number, number>();
    changes.forEach((change) => {
      if (change.competitor_id != null) {
        counts.set(change.competitor_id, (counts.get(change.competitor_id) ?? 0) + 1);
      }
    });
    return counts;
  }, [changes]);

  const activityTakeaway = useMemo(() => {
    if (!stats) return "";
    const current = stats.timeline.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const previous = stats.timeline.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
    if (current === 0) return "No market movement was detected in the last 7 days.";
    if (previous === 0) return `${current} changes appeared in the last 7 days.`;
    const percentage = Math.round(((current - previous) / previous) * 100);
    return percentage >= 0
      ? `Market activity is up ${percentage}% versus the previous week.`
      : `Market activity is down ${Math.abs(percentage)}% versus the previous week.`;
  }, [stats]);

  const metrics = stats
    ? [
        ["Needs attention", stats.high_impact_7d, "Important changes this week"],
        ["Changes found", stats.changes_7d, "Detected in the last 7 days"],
        ["Competitors monitored", stats.competitors, "Companies in your workspace"],
        ["Pages monitored", stats.tracked_urls, "Pricing, product, and news pages"],
      ]
    : [];

  if (!stats) {
    return <div className="card p-12 text-center text-sm text-gray-400">Preparing your intelligence view…</div>;
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7457ea]">
            Market command center
          </p>
          <h1>Here’s what needs your attention.</h1>
          <p className="mt-1 text-sm text-[#7c8a9d]">
            Important competitor moves first, supporting data second.
          </p>
        </div>
        <button onClick={checkAll} disabled={checkingAll} className={secondaryBtn}>
          {checkingAll ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {checkingAll ? "Scanning…" : "Scan competitors now"}
        </button>
      </header>

      {scanMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <ShieldCheck size={16} />
          {scanMessage}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f8] px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle size={16} />
                </span>
                <h2 className="text-base font-bold text-[#171527]">Needs your attention</h2>
              </div>
              <p className="mt-1 pl-10 text-xs text-[#8a96a8]">
                High-importance moves detected during the last 7 days
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              {stats.high_impact_7d} open
            </span>
          </div>

          {urgentChanges.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </span>
              <p className="mt-3 text-sm font-semibold text-gray-800">Nothing urgent right now</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                Radar has not detected any high-importance competitor moves in your recent activity.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f3f7]">
              {urgentChanges.map((change) => (
                <li key={change.id}>
                  <Link
                    to={`/changes/${change.id}`}
                    className="group flex items-center gap-4 px-6 py-4 transition hover:bg-[#faf9fd]"
                  >
                    <CompanyLogo
                      name={change.competitor_name}
                      logoUrl={change.competitor_logo_url}
                      color={change.competitor_color}
                      size={38}
                      className="rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#252235]">{change.competitor_name}</span>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                          High priority
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[13px] text-[#69768a]">
                        {change.summary ?? "Radar is analyzing this change."}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#7457ea]">
                      Review <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="card flex flex-col p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8d87a0]">Weekly summary</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[#171527]">
            Turn signals into a clear team update.
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#7a7488]">
            Radar organizes important moves, risks, and recommended responses into one brief.
          </p>
          <div className="my-5 space-y-2 border-y border-[#eeeaf5] py-4 text-xs text-[#6d6878]">
            <div className="flex items-center justify-between">
              <span>Changes this week</span>
              <strong className="text-[#171527]">{stats.changes_7d}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Need attention</span>
              <strong className="text-[#d92f5f]">{stats.high_impact_7d}</strong>
            </div>
          </div>
          <Link
            to="/brief"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#7457ea] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#6043d6]"
          >
            <FileText size={14} />
            View weekly summary
            <ArrowRight size={13} />
          </Link>
        </aside>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-[#171527]">This week at a glance</h2>
          <p className="mt-0.5 text-xs text-[#8a96a8]">A simple summary of coverage and detected movement</p>
        </div>
        <div className="card grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, description], index) => {
            const style = metricStyles[index];
            const Icon = style.icon;
            return (
              <div
                key={label}
                className="flex min-h-[122px] items-start gap-3 border-b border-[#edf2f8] px-5 py-5 last:border-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.color}`}>
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-[23px] font-extrabold tracking-[-0.04em] text-[#171527]">{value}</div>
                  <div className="text-xs font-bold text-[#4f5c70]">{label}</div>
                  <p className="mt-1 text-[11px] leading-4 text-[#98a3b3]">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-[#24324a]">Competitor monitoring</h2>
              <p className="mt-0.5 text-xs text-[#94a1b3]">Coverage and scan status by company</p>
            </div>
            <Link to="/competitors" className="text-xs font-bold text-[#7457ea] hover:text-[#6043d6]">
              View all
            </Link>
          </div>
          {competitors.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-gray-700">No competitors added yet</p>
              <Link to="/competitors" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#7457ea]">
                Add your first competitor <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f3f7]">
              {competitors.slice(0, 5).map((competitor) => {
                const activePages = competitor.tracked_urls.filter((trackedUrl) => trackedUrl.is_active).length;
                const recentChanges = changesByCompetitor.get(competitor.id) ?? 0;
                return (
                  <li key={competitor.id}>
                    <Link
                      to={`/competitors/${competitor.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#faf9fd]"
                    >
                      <CompanyLogo
                        name={competitor.name}
                        logoUrl={competitor.logo_url}
                        color={competitor.color}
                        size={34}
                        className="rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-[#252235]">{competitor.name}</span>
                          <span className="text-[11px] font-semibold text-[#6f7c8e]">
                            {recentChanges} recent
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#98a3b3]">
                          <span className={activePages > 0 ? "text-emerald-600" : "text-amber-600"}>
                            {activePages > 0 ? `${activePages} pages monitored` : "Setup needed"}
                          </span>
                          <span>•</span>
                          <span className="truncate">{lastCheckedLabel(competitor)}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[#c5cbd5]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-[#24324a]">Latest intelligence</h2>
              <p className="mt-0.5 text-xs text-[#94a1b3]">Newest competitor moves in plain language</p>
            </div>
            <Clock3 size={15} className="text-[#a4adbb]" />
          </div>
          {latestChanges.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No changes yet. Scan tracked pages to begin.
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f3f7]">
              {latestChanges.map((change) => {
                const importance =
                  (change.impact_score ?? 0) >= 7
                    ? { label: "High", className: "bg-red-50 text-red-600" }
                    : (change.impact_score ?? 0) >= 4
                      ? { label: "Medium", className: "bg-violet-50 text-violet-600" }
                      : { label: "Low", className: "bg-slate-100 text-slate-500" };
                return (
                  <li key={change.id}>
                    <Link
                      to={`/changes/${change.id}`}
                      className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#faf9fd]"
                    >
                      <CompanyLogo
                        name={change.competitor_name}
                        logoUrl={change.competitor_logo_url}
                        color={change.competitor_color}
                        size={34}
                        className="rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#252235]">{change.competitor_name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${importance.className}`}>
                            {importance.label}
                          </span>
                          <span className="ml-auto shrink-0 text-[10px] text-[#a0a9b7]">
                            {formatTime(change.detected_at)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[12px] leading-5 text-[#69768a]">
                          {change.summary ?? "Analysis is being prepared."}
                        </p>
                      </div>
                      <ArrowRight size={13} className="text-[#c5cbd5] transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#171527]">Market trends</h2>
            <p className="mt-0.5 text-xs text-[#8a96a8]">30-day context for deeper analysis</p>
          </div>
          <p className="rounded-full bg-[#f1edff] px-3 py-1.5 text-xs font-semibold text-[#6648c7]">
            {activityTakeaway}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ActivityChart data={stats.timeline} />
          <ImpactChart data={stats.impact_distribution} />
        </div>
      </section>
    </div>
  );
}
