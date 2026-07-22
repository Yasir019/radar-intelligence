import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  CheckCircle2,
  FileText,
  GitCompareArrows,
  Globe,
  Loader2,
  Radar as RadarIcon,
  Sparkles,
  Star,
  Swords,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------------------------- data ---------------------------------- */

const FEATURE_CARDS = [
  {
    icon: BrainCircuit,
    tint: "bg-indigo-50 border-indigo-100",
    iconTint: "bg-indigo-100 text-indigo-600",
    title: "AI Impact Analysis",
    text: "Every change is scored 1-10 by an LLM with a summary and one concrete recommended action — schema-enforced, never vague.",
  },
  {
    icon: GitCompareArrows,
    tint: "bg-emerald-50 border-emerald-100",
    iconTint: "bg-emerald-100 text-emerald-600",
    title: "Change Detection",
    text: "Content hashing catches every meaningful edit. Line-by-line diffs show exactly what changed — old in red, new in green.",
  },
  {
    icon: Bell,
    tint: "bg-violet-50 border-violet-100",
    iconTint: "bg-violet-100 text-violet-600",
    title: "Smart Slack Routing",
    text: "High-impact changes hit Slack instantly. Pricing moves route to your pricing channel — the noise never reaches your team.",
  },
  {
    icon: Swords,
    tint: "bg-amber-50 border-amber-100",
    iconTint: "bg-amber-100 text-amber-600",
    title: "AI War Room",
    text: "Two AI strategists debate live — theirs attacks with their real tracked moves, yours defends. A referee delivers the verdict.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Add competitors",
    text: "Point Radar at their pricing, changelog and feature pages. Setup takes two minutes — then you never touch it again.",
  },
  {
    step: "2",
    title: "AI watches for you",
    text: "Automated hourly sweeps detect every change. The AI reads the diff, classifies it, and scores its competitive impact.",
  },
  {
    step: "3",
    title: "Act before they win",
    text: "Instant Slack alerts, weekly executive briefs and recommended actions — respond in hours, not weeks.",
  },
];

const CHECKLIST = [
  "Only the changed content is analyzed — fast, focused and cost-efficient",
  "Cosmetic churn scored low, so your team is never spammed",
  "Weekly executive briefs written by AI, delivered to Slack every Monday",
  "Full change history with diffs — evidence for every strategic call",
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    tag: "Perfect for trying Radar out.",
    popular: false,
    features: ["3 competitors", "Hourly automated checks", "AI impact analysis", "In-app alerts"],
    cta: "Get started",
  },
  {
    name: "Growth",
    price: "$49",
    tag: "For teams that compete to win.",
    popular: true,
    features: [
      "Unlimited competitors",
      "Slack alerts & channel routing",
      "AI weekly executive briefs",
      "AI War Room debates",
      "Priority AI analysis",
    ],
    cta: "Start free trial",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We found out about a competitor's pricing change the same morning it happened — and had a counter-offer approved before lunch. That used to take us three weeks.",
    name: "Sarah K.",
    role: "VP Sales · B2B SaaS",
    stars: 5,
  },
  {
    quote:
      "The weekly brief replaced a half-day of manual competitor research. My leadership team actually reads it — it's that sharp.",
    name: "Daniel M.",
    role: "Head of Product Marketing",
    stars: 5,
  },
  {
    quote:
      "The War Room sounds like a gimmick until you watch it argue your own weaknesses better than your board does. Genuinely useful prep.",
    name: "Ayesha R.",
    role: "Founder · Martech startup",
    stars: 4,
  },
];

