import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Competitor } from "../api/types";
import { inputClass, Modal, primaryBtn, secondaryBtn } from "./Modal";

export function EditCompetitorModal({
  competitor,
  open,
  onClose,
  onSaved,
}: {
  competitor: Competitor | null;
  open: boolean;
  onClose: () => void;
  onSaved: (competitor: Competitor) => void;
}) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!competitor) return;
    setName(competitor.name);
    setWebsite(competitor.website);
    setNotes(competitor.notes ?? "");
  }, [competitor]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!competitor) return;
    setSaving(true);
    try {
      const response = await api.put<Competitor>(`/competitors/${competitor.id}`, {
        name: name.trim(),
        website: website.startsWith("http") ? website : `https://${website}`,
        notes: notes.trim() || null,
      });
      onSaved(response.data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit competitor" open={open} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">Company name</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">Website</span>
          <input
            required
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteCompetitorModal({
  competitor,
  open,
  onClose,
  onDeleted,
}: {
  competitor: Competitor | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (competitorId: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!competitor) return;
    setDeleting(true);
    try {
      await api.delete(`/competitors/${competitor.id}`);
      onDeleted(competitor.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete competitor?" open={open} onClose={onClose}>
      <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50/70 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm">
          <Trash2 size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{competitor?.name}</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">
            This permanently removes the competitor, tracked pages, and its saved intelligence.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={secondaryBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete competitor
        </button>
      </div>
    </Modal>
  );
}
