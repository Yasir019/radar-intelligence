import { ArrowDown, ArrowRight, ArrowUp, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, Line, LineChart } from "recharts";
import { api } from "../api/client";
import type { DashboardStats } from "../api/types";
import { CompanyLogo } from "../components/CompanyLogo";

const labels: Record<string, string> = {
  new_feature: "Product & features",
  pricing_change: "Pricing",
  messaging_change: "Content",
  promotion: "Partnerships",
  other: "Other",
};

export default function CompetitorActivityPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    api.get<DashboardStats>("/stats/dashboard?days=30").then((response) => setData(response.data));
  }, []);

  const competitors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.competitors ?? []).filter(
      (item) => (!query || item.competitor_name.toLowerCase().includes(query)) && (!activeOnly || item.activity_score >= 35),
    );
  }, [activeOnly, data, search]);

  if (!data) return <div className="card p-12 text-center text-sm text-gray-400">Loading competitor activity…</div>;

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7457ea]">Market intelligence</p>
        <h1 className="mt-2 !font-['Georgia'] !text-[38px] !font-bold !tracking-[-0.035em]">Competitor activity</h1>
        <p className="mt-1 text-sm text-[#625d6b]">Compare momentum, impact, and the latest movement across your tracked competitors.</p>
      </header>

      <div className="card overflow-hidden !rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe8ec] px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#302938]">Activity snapshot <span className="text-xs font-normal text-[#938d99]">Last 30 days</span></div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-9 w-[220px] items-center gap-2 rounded-lg border border-[#e4e1e7] bg-white px-3 text-[#98929e]"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors" className="w-full border-0 bg-transparent p-0 text-xs outline-none focus:ring-0" /></label>
            <button type="button" onClick={() => setActiveOnly((v) => !v)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${activeOnly ? "border-[#7457ea] bg-[#f0edff] text-[#6041c9]" : "border-[#e4e1e7] bg-white text-[#77717d]"}`}><Filter size={13} /> Active only</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead><tr className="border-b border-[#e9e6eb] bg-[#faf9fa] text-[10px] font-bold text-[#6f6974]"><th className="px-5 py-3">Competitor</th><th className="px-3 py-3">Activity score</th><th className="px-3 py-3">Change vs. prior 30 days</th><th className="px-3 py-3">High impact</th><th className="px-3 py-3">Top movement</th><th className="px-3 py-3">Last change</th><th className="px-3 py-3">Trend</th></tr></thead>
            <tbody className="divide-y divide-[#efecf0]">
              {competitors.map((item) => {
                const positive = item.change_percent >= 0;
                return <tr key={item.competitor_id} className="text-xs text-[#5f5964] hover:bg-[#fbfafc]">
                  <td className="px-5 py-3"><Link to={`/competitors/${item.competitor_id}`} className="flex items-center gap-3 font-extrabold text-[#2f2935]"><CompanyLogo name={item.competitor_name} logoUrl={item.competitor_logo_url} color={item.competitor_color} size={30} className="rounded-lg shadow-none" />{item.competitor_name}</Link></td>
                  <td className="px-3 py-3"><strong className="text-sm text-[#2e2833]">{item.activity_score}</strong><span className="ml-2 rounded-full bg-[#f0edff] px-2 py-1 text-[10px] font-bold text-[#6041c9]">{item.activity_level}</span></td>
                  <td className={`px-3 py-3 font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>{positive ? <ArrowUp size={12} className="mr-1 inline" /> : <ArrowDown size={12} className="mr-1 inline" />}{Math.abs(item.change_percent)}%</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">{item.high_impact}</span></td>
                  <td className="px-3 py-3"><span className="rounded-full border border-[#e3dcff] bg-[#f7f4ff] px-2 py-1 text-[10px] font-bold text-[#6041c9]">{labels[item.top_movement] ?? "Other"}</span></td>
                  <td className="px-3 py-3 text-[#77717c]">{item.last_change ? new Date(item.last_change).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No changes yet"}</td>
                  <td className="h-12 w-36 px-3"><ResponsiveContainer width="100%" height={30}><LineChart data={item.trend.map((value, index) => ({ index, value }))}><Line type="monotone" dataKey="value" stroke="#6746d7" strokeWidth={1.8} dot={false} /></LineChart></ResponsiveContainer></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {competitors.length === 0 && <div className="p-12 text-center text-sm text-[#938d99]">No competitors match this search.</div>}
        <div className="flex justify-end border-t border-[#ebe8ec] px-5 py-4"><Link to="/competitors" className="inline-flex items-center gap-1 text-xs font-bold text-[#6041c9]">Manage competitors <ArrowRight size={13} /></Link></div>
      </div>
    </div>
  );
}
