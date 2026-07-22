import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  FileText,
  GitCompareArrows,
  Globe,
  Loader2,
  Radar as RadarIcon,
  Shield,
  Swords,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ------------------------------------------------------------------ */
/*  The concept: Radar is an intelligence operation for your market.  */
/*  Radar screen → live intel ticker → one change told minute-by-     */
/*  minute → capabilities dossier → War Room. No template borrowed.   */
/* ------------------------------------------------------------------ */

const TICKER_ITEMS = [
  { name: "Acme Analytics", event: "cut Pro pricing −13%", impact: 8 },
  { name: "PipelineHQ", event: "shipped AI reporting", impact: 7 },
  { name: "Metricly", event: "added RBAC + audit logs", impact: 7 },
  { name: "DashForge", event: "3 months free promo", impact: 3 },
  { name: "PipelineHQ", event: "launched free tier", impact: 6 },
  { name: "Acme Analytics", event: "embedded analytics", impact: 6 },
  { name: "Metricly", event: "hid enterprise pricing", impact: 5 },
];

const BLIPS = [
  { label: "AC", color: "#818cf8", top: "22%", left: "64%", delay: "0s" },
  { label: "PH", color: "#38bdf8", top: "58%", left: "74%", delay: "0.5s" },
  { label: "MT", color: "#fbbf24", top: "70%", left: "32%", delay: "1s" },
  { label: "DF", color: "#34d399", top: "34%", left: "24%", delay: "1.5s" },
];

const CAPABILITIES = [
  {
    code: "CAP-01",
    icon: Globe,
    title: "Round-the-clock surveillance",
    text: "Hourly automated sweeps of every pricing page, changelog and feature page you point Radar at — driven by an n8n workflow that never sleeps, never forgets.",
    wide: true,
  },
  {
    code: "CAP-02",
    icon: GitCompareArrows,
    title: "Forensic diffs",
    text: "Content fingerprinting catches every meaningful edit. Line-by-line evidence: removed in red, added in green.",
    wide: false,
  },
  {
    code: "CAP-03",
    icon: BrainCircuit,
    title: "AI verdict on every change",
    text: "Summary, category, 1-10 impact score, one recommended action — schema-enforced JSON, validated before it reaches you.",
    wide: false,
  },
  {
    code: "CAP-04",
    icon: Bell,
    title: "Alerts that route themselves",
    text: "Pricing intel to the pricing channel, product intel to product. High-impact only — the noise never leaves the database.",
    wide: false,
  },
  {
    code: "CAP-05",
    icon: FileText,
    title: "Monday morning briefing",
    text: "An AI-written executive brief covering the week: highlights per competitor, threats, opportunities, numbered actions. In Slack before your coffee.",
    wide: true,
  },
];

const FAQS = [
  {
    q: "How fast will I know about a change?",
    a: "Pages are swept hourly. From the moment a sweep catches a change, the AI verdict and Slack alert land within seconds — so worst case, about an hour after the competitor hits publish.",
  },
  {
    q: "Will tiny cosmetic edits spam me?",
    a: "No. The AI scores cosmetic churn (dates, typos, styling) 1-2 out of 10, and only changes above your threshold leave the app. You control the threshold per account.",
  },
  {
    q: "What exactly does the AI produce?",
    a: "A structured verdict for every change: a 2-3 sentence summary, a category (pricing / feature / messaging / promotion), a 1-10 impact score, and one concrete recommended action. It's schema-validated JSON, not freeform text.",
  },
  {
    q: "What is the War Room?",
    a: "A live debate between two AI strategists — one argues as your competitor using their real tracked moves, one defends your position. A neutral AI referee scores the exchange and hands you three takeaways.",
  },
  {
    q: "Can I try it without signing up?",
    a: "Yes. The live demo is pre-loaded with 4 competitors and 30 days of analyzed changes. One click — no card, no email.",
  },
];

/* ------------------------------ pieces ------------------------------ */

