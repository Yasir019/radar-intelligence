import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import type { CheckRunResult, TrackedUrl } from "../api/types";

const PAGE_TYPE_STYLES: Record<string, string> = {
  pricing: "bg-violet-50 text-violet-700",
  changelog: "bg-sky-50 text-sky-700",
  blog: "bg-emerald-50 text-emerald-700",
  features: "bg-orange-50 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

function lastChecked(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso + "Z").getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function UrlTable({
  urls,
  onChanged,
  onDeleted,
}: {
  urls: TrackedUrl[];
  onChanged: (result: CheckRunResult) => void;
  onDeleted: () => void;
}) {
  const [checking, setChecking] = useState<number | null>(null);

  const checkNow = async (urlId: number) => {
    setChecking(urlId);
    try {
      const { data } = await api.post<CheckRunResult>(`/checks/run/${urlId}`);
      onChanged(data);
    } finally {
      setChecking(null);
    }
  };

  const remove = async (urlId: number) => {
    if (!confirm("Stop tracking this URL? Its snapshots and change history will be deleted.")) return;
    await api.delete(`/competitors/urls/${urlId}`);
    onDeleted();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3">URL</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Last checked</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {urls.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="max-w-md truncate px-5 py-3 font-medium text-gray-900">{u.url}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    PAGE_TYPE_STYLES[u.page_type] ?? PAGE_TYPE_STYLES.other
                  }`}
                >
                  {u.page_type}
                </span>
              </td>
              <td className="px-5 py-3">
                {u.last_status == null ? (
                  <span className="text-xs text-gray-400">not checked</span>
                ) : u.last_status.startsWith("error") ? (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600" title={u.last_status}>
                    <AlertCircle size={13} /> error
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 size={13} /> ok
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-xs text-gray-500">{lastChecked(u.last_checked_at)}</td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => checkNow(u.id)}
                    disabled={checking !== null}
                    title="Check now"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                  >
                    {checking === u.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    title="Delete"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {urls.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          No tracked URLs yet. Add the competitor's pricing or changelog page to start monitoring.
        </div>
      )}
    </div>
  );
}
