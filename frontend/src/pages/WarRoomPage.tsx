import { Gavel, Loader2, Shield, Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, getToken } from "../api/client";
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

function TypewriterText({ text, animate, onDone }: { text: string; animate: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) {
      setVisible(text.length);
      return;
    }
    setVisible(0);
    const interval = setInterval(() => {
      setVisible((v) => {
        if (v >= text.length) {
          clearInterval(interval);
          onDone?.();
          return v;
        }
        return v + 2;
      });
    }, 14);
    return () => clearInterval(interval);
  }, [text, animate]);

  return (
    <>
      {text.slice(0, visible)}
      {animate && visible < text.length && (
        <span className="ml-0.5 inline-block h-4 w-[3px] animate-pulse rounded-sm bg-indigo-400 align-middle" />
      )}
    </>
  );
}

function TurnBubble({ turn, color, animate }: { turn: WarRoomTurn; color: string; animate: boolean }) {
  if (turn.role === "verdict") {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Gavel size={16} />
          </span>
          <span className="text-sm font-semibold text-amber-800">{turn.speaker}</span>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-amber-900">
          <TypewriterText text={turn.text} animate={animate} />
        </p>
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
          <TypewriterText text={turn.text} animate={animate} />
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator({ speaker, isAttacker, color }: { speaker: string; isAttacker: boolean; color: string }) {
  return (
    <div className={`flex ${isAttacker ? "justify-start" : "justify-end"}`}>
      <div className={`flex items-center gap-2 ${isAttacker ? "" : "flex-row-reverse"}`}>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: isAttacker ? color : "#6366f1" }}
        >
          {isAttacker ? <Swords size={12} /> : <Shield size={12} />}
        </span>
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-4 py-3 ${
            isAttacker ? "border-red-100 bg-red-50/70" : "border-indigo-100 bg-indigo-50/70"
          }`}
        >
          <span className="text-xs text-gray-500">{speaker} is thinking</span>
          <span className="flex gap-0.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WarRoomPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rounds, setRounds] = useState(3);
  const [turns, setTurns] = useState<WarRoomTurn[]>([]);
  const [history, setHistory] = useState<WarRoomSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [animateLast, setAnimateLast] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = competitors.find((c) => c.id === selectedId);

  useEffect(() => {
    api.get<Competitor[]>("/competitors").then((r) => {
      setCompetitors(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    });
    api.get<WarRoomSession[]>("/warroom").then((r) => setHistory(r.data));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length]);

  const startDebate = async () => {
    if (!selectedId) return;
    setRunning(true);
    setTurns([]);
    setActiveSessionId(null);
    setAnimateLast(true);
    try {
      const response = await fetch(`/api/warroom/${selectedId}/stream?rounds=${rounds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok || !response.body) throw new Error("stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const event = JSON.parse(dataLine.slice(5));
          if (event.type === "turn") {
            setTurns((t) => [...t, event.turn as WarRoomTurn]);
          } else if (event.type === "done") {
            const session = event.session as WarRoomSession;
            setActiveSessionId(session.id);
            api.get<WarRoomSession[]>("/warroom").then((r) => setHistory(r.data));
          }
        }
      }
    } finally {
      setRunning(false);
    }
  };

  const openHistory = (h: WarRoomSession) => {
    if (running) return;
    setAnimateLast(false);
    setTurns(h.transcript);
    setActiveSessionId(h.id);
    setSelectedId(h.competitor_id);
  };

  const bubbleColor = selected?.color ?? "#ef4444";
  const nextSpeakerIsAttacker = turns.length % 2 === 0;
  const showThinking = running && turns.length < rounds * 2 + 1;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Swords size={20} className="text-red-500" />
            AI War Room
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Two AI strategists debate live — theirs attacks with their real tracked moves, ours defends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            disabled={running}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 disabled:opacity-50"
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
            disabled={running}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 disabled:opacity-50"
          >
            <option value={2}>2 rounds</option>
            <option value={3}>3 rounds</option>
            <option value={4}>4 rounds</option>
          </select>
          <button onClick={startDebate} disabled={running || !selectedId} className={primaryBtn}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
            {running ? "Debate live…" : "Start debate"}
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
                  onClick={() => openHistory(h)}
                  className={`flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 ${
                    activeSessionId === h.id ? "bg-indigo-50/60" : ""
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

        <div className="card min-h-[420px] p-6">
          {turns.length === 0 && !running && (
            <div className="flex h-80 flex-col items-center justify-center gap-2 text-gray-400">
              <Swords size={32} className="text-gray-200" />
              <p className="text-sm">Pick a competitor and start a debate</p>
              <p className="text-xs">Arguments stream in live, as each AI strategist finishes thinking</p>
            </div>
          )}
          {turns.length === 0 && running && (
            <div className="flex h-80 flex-col items-center justify-center gap-3 text-gray-400">
              <Swords size={32} className="animate-pulse text-red-400" />
              <p className="text-sm">Opening arguments being prepared…</p>
            </div>
          )}
          {turns.length > 0 && (
            <div className="space-y-5">
              {turns.map((turn, i) => (
                <TurnBubble
                  key={i}
                  turn={turn}
                  color={bubbleColor}
                  animate={animateLast && i === turns.length - 1}
                />
              ))}
              {showThinking && (
                <ThinkingIndicator
                  speaker={
                    turns.length >= rounds * 2
                      ? "The referee"
                      : nextSpeakerIsAttacker
                        ? `${selected?.name ?? "Their"} strategist`
                        : "Our strategist"
                  }
                  isAttacker={nextSpeakerIsAttacker && turns.length < rounds * 2}
                  color={bubbleColor}
                />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
