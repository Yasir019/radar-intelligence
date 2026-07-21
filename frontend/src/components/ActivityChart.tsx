import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelineBucket } from "../api/types";

export function ActivityChart({ data }: { data: TimelineBucket[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-900">Change activity</h3>
      <p className="mb-4 text-xs text-gray-400">Detected changes per day, last 30 days</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Changes"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#activityFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
