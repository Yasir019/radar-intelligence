import { FileText, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../api/client";
import type { Brief } from "../api/types";
import { primaryBtn } from "../components/Modal";

export default function BriefPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selected, setSelected] = useState<Brief | null>(null);
  const [days, setDays] = useState(7);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const { data } = await api.get<Brief[]>("/briefs");
    setBriefs(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<Brief>(`/briefs/generate?days=${days}`);
      setSelected(data);
      load();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI Competitive Brief</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            An executive summary of competitor activity, written by AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button onClick={generate} disabled={generating} className={primaryBtn}>
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? "Generating…" : "Generate brief"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="card self-start">
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            History
          </div>
          {briefs.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-400">No briefs yet</div>
          )}
          <ul className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
            {briefs.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setSelected(b)}
                  className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    selected?.id === b.id ? "bg-indigo-50/60 text-indigo-700" : "text-gray-600"
                  }`}
                >
                  <FileText size={15} className="shrink-0 opacity-60" />
                  <div>
                    <div className="text-[13px] font-medium">
                      {new Date(b.generated_at + "Z").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] opacity-60">{b.period_days}-day window</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-8">
          {selected ? (
            <div className="prose-brief">
              <ReactMarkdown>{selected.content_md}</ReactMarkdown>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-gray-400">
              Generate your first brief to see an AI-written summary of competitor activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
