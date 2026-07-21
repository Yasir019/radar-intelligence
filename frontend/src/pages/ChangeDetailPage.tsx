import { ArrowLeft, ExternalLink, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ChangeEvent, DiffResponse } from "../api/types";
import { CategoryPill } from "../components/CategoryPill";
import { DiffViewer } from "../components/DiffViewer";
import { ImpactBadge } from "../components/ImpactBadge";

export default function ChangeDetailPage() {
  const { id } = useParams();
  const [change, setChange] = useState<ChangeEvent | null>(null);
  const [diff, setDiff] = useState<DiffResponse | null>(null);

  useEffect(() => {
    api.get<ChangeEvent>(`/changes/${id}`).then((r) => setChange(r.data));
    api.get<DiffResponse>(`/changes/${id}/diff`).then((r) => setDiff(r.data));
  }, [id]);

  if (!change) {
    return <div className="p-10 text-center text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to={change.competitor_id ? `/competitors/${change.competitor_id}` : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: change.competitor_color ?? "#6366f1" }}
          >
            {(change.competitor_name ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <h1 className="text-lg font-semibold text-gray-900">{change.competitor_name}</h1>
          <CategoryPill category={change.category} />
          <ImpactBadge score={change.impact_score} />
          <span className="ml-auto text-xs text-gray-400">
            {new Date(change.detected_at + "Z").toLocaleString()}
          </span>
        </div>

        {change.url && (
          <a
            href={change.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600"
          >
            <ExternalLink size={12} />
            {change.url}
          </a>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              AI analysis
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-gray-700">
              {change.summary ??
                (change.analysis_status === "failed"
                  ? "Analysis failed — retry via 'Check now' on the competitor page."
                  : "Analysis pending…")}
            </p>
          </div>

          {change.recommended_action && (
            <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
              <Lightbulb size={17} className="mt-0.5 shrink-0 text-indigo-500" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Recommended action
                </div>
                <p className="mt-1 text-sm leading-6 text-indigo-900">{change.recommended_action}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">What changed on the page</h3>
          {diff && (
            <span className="text-xs text-gray-400">
              {new Date(diff.old_fetched_at + "Z").toLocaleDateString()} →{" "}
              {new Date(diff.new_fetched_at + "Z").toLocaleDateString()}
            </span>
          )}
        </div>
        {diff ? (
          <DiffViewer lines={diff.lines} />
        ) : (
          <div className="p-6 text-center text-sm text-gray-400">Loading diff…</div>
        )}
      </div>
    </div>
  );
}
