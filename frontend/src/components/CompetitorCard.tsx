import { ExternalLink, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import type { Competitor } from "../api/types";

export function CompetitorCard({
  competitor,
  changeCount,
}: {
  competitor: Competitor;
  changeCount: number;
}) {
  const activeUrls = competitor.tracked_urls.filter((u) => u.is_active).length;
  return (
    <Link to={`/competitors/${competitor.id}`} className="card card-hover block p-5">
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: competitor.color }}
        >
          {competitor.name.slice(0, 2).toUpperCase()}
        </span>
        <ExternalLink size={15} className="text-gray-300" />
      </div>
      <h4 className="mt-3 text-sm font-semibold text-gray-900">{competitor.name}</h4>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
        <Globe size={12} />
        <span className="truncate">{competitor.website.replace(/^https?:\/\//, "")}</span>
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-gray-50 pt-3 text-xs">
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{activeUrls}</span> tracked pages
        </span>
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{changeCount}</span> changes (30d)
        </span>
      </div>
    </Link>
  );
}
