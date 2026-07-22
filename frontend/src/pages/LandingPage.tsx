import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  FileText,
  GitCompareArrows,
  Globe,
  Loader2,
  Radar as RadarIcon,
  Sparkles,
  Swords,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: Globe,
    title: "Automatic monitoring",
    text: "Tracks competitors' pricing, changelog, features and blog pages every hour — powered by an n8n automation workflow. No manual checking, ever.",
  },
  {
    icon: GitCompareArrows,
    title: "Change detection",
    text: "Content hashing catches every meaningful edit. See exactly what changed with a line-by-line diff — old in red, new in green.",
  },
  {
    icon: BrainCircuit,
    title: "AI impact analysis",
    text: "Every change is analyzed by an LLM: what changed, why it matters, a 1-10 impact score, and one concrete recommended action.",
  },
  {
    icon: Bell,
    title: "Smart Slack alerts",
    text: "High-impact changes hit your Slack instantly. Pricing moves route to your pricing channel — noise stays out.",
  },
  {
    icon: FileText,
    title: "AI weekly brief",
    text: "Every Monday, an executive-ready competitive brief lands in Slack: highlights, threats, opportunities, and actions.",
  },
  {
    icon: Swords,
    title: "AI War Room",
    text: "Two AI strategists debate live — theirs attacks with their real tracked moves, yours defends. Watch arguments stream in real time.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Add competitors",
    text: "Point Radar at their pricing, features and changelog pages. Takes two minutes.",
  },
  {
    step: "02",
    title: "AI watches for you",
    text: "Hourly automated sweeps detect changes and the AI scores their competitive impact.",
  },
  {
    step: "03",
    title: "Act before they win",
    text: "Instant Slack alerts, diff views and recommended actions — respond in hours, not weeks.",
  },
];

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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <RadarIcon size={17} className="text-white" />
            </span>
            <span className="text-[15px] font-semibold">Radar</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-gray-500 md:flex">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#how" className="hover:text-gray-900">How it works</a>
            <a href="#ai" className="hover:text-gray-900">The AI</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Sign in
            </Link>
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Live demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 text-center md:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Zap size={12} />
            AI-powered competitive intelligence
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Know what your competitors changed —{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              minutes after they change it
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500 md:text-lg">
            Radar watches competitor pricing pages, changelogs and feature pages around the clock.
            AI analyzes every change, scores its impact, and tells your team exactly what to do about it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={exploreDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Explore the live demo
              <ArrowRight size={15} />
            </button>
            <Link
              to="/login"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Create free account
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            No credit card · Pre-seeded demo with 4 competitors and 30 days of AI-analyzed changes
          </p>

          {/* Product mockup */}
          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-200/60">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 text-left">
                {/* fake topbar */}
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                {/* fake alert card */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                      AC
                    </span>
                    <span className="text-sm font-semibold">Acme Analytics</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      Pricing
                    </span>
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      8/10
                    </span>
                    <span className="ml-auto text-xs text-gray-400">2 min ago</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Acme cut the Pro plan from $79 to $69 per user and introduced a usage-based
                    "Scale" add-on. This is a deliberate move against mid-market deals.
                  </p>
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                    <p className="text-xs leading-5 text-indigo-900">
                      <span className="font-semibold">Recommended:</span> Refresh the Acme battlecard
                      with the new pricing and prep objection handling for Q2 renewals.
                    </p>
                  </div>
                </div>
                {/* fake diff */}
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white font-mono text-xs shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-2 font-sans text-xs font-semibold text-gray-500">
                    What changed on the page
                  </div>
                  <div className="flex bg-red-50 px-4 py-1 text-red-700">
                    <span className="w-5 select-none opacity-60">−</span>Pro price: $79 per user / month
                  </div>
                  <div className="flex bg-emerald-50 px-4 py-1 text-emerald-800">
                    <span className="w-5 select-none opacity-60">+</span>Pro price: $69. New: Scale add-on — pay as you grow.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
          {[
            ["24/7", "automated monitoring"],
            ["< 60 min", "change-to-alert time"],
            ["1-10", "AI impact scoring"],
            ["100%", "human-readable briefs"],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              <div className="mt-1 text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Everything a competitive intel team does — automated
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
            From detection to analysis to action, Radar runs the full loop so your team only sees
            what matters.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ step, title, text }) => (
              <div key={step} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="text-3xl font-semibold text-indigo-100">{step}</span>
                <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <BrainCircuit size={12} />
              Structured AI pipeline
            </span>
            <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
              Not summaries. <span className="text-indigo-600">Decisions.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-500">
              Every detected change goes through an LLM pipeline with schema-enforced output — a
              summary, a category, a 1-10 impact score and one concrete recommended action. Validated,
              stored, and routed to the right Slack channel automatically.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Only the changed content is analyzed — fast and cost-efficient",
                "Cosmetic churn is scored low so your team never gets spammed",
                "Weekly executive briefs written by AI, delivered to Slack",
                "AI War Room: watch two strategists debate your position live",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-gray-700/60 pb-3">
              <Activity size={14} className="text-emerald-400" />
              <span className="font-mono text-xs text-gray-400">change_analysis · gpt-oss-120b</span>
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-[12px] leading-6 text-gray-300">
{`{
  "summary": "Acme cut the Pro plan from
    $79 to $69 and added a usage-based
    Scale add-on.",
  "category": `}<span className="text-violet-400">"pricing_change"</span>{`,
  "impact_score": `}<span className="text-red-400">8</span>{`,
  "recommended_action": "Refresh the
    battlecard and prep objection
    handling for Q2 renewals."
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Automation strip */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-10 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1.5"><Workflow size={14} /> n8n automation</span>
          <span className="flex items-center gap-1.5"><BrainCircuit size={14} /> Groq gpt-oss-120b</span>
          <span className="flex items-center gap-1.5"><Zap size={14} /> FastAPI</span>
          <span className="flex items-center gap-1.5"><Activity size={14} /> Supabase Postgres</span>
          <span className="flex items-center gap-1.5"><Bell size={14} /> Slack alerts</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-14 text-center shadow-xl shadow-indigo-200">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Stop finding out from lost deals
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-indigo-100">
            See the full product in 30 seconds — pre-loaded with competitors, AI analyses, diffs and
            a live War Room debate.
          </p>
          <button
            onClick={exploreDemo}
            disabled={demoLoading}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 disabled:opacity-60"
          >
            {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Explore the live demo
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <RadarIcon size={13} className="text-white" />
            </span>
            <span className="font-medium text-gray-500">Radar — Competitor Intelligence</span>
          </div>
          <span>Built with FastAPI · React · n8n · Groq AI</span>
        </div>
      </footer>
    </div>
  );
}
