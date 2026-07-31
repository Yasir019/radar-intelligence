import {
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { ChangeEvent, Competitor } from "../api/types";
import { CompetitorCard } from "../components/CompetitorCard";
import { DeleteCompetitorModal, EditCompetitorModal } from "../components/CompetitorManagementModals";
import { inputClass, Modal, primaryBtn } from "../components/Modal";

const COLORS = ["#7457ea", "#0ea5e9", "#f59e0b", "#10b981", "#e43d6c", "#8b5cf6"];

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [deleting, setDeleting] = useState<Competitor | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([
      api.get<Competitor[]>("/competitors").then((response) => setCompetitors(response.data)),
      api.get<ChangeEvent[]>("/changes?limit=200").then((response) => setChanges(response.data)),
    ]).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const changesByCompetitor = useMemo(() => {
    const grouped = new Map<number, ChangeEvent[]>();
    changes.forEach((change) => {
      if (change.competitor_id == null) return;
      const current = grouped.get(change.competitor_id) ?? [];
      current.push(change);
      grouped.set(change.competitor_id, current);
    });
    return grouped;
  }, [changes]);

  const filteredCompetitors = useMemo(() => {
    return [...competitors]
      .sort((a, b) => {
        const aChanges = changesByCompetitor.get(a.id) ?? [];
        const bChanges = changesByCompetitor.get(b.id) ?? [];
        return bChanges.length - aChanges.length;
      });
  }, [changesByCompetitor, competitors]);

  const addCompetitor = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <div className="mx-auto max-w-[1450px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="!font-['Georgia'] !text-[40px] !font-bold !tracking-[-0.035em]">Competitors</h1>
          <p className="mt-1 text-sm text-[#625d6b]">
            Track companies, monitor key pages, and spot meaningful movement.
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className={`${primaryBtn} !rounded-lg !px-5 !py-3`}>
          <Plus size={16} />
          Add competitor
        </button>
      </header>

      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading…</div>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              changes={changesByCompetitor.get(competitor.id) ?? []}
              view="grid"
              onEdit={setEditing}
              onDelete={setDeleting}
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
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
          <input
            required
            placeholder="Website (e.g. acme.com)"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Notes (optional — e.g. closest competitor in mid-market)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className={inputClass}
          />
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add competitor
          </button>
        </form>
      </Modal>

      <EditCompetitorModal
        competitor={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={(updated) =>
          setCompetitors((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        }
      />
      <DeleteCompetitorModal
        competitor={deleting}
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onDeleted={(competitorId) =>
          setCompetitors((current) => current.filter((item) => item.id !== competitorId))
        }
      />
    </div>
  );
}
