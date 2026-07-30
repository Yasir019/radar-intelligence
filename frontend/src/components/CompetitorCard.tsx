import { Globe, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Competitor } from "../api/types";
import { CompanyLogo } from "./CompanyLogo";

export function CompetitorCard({
  competitor,
  changeCount,
  onEdit,
  onDelete,
}: {
  competitor: Competitor;
  changeCount: number;
  onEdit: (competitor: Competitor) => void;
  onDelete: (competitor: Competitor) => void;
}) {
  const activeUrls = competitor.tracked_urls.filter((u) => u.is_active).length;
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <Link to={`/competitors/${competitor.id}`} aria-label={`Open ${competitor.name}`}>
          <CompanyLogo
            name={competitor.name}
            logoUrl={competitor.logo_url}
            color={competitor.color}
            size={40}
          />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(competitor)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
            title={`Edit ${competitor.name}`}
            aria-label={`Edit ${competitor.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(competitor)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            title={`Delete ${competitor.name}`}
            aria-label={`Delete ${competitor.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <Link to={`/competitors/${competitor.id}`} className="block">
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
    </div>
  );
}
