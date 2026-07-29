import { BrainCircuit, Crosshair, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../api/client";
import type { Battlecard, Prediction } from "../api/types";

function timeStamp(iso: string): string {
  return new Date(iso + "Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------ Battlecard ------------------------------ */

export function BattlecardCard({ competitorId }: { competitorId: number }) {
  const [card, setCard] = useState<Battlecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Battlecard | null>(`/battlecards/${competitorId}/latest`)
      .then((r) => setCard(r.data))
      .finally(() => setLoading(false));
  }, [competitorId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<Battlecard>(`/battlecards/${competitorId}`);
      setCard(data);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-[#efecf6] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ecff] text-[#7457ea]">
            <Sparkles size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#171527]">AI Battlecard</h3>
            <p className="text-[11px] text-[#9a95a8]">
              {card ? `Generated ${timeStamp(card.generated_at)}` : "Sales-ready competitive playbook"}
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#7457ea] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#6043d6] disabled:opacity-60"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : card ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {generating ? "Writing…" : card ? "Regenerate" : "Generate"}
        </button>
      </div>
      <div className="max-h-[520px] flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : generating && !card ? (
          <p className="py-10 text-center text-sm text-gray-400">
            AI is reading every tracked move and writing the playbook…
          </p>
        ) : card ? (
          <div className="prose-brief">
            <ReactMarkdown>{card.content_md}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-[#46425a]">No battlecard yet</p>
            <p className="mt-1 text-xs text-[#9a95a8]">
              One click — AI turns this competitor's tracked moves into strengths, weaknesses,
              counter-plays and objection handling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Next Move Predictor --------------------------- */

function threatStyle(level: number): string {
  if (level >= 7) return "bg-[#ffedf2] text-[#e43d6c] border-[#ffd9e1]";
  if (level >= 4) return "bg-[#fff6e8] text-[#b7791f] border-[#f5e3bd]";
  return "bg-[#eaf8ef] text-[#168451] border-[#d9f0e3]";
}

export function PredictionCard({ competitorId }: { competitorId: number }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Prediction | null>(`/predictions/${competitorId}/latest`)
      .then((r) => setPrediction(r.data))
      .finally(() => setLoading(false));
  }, [competitorId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<Prediction>(`/predictions/${competitorId}`);
      setPrediction(data);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-[#efecf6] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ecff] text-[#7457ea]">
            <Crosshair size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#171527]">Strategy DNA & Next Move</h3>
            <p className="text-[11px] text-[#9a95a8]">
              {prediction ? `Predicted ${timeStamp(prediction.generated_at)}` : "AI forecast from their patterns"}
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#7457ea] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#6043d6] disabled:opacity-60"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : prediction ? <RefreshCw size={13} /> : <BrainCircuit size={13} />}
          {generating ? "Forecasting…" : prediction ? "Re-predict" : "Predict"}
        </button>
      </div>
      <div className="flex-1 px-6 py-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : generating && !prediction ? (
          <p className="py-10 text-center text-sm text-gray-400">
            AI is reading the pattern behind their moves…
          </p>
        ) : prediction ? (
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7457ea]">
                  Strategy DNA
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${threatStyle(prediction.threat_level)}`}
                >
                  Threat {prediction.threat_level}/10
                </span>
              </div>
              <p className="text-[13px] leading-6 text-[#46425a]">{prediction.strategy_profile}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7457ea]">
                Predicted next moves
              </span>
              <div className="mt-3 space-y-4">
                {prediction.moves.map((move, i) => (
                  <div key={i} className="rounded-xl border border-[#efecf6] bg-[#fbfaff] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold leading-5 text-[#171527]">
                        {i + 1}. {move.move}
                      </p>
                      <span className="shrink-0 rounded-full bg-[#f0ecff] px-2 py-0.5 text-[10px] font-bold text-[#6547d8]">
                        {move.timeframe}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ece9f3]">
                        <div
                          className="h-full rounded-full bg-[#7457ea]"
                          style={{ width: `${move.confidence}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#6547d8]">{move.confidence}%</span>
                    </div>
                    <p className="mt-2 text-[11.5px] leading-5 text-[#7c7889]">{move.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-[#46425a]">No prediction yet</p>
            <p className="mt-1 text-xs text-[#9a95a8]">
              AI reads the pattern behind their tracked moves and forecasts what they'll likely do
              next — with confidence scores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