function Robot({
  body,
  visor,
  accent,
  size = 150,
  delay = "0s",
  flip = false,
}: {
  body: string;
  visor: string;
  accent: string;
  size?: number;
  delay?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 170"
      width={size}
      height={(size * 170) / 120}
      className="animate-bot-float drop-shadow-xl"
      style={{ animationDelay: delay, transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* antenna */}
      <line x1="60" y1="20" x2="60" y2="8" stroke={body} strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="6" r="5" fill={accent} />
      {/* head */}
      <rect x="26" y="18" width="68" height="48" rx="16" fill={body} />
      {/* visor */}
      <rect x="34" y="30" width="52" height="24" rx="12" fill={visor} />
      <circle cx="50" cy="42" r="5" fill={accent} />
      <circle cx="70" cy="42" r="5" fill={accent} />
      {/* ears */}
      <rect x="18" y="34" width="8" height="16" rx="4" fill={body} />
      <rect x="94" y="34" width="8" height="16" rx="4" fill={body} />
      {/* body */}
      <rect x="30" y="72" width="60" height="56" rx="16" fill={body} />
      <circle cx="60" cy="96" r="11" fill={visor} />
      <circle cx="60" cy="96" r="5" fill={accent} />
      {/* arms */}
      <rect x="12" y="76" width="14" height="38" rx="7" fill={body} />
      <rect x="94" y="76" width="14" height="38" rx="7" fill={body} />
      {/* legs */}
      <rect x="38" y="130" width="14" height="26" rx="7" fill={body} />
      <rect x="68" y="130" width="14" height="26" rx="7" fill={body} />
      {/* feet */}
      <ellipse cx="45" cy="160" rx="12" ry="6" fill={visor} />
      <ellipse cx="75" cy="160" rx="12" ry="6" fill={visor} />
    </svg>
  );
}

function DashMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-[0_40px_90px_-25px_rgba(10,15,30,0.45)]">
      {/* window bar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600">
            <RadarIcon size={11} className="text-white" />
          </span>
          <span className="font-display text-xs font-semibold">Radar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>
      <div className="grid md:grid-cols-[140px_1fr]">
        {/* sidebar */}
        <div className="hidden border-r border-gray-100 bg-gray-50/60 p-3 md:block">
          {["Dashboard", "Competitors", "War Room", "AI Brief", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`mb-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                i === 0 ? "bg-indigo-50 text-indigo-700" : "text-gray-400"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        {/* main */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2.5">
            {[
              ["Competitors", "4"],
              ["Tracked pages", "16"],
              ["Changes (7d)", "12"],
              ["High impact", "3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
                <div className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
                <div className="font-display mt-0.5 text-lg font-bold">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-gray-100 p-3 shadow-sm">
            <div className="mb-2 text-[10px] font-semibold text-gray-500">Change activity</div>
            <div className="flex h-12 items-end gap-1">
              {[35, 55, 30, 70, 45, 85, 60, 40, 95, 65, 50, 75, 88, 58].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${i === 8 ? "bg-indigo-500" : "bg-indigo-100"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          {[
            ["AC", "#6366f1", "Acme Analytics", "Pricing", "8/10", "Cut Pro plan to $69 + usage-based Scale add-on"],
            ["PH", "#0ea5e9", "PipelineHQ", "New feature", "7/10", "Shipped AI-assisted reporting module"],
          ].map(([initials, color, name, cat, impact, text]) => (
            <div key={name} className="mt-2 flex items-center gap-2.5 rounded-lg border border-gray-100 p-2.5 shadow-sm">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold">{name}</span>
                  <span className="rounded-full bg-violet-50 px-1.5 py-px text-[9px] font-medium text-violet-600">{cat}</span>
                  <span className="rounded-full bg-red-50 px-1.5 py-px text-[9px] font-semibold text-red-600">{impact}</span>
                </div>
                <div className="truncate text-[10px] text-gray-400">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RadarScreen() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* outer glow */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-3xl" />
      {/* screen */}
      <div className="absolute inset-0 overflow-hidden rounded-full border border-indigo-900/60 bg-[#0a0f1e] shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)]">
        {/* rings */}
        {[18, 34, 50].map((inset) => (
          <div
            key={inset}
            className="absolute rounded-full border border-indigo-500/15"
            style={{ inset: `${inset}%` }}
          />
        ))}
        <div className="absolute inset-[4%] rounded-full border border-indigo-500/25" />
        {/* crosshairs */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-indigo-500/10" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-indigo-500/10" />
        {/* sweep */}
        <div
          className="animate-radar-sweep absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(129,140,248,0.35) 0deg, rgba(129,140,248,0.12) 40deg, transparent 90deg)",
          }}
        />
        {/* blips */}
        {BLIPS.map((b) => (
          <div key={b.label} className="absolute" style={{ top: b.top, left: b.left }}>
            <span
              className="animate-blip block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: b.color, animationDelay: b.delay, boxShadow: `0 0 12px ${b.color}` }}
            />
            <span className="mt-1 block font-mono text-[9px] tracking-wider" style={{ color: b.color }}>
              {b.label}
            </span>
          </div>
        ))}
        {/* center */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.9)]" />
      </div>
      {/* corner readouts */}
      <div className="absolute -left-2 top-6 rounded-md border border-indigo-500/20 bg-[#0a0f1e]/90 px-2.5 py-1.5 font-mono text-[10px] text-indigo-300">
        SWEEP #4,412 · ACTIVE
      </div>
      <div className="absolute -right-2 bottom-8 rounded-md border border-emerald-500/20 bg-[#0a0f1e]/90 px-2.5 py-1.5 font-mono text-[10px] text-emerald-300">
        16 PAGES · 4 TARGETS
      </div>
    </div>
  );
}

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicated for seamless loop
  return (
    <div className="overflow-hidden border-y border-gray-100 bg-gray-50/80 py-3">
      <div className="animate-ticker flex w-max items-center gap-10">
        {items.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 font-mono text-xs text-gray-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.impact >= 7 ? "bg-red-400" : item.impact >= 4 ? "bg-amber-400" : "bg-gray-300"}`}
            />
            <span className="font-semibold text-gray-700">{item.name}</span>
            {item.event}
            <span className={`${item.impact >= 7 ? "text-red-500" : "text-gray-400"}`}>
              [{item.impact}/10]
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------- */

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const exploreDemo = async () => {
    setDemoLoading(true);
    try {
      await login("demo@radar.app", "demo1234");
      navigate("/");
    } catch {
      navigate("/login");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <RadarIcon size={17} className="text-white" />
            </span>
            <span className="font-display text-[16px] font-semibold tracking-tight">Radar</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            <a href="#story" className="transition hover:text-gray-900">The 3 minutes</a>
            <a href="#capabilities" className="transition hover:text-gray-900">Capabilities</a>
            <a href="#warroom" className="transition hover:text-gray-900">War Room</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Sign in
            </Link>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {demoLoading && <Loader2 size={13} className="animate-spin" />}
              Open live demo
            </button>
          </div>
        </div>
      </header>

      {/* hero — bold color field, centered copy, mockup flanked by robots */}
      <section className="relative overflow-hidden bg-indigo-400">
        {/* subtle texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 text-center md:pt-20">
          <p className="font-mono text-[11px] tracking-[0.3em] text-indigo-950/70">
            {"//"} COMPETITIVE INTELLIGENCE, AUTOMATED
          </p>
          <h1 className="font-display mx-auto mt-4 max-w-3xl text-[38px] font-bold leading-[1.05] tracking-tight text-[#0b1020] md:text-[60px]">
            Every competitor move.
            <br />
            On your radar.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-indigo-950/70">
            Radar sweeps their pricing, changelogs and features every hour, reads every change with
            AI, and tells your team the one thing that matters:{" "}
            <span className="font-semibold text-[#0b1020]">what to do about it.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b1020] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-900/20 transition hover:bg-gray-800 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={15} className="animate-spin" /> : null}
              Put them on radar
              <ArrowRight size={15} />
            </button>
            <Link
              to="/login"
              className="rounded-lg border border-[#0b1020]/20 bg-white/60 px-7 py-3.5 text-sm font-semibold text-[#0b1020] backdrop-blur-sm transition hover:bg-white"
            >
              Create account
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 font-mono text-[11px] text-indigo-950/60">
            <span>24/7 SWEEPS</span>
            <span className="h-3 w-px bg-indigo-950/20" />
            <span>AI VERDICT &lt; 2s</span>
            <span className="h-3 w-px bg-indigo-950/20" />
            <span>ZERO SETUP DEMO</span>
          </div>

          {/* mockup + robots on the color field */}
          <div className="relative mx-auto mt-12 max-w-3xl pb-16">
            {/* robots — left */}
            <div className="absolute -left-44 bottom-10 hidden xl:block">
              <Robot body="#0b1020" visor="#1e2749" accent="#67e8f9" size={165} delay="0s" />
            </div>
            <div className="absolute -left-72 bottom-6 hidden 2xl:block">
              <Robot body="#ffffff" visor="#c7d2fe" accent="#4f46e5" size={120} delay="1.2s" />
            </div>
            {/* robots — right */}
            <div className="absolute -right-44 bottom-10 hidden xl:block">
              <Robot body="#ffffff" visor="#dbe0ff" accent="#4f46e5" size={165} delay="0.6s" flip />
            </div>
            <div className="absolute -right-72 bottom-6 hidden 2xl:block">
              <Robot body="#0b1020" visor="#1e2749" accent="#f472b6" size={120} delay="1.8s" flip />
            </div>
            <DashMockup />
          </div>
        </div>
      </section>

      {/* live intel ticker */}
      <Ticker />

      {/* the story: one change, minute by minute */}
      <section id="story" className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-center font-mono text-xs tracking-[0.25em] text-indigo-500">CASE FILE</p>
        <h2 className="font-display mt-3 text-center text-3xl font-bold tracking-tight md:text-[42px]">
          From their edit to your Slack.
          <br className="hidden md:block" /> Three minutes.
        </h2>

        <div className="relative mt-14 space-y-0 border-l-2 border-gray-100 pl-8 md:pl-10">
          {/* 07:00 */}
          <div className="relative pb-10">
            <span className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-200 bg-white md:-left-[49px]" />
            <p className="font-mono text-xs text-gray-400">07:00 · SWEEP #4,412</p>
            <p className="mt-1 text-sm text-gray-600">
              The hourly n8n sweep fetches Acme's pricing page. Fingerprint doesn't match yesterday's.
            </p>
          </div>

          {/* 07:02 diff */}
          <div className="relative pb-10">
            <span className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 md:-left-[49px]">
              <GitCompareArrows size={11} className="text-white" />
            </span>
            <p className="font-mono text-xs text-indigo-500">07:02 · CHANGE ISOLATED</p>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 font-mono text-xs shadow-sm">
              <div className="flex bg-red-50 px-4 py-1.5 text-red-700">
                <span className="w-5 select-none opacity-50">−</span>Pro price: $79 per user / month
              </div>
              <div className="flex bg-emerald-50 px-4 py-1.5 text-emerald-800">
                <span className="w-5 select-none opacity-50">+</span>Pro price: $69. New: Scale add-on — pay as you grow.
              </div>
            </div>
          </div>

          {/* 07:02 verdict */}
          <div className="relative pb-10">
            <span className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 md:-left-[49px]">
              <BrainCircuit size={11} className="text-white" />
            </span>
            <p className="font-mono text-xs text-indigo-500">07:02 · AI VERDICT (1.8s)</p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-900 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="rounded bg-violet-500/15 px-2 py-0.5 text-violet-300">pricing_change</span>
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-300">impact 8/10</span>
                <span className="text-gray-500">gpt-oss-120b · schema-validated</span>
              </div>
              <p className="mt-2.5 text-[13px] leading-6 text-gray-300">
                "A deliberate move against mid-market deals. Refresh the battlecard and prep objection
                handling for Q2 renewals."
              </p>
            </div>
          </div>

          {/* 07:03 slack */}
          <div className="relative pb-4">
            <span className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 md:-left-[49px]">
              <Bell size={11} className="text-white" />
            </span>
            <p className="font-mono text-xs text-emerald-600">07:03 · DELIVERED TO #PRICING-INTEL</p>
            <div className="mt-2 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <RadarIcon size={15} className="text-white" />
              </span>
              <div className="text-[13px] leading-6">
                <span className="font-semibold">Radar</span>{" "}
                <span className="rounded bg-gray-100 px-1 font-mono text-[10px] text-gray-400">APP 07:03</span>
                <p className="text-gray-600">
                  🚨 <b>Acme Analytics</b> — pricing_change (impact 8/10). Pro cut to $69 + usage add-on.{" "}
                  <span className="text-indigo-600">Recommended: refresh battlecard before Q2 renewals.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-gray-500">
          Your competitor spent weeks planning this move.{" "}
          <span className="font-semibold text-gray-900">You knew in three minutes.</span>
        </p>
      </section>

      {/* capabilities — dossier bento */}
      <section id="capabilities" className="border-t border-gray-100 bg-gray-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-xs tracking-[0.25em] text-indigo-500">CAPABILITIES</p>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-bold tracking-tight md:text-[42px]">
            A full intel operation, running itself
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map(({ code, icon: Icon, title, text, wide }) => (
              <div
                key={code}
                className={`group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-indigo-200 hover:shadow-md ${
                  wide ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white transition group-hover:bg-indigo-600">
                    <Icon size={17} />
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-gray-300">{code}</span>
                </div>
                <h3 className="font-display mt-5 text-[16px] font-semibold">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* war room — dark feature spotlight */}
      <section id="warroom" className="bg-[#0a0f1e] py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-red-400">CLASSIFIED FEATURE</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white md:text-[42px]">
              The War Room
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-gray-400">
              Two AI strategists, live. One argues as your competitor — armed with their real tracked
              moves. One defends your position. A neutral referee scores the fight and hands you three
              takeaways. It's the sparring session before the real match.
            </p>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
              Watch a live debate
            </button>
          </div>
          <div className="space-y-3">
            <div className="max-w-[90%] rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="flex items-center gap-1.5 font-mono text-[10px] text-red-300">
                <Swords size={11} /> ACME — CHIEF STRATEGIST
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-gray-300">
                "We just cut Pro to $69. Your mid-market customers are already doing the math — every
                renewal now starts with our pricing page open in a second tab."
              </p>
            </div>
            <div className="ml-auto max-w-[90%] rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4">
              <p className="flex items-center justify-end gap-1.5 font-mono text-[10px] text-indigo-300">
                OUR VP OF STRATEGY <Shield size={11} />
              </p>
              <p className="mt-1.5 text-right text-[13px] leading-6 text-gray-300">
                "A 13% cut isn't strategy — it's margin panic. You've just trained your market to wait
                for discounts. Renewals are won on twelve months of reliability, not a sticker."
              </p>
            </div>
            <div className="mx-auto max-w-[95%] rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <p className="font-mono text-[10px] text-amber-300">⚖ REFEREE — VERDICT</p>
              <p className="mt-1.5 text-[13px] leading-6 text-gray-400">
                "Defender wins the exchange. Takeaway #1: prepare a total-cost-of-ownership battlecard
                before renewal season…"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* pricing — one split panel, not a card grid */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-center font-mono text-xs tracking-[0.25em] text-indigo-500">ACCESS</p>
        <h2 className="font-display mt-3 text-center text-3xl font-bold tracking-tight md:text-[42px]">
          Start free. Scale when you're winning.
        </h2>
        <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200 shadow-sm md:grid md:grid-cols-2">
          <div className="border-b border-gray-200 bg-white p-8 md:border-b-0 md:border-r">
            <p className="font-mono text-[11px] tracking-widest text-gray-400">RECON</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">$0</span>
              <span className="text-sm text-gray-400">/mo</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-gray-600">
              {["3 competitors on radar", "Hourly sweeps + AI verdicts", "Diff forensics", "In-app alerts"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-gray-400" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-900 p-8">
            <p className="font-mono text-[11px] tracking-widest text-indigo-300">FULL OPERATION</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-white">$49</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
              {["Unlimited competitors", "Slack alerts + channel routing", "AI weekly briefings", "War Room debates", "Priority AI analysis"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-indigo-400" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="mt-7 w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
            >
              Try everything in the demo
            </button>
          </div>
        </div>
      </section>

      {/* FAQ — side heading layout */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50/60 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-indigo-500">DEBRIEF</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-[42px]">
              Questions, answered
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
              Everything teams usually ask before putting their market on radar.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-800 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="ml-4 font-mono text-gray-300 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[13px] leading-6 text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA — terminal style with live radar */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1e] px-8 py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 100%, rgba(99,102,241,0.35) 0%, transparent 70%)",
            }}
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="text-center lg:text-left">
              <p className="font-mono text-xs tracking-[0.3em] text-indigo-300">
                TARGETS ACQUIRED: 0 — AWAITING ORDERS
              </p>
              <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
                Your competitors are shipping right now.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-400 lg:mx-0">
                The demo takes one click and 30 seconds. The insight lasts all quarter.
              </p>
              <button
                onClick={exploreDemo}
                disabled={demoLoading}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <RadarIcon size={16} />}
                Begin surveillance
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="hidden lg:block">
              <RadarScreen />
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <RadarIcon size={14} className="text-white" />
            </span>
            <div>
              <div className="font-display text-sm font-semibold">Radar</div>
              <div className="text-[11px] text-gray-400">Competitive intelligence, automated</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-gray-500">
            <a href="#capabilities" className="hover:text-gray-900">Capabilities</a>
            <a href="#warroom" className="hover:text-gray-900">War Room</a>
            <Link to="/login" className="hover:text-gray-900">Sign in</Link>
          </div>
          <p className="font-mono text-[11px] text-gray-300">
            n8n · groq gpt-oss-120b · fastapi · supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