const FAQS = [
  {
    q: "How does Radar detect changes?",
    a: "Radar fetches each tracked page on a schedule, strips the noise (menus, scripts, footers), and fingerprints the content. When the fingerprint changes, the old and new versions are diffed line-by-line and sent to the AI for analysis.",
  },
  {
    q: "Which pages should I track?",
    a: "Pricing pages, changelogs, feature pages and blogs give the strongest signal. Most teams track 3-5 pages per competitor.",
  },
  {
    q: "Will I get spammed with tiny changes?",
    a: "No. The AI classifies cosmetic edits (dates, typos, styling) with a low impact score, and only changes above your threshold trigger external alerts. You control the threshold.",
  },
  {
    q: "What powers the AI analysis?",
    a: "An LLM pipeline (Groq gpt-oss-120b) with schema-enforced JSON output — every analysis has a summary, category, 1-10 impact score and a recommended action, validated before it's stored.",
  },
  {
    q: "Can I try it without signing up?",
    a: "Yes — the live demo is pre-loaded with 4 competitors and 30 days of AI-analyzed changes. One click, no credit card, no email.",
  },
];

/* -------------------------------- component -------------------------------- */

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
      {/* ------------------------------- nav ------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <RadarIcon size={17} className="text-white" />
            </span>
            <span className="font-display text-[16px] font-bold tracking-tight">Radar</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            <a href="#features" className="transition hover:text-gray-900">Features</a>
            <a href="#how" className="transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="transition hover:text-gray-900">Pricing</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Login
            </Link>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-white">
        <div className="relative mx-auto max-w-7xl px-6 pt-20 text-center md:pt-24">
          <h1 className="font-display mx-auto max-w-4xl text-[42px] font-extrabold leading-[1.05] tracking-tight md:text-7xl">
            Master Your Market
            <br />
            with <span className="text-indigo-600">AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-gray-500 md:text-lg">
            Competitor monitoring, AI change analysis, instant Slack alerts and weekly executive
            briefs — all in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/80 transition hover:bg-indigo-700 hover:shadow-indigo-300/80 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Start Monitoring Free
            </button>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ▶ Watch Demo
            </button>
          </div>

          {/* ------------------------- product mockup ------------------------- */}
          <div className="relative mx-auto mt-16 max-w-5xl pb-24">
            <div className="rounded-[20px] bg-gradient-to-b from-gray-200/80 to-gray-100/40 p-2 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.25)]">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left">
                {/* window bar */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600">
                      <RadarIcon size={11} className="text-white" />
                    </span>
                    <span className="font-display text-xs font-bold">Radar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="grid md:grid-cols-[150px_1fr]">
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
                    {/* stat cards */}
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        ["Competitors", "4"],
                        ["Tracked pages", "16"],
                        ["Changes (7d)", "12"],
                        ["High impact", "3"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
                          <div className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                            {label}
                          </div>
                          <div className="font-display mt-0.5 text-lg font-bold">{value}</div>
                        </div>
                      ))}
                    </div>
                    {/* activity bars */}
                    <div className="mt-3 rounded-lg border border-gray-100 p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-500">Change activity</span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                          <TrendingUp size={10} /> +32% this week
                        </span>
                      </div>
                      <div className="flex h-14 items-end gap-1">
                        {[35, 55, 30, 70, 45, 85, 60, 40, 95, 65, 50, 75, 88, 58].map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t ${i === 8 ? "bg-indigo-500" : "bg-indigo-100"}`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* change rows */}
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
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- stack strip --------------------------- */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Powered by a real automation stack
        </p>
        <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-6">
          {["n8n", "Groq AI", "FastAPI", "Supabase", "Slack", "React"].map((name) => (
            <span key={name} className="font-display text-lg font-bold text-gray-300 transition hover:text-gray-400">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------------------- features ---------------------------- */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display mx-auto max-w-2xl text-center text-3xl font-extrabold tracking-tight md:text-5xl">
          Everything You Need to
          <br />
          Outpace Your Market
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-6 text-gray-500">
          From detection to analysis to action — Radar runs the full competitive-intelligence loop
          so your team only sees what matters.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map(({ icon: Icon, tint, iconTint, title, text }) => (
            <div key={title} className={`rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${tint}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconTint}`}>
                <Icon size={20} />
              </span>
              <h3 className="font-display mt-5 text-[15px] font-bold">{title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- how it works --------------------------- */}
      <section id="how" className="border-t border-gray-100 bg-gray-50/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-center text-3xl font-extrabold tracking-tight md:text-5xl">
            Your Path to Winning
          </h2>
          <div className="mt-14 space-y-8">
            {STEPS.map(({ step, title, text }) => (
              <div key={step} className="flex items-start gap-5">
                <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-200">
                  {step}
                </span>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex-1">
                  <h3 className="font-display text-[15px] font-bold">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-6 text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------- decisions (checklist + code) ---------------------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Don't Just Monitor,
              <br />
              <span className="bg-indigo-100 px-2 italic">Actually Act.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-600">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
            >
              Experience Radar AI
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
              <span className="font-mono text-xs text-gray-400">change_analysis.json</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                gpt-oss-120b · validated
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto font-mono text-[12.5px] leading-7 text-gray-300">
{`{
  `}<span className="text-sky-300">"summary"</span>{`: "Acme cut the Pro plan
    from $79 to $69 and added a
    usage-based Scale add-on.",
  `}<span className="text-sky-300">"category"</span>{`: `}<span className="text-violet-300">"pricing_change"</span>{`,
  `}<span className="text-sky-300">"impact_score"</span>{`: `}<span className="text-red-400">8</span>{`,
  `}<span className="text-sky-300">"recommended_action"</span>{`: "Refresh
    the battlecard and prep objection
    handling for Q2 renewals."
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ----------------------------- pricing ----------------------------- */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-center text-3xl font-extrabold tracking-tight md:text-5xl">
            Invest in Your Edge
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500">Simple plans for every team.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                  plan.popular ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-8 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-sm font-bold text-gray-500">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-gray-400">/mo</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{plan.tag}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Check size={15} className="shrink-0 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={exploreDemo}
                  disabled={demoLoading}
                  className={`mt-8 w-full rounded-full py-3 text-sm font-semibold transition disabled:opacity-60 ${
                    plan.popular
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- testimonials --------------------------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-center text-3xl font-extrabold tracking-tight md:text-5xl">
          Results Speak Louder
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role, stars }) => (
            <div key={name} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={i < stars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm italic leading-7 text-gray-600">"{quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-gray-50 pt-4">
                <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                  {name.slice(0, 1)}
                </span>
                <div>
                  <div className="text-[13px] font-semibold">{name}</div>
                  <div className="text-[11px] text-gray-400">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------- FAQ ------------------------------- */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50/60 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-center text-3xl font-extrabold tracking-tight md:text-5xl">FAQs</h2>
          <div className="mt-12 space-y-3">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm open:pb-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-800 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="ml-4 text-gray-300 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-[13px] leading-6 text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- final CTA ----------------------------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-8 py-16 text-center shadow-2xl shadow-indigo-200">
          <h2 className="font-display mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Start Your Competitive Edge Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">
            See the full product in 30 seconds — pre-loaded with competitors, AI analyses, diffs and a
            live War Room debate. No credit card, no email.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Start Monitoring Free
            </button>
            <Link
              to="/login"
              className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <RadarIcon size={17} className="text-white" />
              </span>
              <span className="font-display text-[16px] font-bold">Radar</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-gray-400">
              AI-powered competitor intelligence — automated monitoring, impact analysis and alerts
              for teams that compete to win.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Product</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] text-gray-500">
              <li><a href="#features" className="hover:text-gray-900">Features</a></li>
              <li><a href="#how" className="hover:text-gray-900">How it works</a></li>
              <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
              <li><button onClick={exploreDemo} className="hover:text-gray-900">Live demo</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Built with</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] text-gray-500">
              <li className="flex items-center gap-2"><Globe size={13} /> n8n automation</li>
              <li className="flex items-center gap-2"><BrainCircuit size={13} /> Groq gpt-oss-120b</li>
              <li className="flex items-center gap-2"><FileText size={13} /> FastAPI + React</li>
              <li className="flex items-center gap-2"><Bell size={13} /> Slack integration</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-gray-400">
            <span>© 2026 Radar. All rights reserved.</span>
            <span>Portfolio project · AI Automation Engineering</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
