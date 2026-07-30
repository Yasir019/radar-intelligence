import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { FileText, Globe2, MoreHorizontal, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { ChangeEvent, Competitor } from "../api/types";
import { CompanyLogo } from "./CompanyLogo";

function relativeTime(value: string | undefined): string {
  if (!value) return "No changes";
  const normalized = /z$|[+-]\d\d:\d\d$/i.test(value) ? value : `${value}Z`;
  const hours = Math.max(0, Math.floor((Date.now() - new Date(normalized).getTime()) / 3_600_000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function CompetitorCard({
  competitor,
  changes,
  view,
  onEdit,
  onDelete,
}: {
  competitor: Competitor;
  changes: ChangeEvent[];
  view: "grid" | "list";
  onEdit: (competitor: Competitor) => void;
  onDelete: (competitor: Competitor) => void;
}) {
  const activeUrls = competitor.tracked_urls.filter((url) => url.is_active).length;
  const isActive = activeUrls > 0;
  const recentChanges = changes.filter((change) => {
    const normalized = /z$|[+-]\d\d:\d\d$/i.test(change.detected_at)
      ? change.detected_at
      : `${change.detected_at}Z`;
    return new Date(normalized).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  });
  const lastChange = recentChanges[0]?.detected_at;
  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      day: index,
      value: recentChanges.filter((change) => change.detected_at.slice(0, 10) === key).length,
    };
  });
  const chartColor = competitor.color || "#7457ea";

  if (view === "list") {
    return (
      <div className="card flex flex-wrap items-center gap-4 px-5 py-4 !rounded-xl">
        <Link to={`/competitors/${competitor.id}`} className="flex min-w-[240px] flex-1 items-center gap-3">
          <CompanyLogo
            name={competitor.name}
            logoUrl={competitor.logo_url}
            color={competitor.color}
            size={42}
            className="rounded-lg"
          />
          <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold text-[#292334]">{competitor.name}</h3>
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#77717d]">
              <Globe2 size={10} />
              {competitor.website.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </Link>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isActive ? "● Active" : "● Setup needed"}
        </span>
        <div className="grid min-w-[320px] flex-1 grid-cols-3 gap-5 text-[11px] text-[#706a77]">
          <span><strong className="block text-[15px] text-[#2b2533]">{activeUrls}</strong>tracked pages</span>
          <span><strong className="block text-[15px] text-[#2b2533]">{recentChanges.length}</strong>changes (30d)</span>
          <span><strong className="block text-[15px] text-[#2b2533]">{relativeTime(lastChange)}</strong>last change</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(competitor)}
            className="rounded-lg p-2 text-[#77717e] hover:bg-violet-50 hover:text-violet-600"
            aria-label={`Edit ${competitor.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(competitor)}
            className="rounded-lg p-2 text-[#77717e] hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${competitor.name}`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="card flex min-h-[282px] flex-col overflow-hidden !rounded-xl">
      <div className="flex items-start gap-3 px-4 pb-2 pt-4">
        <Link to={`/competitors/${competitor.id}`}>
          <CompanyLogo
            name={competitor.name}
            logoUrl={competitor.logo_url}
            color={competitor.color}
            size={42}
            className="rounded-lg"
          />
        </Link>
        <Link to={`/competitors/${competitor.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-extrabold text-[#292334]">{competitor.name}</h3>
          <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#77717d]">
            <Globe2 size={10} />
            {competitor.website.replace(/^https?:\/\//, "")}
          </p>
        </Link>
        <span
          className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${
            isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isActive ? "● Active" : "● Setup needed"}
        </span>
        <button
          type="button"
          onClick={() => onEdit(competitor)}
          className="rounded-md p-1.5 text-[#77717e] hover:bg-violet-50 hover:text-violet-600"
          aria-label={`Edit ${competitor.name}`}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(competitor)}
          className="rounded-md p-1 text-[#77717e] hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${competitor.name}`}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {isActive ? (
        <>
          <div className="h-[82px] px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id={`trend-${competitor.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={1.4}
                  fill={`url(#trend-${competitor.id})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mx-4 grid grid-cols-3 border-y border-[#e5e1e9] py-3 text-center text-[9px] font-medium text-[#716b77]">
            <div>
              <strong className="mb-0.5 block text-[12px] text-[#2e2835]">{activeUrls}</strong>
              tracked pages
            </div>
            <div className="border-x border-[#ece9ef]">
              <strong className="mb-0.5 block text-[12px] text-[#2e2835]">{recentChanges.length}</strong>
              changes (30d)
            </div>
            <div>
              <strong className="mb-0.5 block text-[11px] text-[#2e2835]">{relativeTime(lastChange)}</strong>
              last change
            </div>
          </div>
          <Link
            to={`/competitors/${competitor.id}`}
            className="mx-4 mt-auto inline-flex items-center gap-2 py-3 text-[10px] font-bold text-[#6541cf]"
          >
            View intelligence <span>→</span>
          </Link>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd9e1] bg-[#faf9fb] text-[#78717f]">
            <FileText size={14} />
          </span>
          <p className="mt-3 text-[11px] font-semibold text-[#5f5967]">No pages are being tracked yet</p>
          <p className="mt-1.5 text-[9px] text-[#8e8894]">Add pages to start monitoring changes.</p>
          <Link
            to={`/competitors/${competitor.id}`}
            className="mt-4 rounded-lg border border-[#bcaaf0] px-6 py-2 text-[10px] font-bold text-[#6541cf] hover:bg-[#f7f4ff]"
          >
            Add pages
          </Link>
        </div>
      )}
    </article>
  );
}
