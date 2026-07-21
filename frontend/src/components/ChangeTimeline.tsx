import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ChangeEvent } from "../api/types";
import { CategoryPill } from "./CategoryPill";
import { ImpactBadge } from "./ImpactBadge";

function formatDate(iso: string): string {
  return new Date(iso + "Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChangeTimeline({ changes, title = "Recent changes" }: { changes: ChangeEvent[]; title?: string }) {
  return (
    <div className="card">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {changes.length === 0 && (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No changes detected yet. Add competitors and tracked URLs to start monitoring.
        </div>
      )}
      <ul className="divide-y divide-gray-50">
        {changes.map((c) => (
          <li key={c.id}>
            <Link
              to={`/changes/${c.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
            >
              <span
                className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: c.competitor_color ?? "#6366f1" }}
              >
                {(c.competitor_name ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{c.competitor_name}</span>
                  <CategoryPill category={c.category} />
                  <ImpactBadge score={c.impact_score} />
                  <span className="text-xs text-gray-400">{c.page_type}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-500">
                  {c.summary ?? "Analysis pending…"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-400">{formatDate(c.detected_at)}</div>
                <ChevronRight size={16} className="ml-auto mt-1 text-gray-300" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
