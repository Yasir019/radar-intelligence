import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ChangeEvent, Competitor } from "../api/types";
import { CompetitorCard } from "../components/CompetitorCard";
import { inputClass, Modal, primaryBtn } from "../components/Modal";

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([
      api.get<Competitor[]>("/competitors").then((r) => setCompetitors(r.data)),
      api.get<ChangeEvent[]>("/changes?limit=200").then((r) => setChanges(r.data)),
    ]).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const changesByCompetitor = new Map<number, number>();
  for (const c of changes) {
    if (c.competitor_id != null) {
      changesByCompetitor.set(c.competitor_id, (changesByCompetitor.get(c.competitor_id) ?? 0) + 1);
    }
  }

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/competitors", {
        name,
        website: website.startsWith("http") ? website : `https://${website}`,
        notes: notes || null,
        color: COLORS[competitors.length % COLORS.length],
      });
      setAddOpen(false);
      setName("");
      setWebsite("");
      setNotes("");
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Competitors</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            The companies you're tracking and their monitored pages
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className={primaryBtn}>
          <Plus size={15} />
          Add competitor
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
      ) : competitors.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No competitors yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Add your first competitor to start monitoring their pricing, features, and changelog.
          </p>
          <button onClick={() => setAddOpen(true)} className={`${primaryBtn} mt-4`}>
            <Plus size={15} />
            Add your first competitor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              changeCount={changesByCompetitor.get(c.id) ?? 0}
            />
          ))}
        </div>
      )}

      <Modal title="Add competitor" open={addOpen} onClose={() => setAddOpen(false)}>
        <form onSubmit={addCompetitor} className="space-y-3">
          <input
            required
            placeholder="Company name (e.g. Acme Analytics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            required
            placeholder="Website (e.g. acme.com)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Notes (optional — e.g. closest competitor in mid-market)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
          />
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add competitor
          </button>
        </form>
      </Modal>
    </div>
  );
}
