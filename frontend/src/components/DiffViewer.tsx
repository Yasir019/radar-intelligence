import type { DiffLine } from "../api/types";

const LINE_STYLES: Record<DiffLine["type"], string> = {
  add: "bg-emerald-50 text-emerald-800",
  del: "bg-red-50 text-red-700 line-through decoration-red-300",
  ctx: "text-gray-500",
  hunk: "bg-gray-50 text-gray-400 font-medium",
};

const LINE_PREFIX: Record<DiffLine["type"], string> = {
  add: "+",
  del: "−",
  ctx: " ",
  hunk: "",
};

export function DiffViewer({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return <div className="p-6 text-center text-sm text-gray-400">No textual differences.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
      <pre className="min-w-full text-[12.5px] leading-6 font-mono">
        {lines.map((line, i) => (
          <div key={i} className={`flex px-4 ${LINE_STYLES[line.type]}`}>
            <span className="w-5 shrink-0 select-none opacity-60">{LINE_PREFIX[line.type]}</span>
            <span className="whitespace-pre-wrap break-all">{line.text || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
