import { ArrowLeft, ExternalLink, Globe, Loader2, Monitor, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ChangeEvent, CheckRunResult, Competitor, PageType } from "../api/types";
import { ChangeTimeline } from "../components/ChangeTimeline";
import { inputClass, Modal, primaryBtn } from "../components/Modal";
import { UrlTable } from "../components/UrlTable";

const PAGE_TYPES: PageType[] = ["pricing", "changelog", "features", "blog", "other"];

export default function CompetitorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pageType, setPageType] = useState<PageType>("pricing");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () =>
    Promise.all([
      api.get<Competitor>(`/competitors/${id}`).then((r) => setCompetitor(r.data)),
      api.get<ChangeEvent[]>(`/changes?competitor_id=${id}&limit=20`).then((r) => setChanges(r.data)),
    ]);

  useEffect(() => {
    load();
  }, [id]);

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/competitors/${id}/urls`, {
        url: url.startsWith("http") ? url : `https://${url}`,
        page_type: pageType,
      });
      setAddUrlOpen(false);
      setUrl("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const removeCompetitor = async () => {
    if (!confirm(`Delete ${competitor?.name} and all its tracked data?`)) return;
    await api.delete(`/competitors/${id}`);
    navigate("/");
  };

  const onChecked = (result: CheckRunResult) => {
    if (result.new_changes.length > 0) {
      setNotice(`Detected ${result.new_changes.length} new change(s) — analysis complete.`);
    } else if (result.errors > 0) {
      setNotice("Check failed — see the status column for details.");
    } else {
      setNotice("No changes since the last snapshot.");
    }
    setTimeout(() => setNotice(null), 5000);
    load();
  };

  if (!competitor) {
    return <div className="p-10 text-center text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white"
              style={{ backgroundColor: competitor.color }}
            >
              {competitor.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{competitor.name}</h1>
              <a
                href={competitor.website}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600"
              >
                <Globe size={13} />
                {competitor.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddUrlOpen(true)} className={primaryBtn}>
              <Plus size={15} /> Track a page
            </button>
            <button
              onClick={removeCompetitor}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Delete competitor"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {competitor.notes && <p className="mt-4 text-sm text-gray-500">{competitor.notes}</p>}
      </div>

      {notice && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
          {notice}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Monitor size={15} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Live website</h3>
              <p className="text-[11px] text-gray-400">
                {competitor.website.replace(/^https?:\/\//, "")} — scroll inside to explore
              </p>
            </div>
          </div>
          <a
            href={competitor.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={13} />
            Open site
          </a>
        </div>
        <div className="relative h-[560px] bg-gray-50">
          <iframe
            src={competitor.website}
            title={`${competitor.name} website preview`}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
            <span className="rounded-full bg-gray-900/70 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
              Some sites block embedding — use "Open site" if the preview stays blank
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Tracked pages</h3>
        </div>
        <UrlTable urls={competitor.tracked_urls} onChanged={onChecked} onDeleted={load} />
      </div>

      <ChangeTimeline changes={changes} title="Change history" />

      <Modal title="Track a page" open={addUrlOpen} onClose={() => setAddUrlOpen(false)}>
        <form onSubmit={addUrl} className="space-y-3">
          <input
            required
            placeholder="Page URL (e.g. acme.com/pricing)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
          <select
            value={pageType}
            onChange={(e) => setPageType(e.target.value as PageType)}
            className={inputClass}
          >
            {PAGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Start tracking
          </button>
        </form>
      </Modal>
    </div>
  );
}
