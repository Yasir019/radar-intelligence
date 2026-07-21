import { Gavel, Loader2, Shield, Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { Competitor } from "../api/types";
import { primaryBtn } from "../components/Modal";

interface WarRoomTurn {
  role: "attacker" | "defender" | "verdict";
  speaker: string;
  text: string;
}

interface WarRoomSession {
  id: number;
  competitor_id: number;
  competitor_name: string;
  competitor_color: string;
  rounds: number;
  transcript: WarRoomTurn[];
  created_at: string;
}

function TurnBubble({ turn, color }: { turn: WarRoomTurn; color: string }) {
  if (turn.role === "verdict") {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Gavel size={16} />
          </span>
          <span className="text-sm font-semibold text-amber-800">{turn.speaker}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-amber-900 whitespace-pre-line">{turn.text}</p>
      </div>
    );
  }

  const isAttacker = turn.role === "attacker";
  return (
    <div className={`flex ${isAttacker ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] ${isAttacker ? "" : "text-right"}`}>
        <div className={`mb-1 flex items-center gap-2 ${isAttacker ? "" : "justify-end"}`}>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: isAttacker ? color : "#6366f1" }}
          >
            {isAttacker ? <Swords size={12} /> : <Shield size={12} />}
          </span>
          <span className="text-xs font-semibold text-gray-600">{turn.speaker}</span>
        </div>
        <div
          className={`rounded-xl border p-4 text-left text-sm leading-6 ${
            isAttacker
              ? "border-red-100 bg-red-50/70 text-gray-800"
              : "border-indigo-100 bg-indigo-50/70 text-gray-800"
          }`}
        >
          {turn.text}
        </div>
      </div>
    </div>
  );
}

export default function WarRoomPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rounds, setRounds] = useState(3);
  const [session, setSession] = useState<WarRoomSession | null>(null);
  const [history, setHistory] = useState<WarRoomSession[]>([]);
  const [running, setRunning] = useState(false);
  const [visibleTurns, setVisibleTurns] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get<Competitor[]>("/competitors").then((r) => {
      setCompetitors(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    });
    api.get<WarRoomSession[]>("/warroom").then((r) => setHistory(r.data));
    return () => {
      if (revealTimer.current) clearInterval(revealTimer.current);
    };
  }, []);

  const revealTranscript = (s: WarRoomSession) => {
    setSession(s);
    setVisibleTurns(0);
    if (revealTimer.current) clearInterval(revealTimer.current);
    revealTimer.current = setInterval(() => {
      setVisibleTurns((v) => {
        if (v >= s.transcript.length) {
          if (revealTimer.current) clearInterval(revealTimer.current);
          return v;
        }
        return v + 1;
      });
    }, 900);
  };

  const startDebate = async () => {
    if (!selectedId) return;
    setRunning(true);
    setSession(null);
    try {
      const { data } = await api.post<WarRoomSession>(`/warroom/${selectedId}?rounds=${rounds}`);
      revealTranscript(data);
      api.get<WarRoomSession[]>("/warroom").then((r) => setHistory(r.data));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Swords size={20} className="text-red-500" />
            AI War Room
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Two AI strategists debate — theirs attacks with their real tracked moves, ours defends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
          >
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                vs {c.name}
              </option>
            ))}
          </select>
          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
          >
            <option value={2}>2 rounds</option>
            <option value={3}>3 rounds</option>
            <option value={4}>4 rounds</option>
          </select>
          <button onClick={startDebate} disabled={running || !selectedId} className={primaryBtn}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
            {running ? "Agents debating…" : "Start debate"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="card self-start">
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Past debates
          </div>
          {history.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-400">No debates yet</div>
          )}
          <ul className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => revealTranscript(h)}
                  className={`flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 ${
                    session?.id === h.id ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ backgroundColor: h.competitor_color }}
                  >
                    {h.competitor_name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-gray-700">vs {h.competitor_name}</div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(h.created_at + "Z").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {h.rounds} rounds
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card min-h-[400px] p-6">
          {running && (
            <div className="flex h-80 flex-col items-center justify-center gap-3 text-gray-400">
              <Swords size={32} className="animate-pulse text-red-400" />
              <p className="text-sm">AI strategists are preparing their arguments…</p>
              <p className="text-xs">This takes ~30 seconds — {rounds * 2 + 1} AI turns are being generated</p>
            </div>
          )}
          {!running && !session && (
            <div className="flex h-80 flex-col items-center justify-center gap-2 text-gray-400">
              <Swords size={32} className="text-gray-200" />
              <p className="text-sm">Pick a competitor and start a debate</p>
              <p className="text-xs">
                Their AI strategist attacks with real tracked moves — ours fights back
              </p>
            </div>
          )}
          {session && (
            <div className="space-y-5">
              {session.transcript.slice(0, visibleTurns).map((turn, i) => (
                <TurnBubble key={i} turn={turn} color={session.competitor_color} />
              ))}
              {visibleTurns < session.transcript.length && (
                <div className="flex items-center gap-2 pl-2 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  next argument incoming…
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
