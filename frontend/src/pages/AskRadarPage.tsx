import { Loader2, MessageSquare, Radar as RadarIcon, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, getToken } from "../api/client";
import type { Competitor } from "../api/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which competitor is my biggest threat right now?",
  "What pricing changes happened recently?",
  "Summarize this week's competitor activity",
  "What should my team do first this week?",
];

export default function AskRadarPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [competitorCount, setCompetitorCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Competitor[]>("/competitors").then((r) => setCompetitorCount(r.data.length));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || streaming) return;
    setInput("");

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const response = await fetch("/api/ask/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ messages: history }),
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
          if (event.type === "delta") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "assistant",
                content: next[next.length - 1].content + event.text,
              };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Something went wrong — please try again.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="pb-4">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7457ea]">
          Ask anything
        </p>
        <h1>Ask Radar</h1>
        <p className="mt-1 text-sm text-[#7c8a9d]">
          Chat with an AI analyst that knows every change Radar has tracked
          {competitorCount != null && ` across your ${competitorCount} competitors`}.
        </p>
      </div>

      <div className="card flex min-h-[520px] flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-5 py-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ecff] text-[#7457ea]">
                <MessageSquare size={26} />
              </span>
              <p className="text-sm text-[#7c8a9d]">Try one of these to start:</p>
              <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-[#e2dcf3] bg-[#faf9fd] px-4 py-2 text-xs font-medium text-[#46425a] transition hover:border-[#cfc5ed] hover:bg-[#f3efff]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <span className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7457ea]">
                  <RadarIcon size={14} className="text-white" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-6 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#7457ea] text-white"
                    : "rounded-bl-md border border-[#efecf6] bg-[#fbfaff] text-[#46425a]"
                }`}
              >
                {message.role === "assistant" ? (
                  message.content ? (
                    <div className="prose-brief [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#9a95a8]">
                      <Loader2 size={13} className="animate-spin" /> reading your intel…
                    </span>
                  )
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-[#efecf6] bg-[#fbfaff] px-4 py-3"
        >
          <Sparkles size={16} className="shrink-0 text-[#7457ea]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your competitors…"
            className="flex-1 bg-transparent text-sm text-[#171527] placeholder-[#9b97a8] outline-none"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7457ea] text-white transition hover:bg-[#6043d6] disabled:opacity-40"
          >
            {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
