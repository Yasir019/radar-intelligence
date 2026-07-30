import {
  Building2,
  Grid2X2,
  List,
  Loader2,
  NotebookTabs,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
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
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activity, setActivity] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("active");

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

  const changesThisMonth = changes.filter((change) => {
    const normalized = /z$|[+-]\d\d:\d\d$/i.test(change.detected_at)
      ? change.detected_at
      : `${change.detected_at}Z`;
    return new Date(normalized).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).length;

  const filteredCompetitors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...competitors]
      .filter((competitor) => {
        const competitorChanges = changesByCompetitor.get(competitor.id) ?? [];
        const activePages = competitor.tracked_urls.filter((url) => url.is_active).length;
        if (query && !`${competitor.name} ${competitor.website}`.toLowerCase().includes(query)) return false;
        if (status === "active" && activePages === 0) return false;
        if (status === "setup" && activePages > 0) return false;
        if (activity === "changed" && competitorChanges.length === 0) return false;
        if (activity === "quiet" && competitorChanges.length > 0) return false;
        return true;
      })
      .sort((a, b) => {
        const aChanges = changesByCompetitor.get(a.id) ?? [];
        const bChanges = changesByCompetitor.get(b.id) ?? [];
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "recent") {
          return (
            new Date(bChanges[0]?.detected_at ?? 0).getTime() -
            new Date(aChanges[0]?.detected_at ?? 0).getTime()
          );
        }
        return bChanges.length - aChanges.length;
      });
  }, [activity, changesByCompetitor, competitors, search, sort, status]);

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

  const resetFilters = () => {
    setSearch("");
    setActivity("all");
    setStatus("all");
    setSort("active");
  };

  return (
    <div className="mx-auto max-w-[1450px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="!font-['Georgia'] !text-[44px] !font-bold !tracking-[-0.035em]">Competitors</h1>
          <p className="mt-1 text-[15px] text-[#625d6b]">
            Track companies, monitor key pages, and spot meaningful movement.
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className={`${primaryBtn} !rounded-lg !px-5 !py-3`}>
          <Plus size={16} />
          Add competitor
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Building2,
            value: competitors.length,
            label: "competitors",
            style: "bg-[#f0eaff] text-[#6240cb]",
          },
          {
            icon: NotebookTabs,
            value: competitors.reduce((sum, competitor) => sum + competitor.tracked_urls.filter((url) => url.is_active).length, 0),
            label: "tracked pages",
            style: "bg-[#eee9ff] text-[#4c2db8]",
          },
          {
            icon: TrendingUp,
            value: changesThisMonth,
            label: "changes this month",
            style: "bg-[#eee9ff] text-[#4c2db8]",
          },
        ].map(({ icon: Icon, value, label, style }) => (
          <div key={label} className="card flex min-h-[112px] items-center gap-4 px-6 py-5 !rounded-xl">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${style}`}>
              <Icon size={19} />
            </span>
            <div>
              <strong className="block text-[25px] leading-none text-[#241f2d]">{value}</strong>
              <span className="mt-2 block text-[12px] font-medium text-[#706a78]">{label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <label className="flex h-10 min-w-[250px] flex-1 items-center gap-2 rounded-lg border border-[#dfdbe3] bg-white px-3 text-[#958f9a] sm:max-w-[350px]">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search competitors..."
            className="!w-full !border-0 !bg-transparent !p-0 !text-[12px] !shadow-none !outline-none placeholder:!text-[#99939e] focus:!ring-0"
            />
          </label>
          <div className="flex h-10 rounded-lg border border-[#ded9e4] bg-white p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 text-[11px] font-bold ${
                view === "grid" ? "bg-[#eee9ff] text-[#4f31b7]" : "text-[#7e7884]"
              }`}
            >
              <Grid2X2 size={13} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 text-[11px] font-bold ${
                view === "list" ? "bg-[#eee9ff] text-[#4f31b7]" : "text-[#7e7884]"
              }`}
            >
              <List size={14} /> List
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            className="h-10 rounded-lg border border-[#ded9e4] bg-white px-3 text-[11px] font-semibold text-[#514b58]"
          >
            <option value="all">Activity: All</option>
            <option value="changed">Activity: Changed</option>
            <option value="quiet">Activity: Quiet</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-[#ded9e4] bg-white px-3 text-[11px] font-semibold text-[#514b58]"
          >
            <option value="all">Status: All</option>
            <option value="active">Status: Active</option>
            <option value="setup">Status: Setup needed</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-10 rounded-lg border border-[#ded9e4] bg-white px-3 text-[11px] font-semibold text-[#514b58]"
          >
            <option value="active">Sort: Most active</option>
            <option value="recent">Sort: Most recent</option>
            <option value="name">Sort: Name</option>
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ded9e4] bg-white text-[#746e7a] hover:bg-[#faf9fb]"
            title="Reset filters"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </section>

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
      ) : filteredCompetitors.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm font-bold text-[#393341]">No competitors match these filters</p>
          <button type="button" onClick={resetFilters} className="mt-2 text-xs font-bold text-[#6541cf]">
            Clear filters
          </button>
        </div>
      ) : (
        <div className={view === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              changes={changesByCompetitor.get(competitor.id) ?? []}
              view={view}
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
