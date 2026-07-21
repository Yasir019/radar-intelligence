import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ImpactBucket } from "../api/types";

function barColor(impact: number): string {
  if (impact >= 7) return "#ef4444";
  if (impact >= 4) return "#f59e0b";
  return "#94a3b8";
}

export function ImpactChart({ data }: { data: ImpactBucket[] }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-900">Impact distribution</h3>
      <p className="mb-4 text-xs text-gray-400">AI impact scores across changes, last 30 days</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="impact"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
            formatter={(value) => [value as number, "Changes"]}
            labelFormatter={(label) => `Impact ${label}/10`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.impact} fill={barColor(entry.impact)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
