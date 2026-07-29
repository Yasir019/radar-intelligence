import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  CircleDot,
  FileSearch,
  GitCompareArrows,
  Globe2,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  Swords,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./landing.css";

const steps = [
  {
    id: "detect",
    number: "01",
    label: "Detect",
    title: "Watch every critical page",
    copy: "Radar monitors pricing, product, campaign, and changelog pages on your schedule.",
  },
  {
    id: "compare",
    number: "02",
    label: "Compare",
    title: "Isolate the meaningful edit",
    copy: "Clean diffs remove boilerplate and preserve exactly what changed.",
  },
  {
    id: "analyze",
    number: "03",
    label: "Analyze",
    title: "Understand the competitive impact",
    copy: "AI scores the move, explains why it matters, and recommends one action.",
  },
  {
    id: "activate",
    number: "04",
    label: "Activate",
    title: "Move the right team",
    copy: "High-impact signals reach Slack and roll into your weekly executive brief.",
  },
] as const;

type StepId = (typeof steps)[number]["id"];

function RadarMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`lp-logo-mark ${dark ? "lp-logo-mark-dark" : ""}`}>
      <Radar size={17} strokeWidth={2.4} />
    </span>
  );
}

function WorkflowPreview({ active }: { active: StepId }) {
  if (active === "compare") {
    return (
      <div className="lp-preview-card">
        <div className="lp-preview-head">
          <div>
            <span className="lp-mini-label">Pricing page diff</span>
            <strong>Acme Analytics</strong>
          </div>
          <GitCompareArrows size={18} />
        </div>
        <div className="lp-diff">
          <div className="lp-diff-old">− Pro plan · $79 per user / month</div>
          <div className="lp-diff-new">+ Pro plan · $69 per user / month</div>
          <div className="lp-diff-new">+ Scale add-on · pay as you grow</div>
        </div>
        <p className="lp-preview-note">3 meaningful lines isolated from 1,284</p>
      </div>
    );
  }

  if (active === "analyze") {
    return (
      <div className="lp-preview-card lp-ai-card">
        <div className="lp-preview-head">
          <span className="lp-ai-label"><Sparkles size={14} /> AI verdict</span>
          <span className="lp-impact">Impact 8/10</span>
        </div>
        <h3>A deliberate mid-market pricing move.</h3>
        <p>
          Acme lowered the entry point and introduced usage-based expansion, creating a sharper price anchor in renewals.
        </p>
        <div className="lp-recommendation">
          <span>Recommended action</span>
          Update the battlecard and prepare total-cost-of-ownership objection handling this week.
        </div>
      </div>
    );
  }

  if (active === "activate") {
    return (
      <div className="lp-preview-card">
        <div className="lp-slack-title">
          <span className="lp-channel-icon"><Bell size={17} /></span>
          <div>
            <span className="lp-mini-label">Delivered in 1.8 seconds</span>
            <strong>#pricing-intel</strong>
          </div>
        </div>
        <div className="lp-slack-message">
          <div className="lp-slack-author">
            <RadarMark dark />
            <strong>Radar</strong>
            <span>just now</span>
          </div>
          <p>
            Acme cut Pro to $69 and added usage pricing. Impact 8/10. Battlecard update recommended before renewals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-preview-card">
      <div className="lp-preview-head">
        <div>
          <span className="lp-mini-label">Live coverage</span>
          <strong>16 pages under watch</strong>
        </div>
        <span className="lp-live"><i /> Active</span>
      </div>
      <div className="lp-watch-list">
        {[
          ["acme.com/pricing", "Checked 2m ago"],
          ["pipelinehq.com/changelog", "Checked 4m ago"],
          ["metricly.com/features", "Checked 7m ago"],
        ].map(([url, status]) => (
          <div className="lp-watch-row" key={url}>
            <span className="lp-watch-icon"><Globe2 size={15} /></span>
            <div>
              <strong>{url}</strong>
              <span>{status}</span>
            </div>
            <Check size={15} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("detect");
  const [navScrolled, setNavScrolled] = useState(false);
  const workflowSectionRef = useRef<HTMLElement>(null);
  const workflowTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 36);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const updateWorkflowStage = () => {
      const section = workflowSectionRef.current;
      const trigger = workflowTriggerRef.current;
      if (!section || !trigger || window.innerWidth <= 800) return;

      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      const triggerTop = window.scrollY + trigger.getBoundingClientRect().top;
      const start = triggerTop - 92;
      const end = sectionTop + section.offsetHeight - window.innerHeight;
      const progress = Math.min(0.999, Math.max(0, (window.scrollY - start) / Math.max(end - start, 1)));
      const nextStep = steps[Math.floor(progress * steps.length)];
      setActiveStep((current) => current === nextStep.id ? current : nextStep.id);
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateWorkflowStage();
      });
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const openDemo = async () => {
    setBusy(true);
    try {
      await login("demo@radar.app", "demo1234");
      navigate("/");
    } catch {
      navigate("/login");
    } finally {
      setBusy(false);
    }
  };

  const currentStep = steps.find((step) => step.id === activeStep) ?? steps[0];

  return (
    <div className="lp-page">
      <section className="lp-hero">
        <div className="lp-glow lp-glow-one" />
        <div className="lp-glow lp-glow-two" />

        <header className={`lp-nav lp-container${navScrolled ? " lp-nav-scrolled" : ""}`}>
          <a href="#" className="lp-brand">
            <RadarMark />
            <strong>Radar.</strong>
          </a>
          <nav>
            <a href="#proof">Why Radar</a>
            <a href="#workflow">How it works</a>
            <a href="#automation">Automation</a>
            <a href="#war-room">War Room</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="lp-nav-actions">
            <Link to="/login">Sign in</Link>
            <Link className="lp-signup-button" to="/login?mode=register">Sign up</Link>
          </div>
        </header>

        <div className="lp-hero-content lp-container">
          <div className="lp-pill"><CircleDot size={12} /> Always-on competitor intelligence</div>
          <h1>Know the move.<br /><span>Own the response.</span></h1>
          <p>
            Radar watches every critical competitor page, explains what changed, and gives your team the next best action before the market catches up.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-button lp-button-light" onClick={openDemo} disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Open live workspace
              <ArrowRight size={15} />
            </button>
            <a className="lp-button lp-button-ghost" href="#workflow">See how it works</a>
          </div>
          <span className="lp-hero-note">No card · 30 days of preloaded competitor activity</span>
        </div>
      </section>

      <section id="proof" className="lp-proof lp-section">
        <div className="lp-container">
          <div className="lp-section-intro lp-section-intro-center">
            <span className="lp-eyebrow">Clarity at market speed</span>
            <h2>Turn hours of research into one confident move.</h2>
          </div>
          <div className="lp-proof-grid">
            <article className="lp-proof-card lp-proof-lilac">
              <span className="lp-card-number">01 / Signal speed</span>
              <h3>Know within minutes,<br />not weeks.</h3>
              <strong className="lp-stat">&lt; 3 min</strong>
              <div className="lp-mini-chart">
                {[32, 50, 42, 68, 54, 88, 74].map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </article>
            <article className="lp-proof-card lp-proof-blue">
              <span className="lp-card-number">02 / AI triage</span>
              <h3>Separate strategy<br />from page noise.</h3>
              <strong className="lp-stat">1–10</strong>
              <div className="lp-score-orbit"><BrainCircuit size={28} /></div>
            </article>
            <article className="lp-proof-card lp-proof-green">
              <span className="lp-card-number">03 / Coverage</span>
              <h3>Keep every critical<br />page in view.</h3>
              <strong className="lp-stat">24/7</strong>
              <div className="lp-radar-art"><Radar size={34} /></div>
            </article>
          </div>
        </div>
      </section>

      <section ref={workflowSectionRef} id="workflow" className="lp-workflow lp-section">
        <div className="lp-container">
          <div className="lp-section-intro lp-section-intro-center">
            <span className="lp-eyebrow">One operating loop</span>
            <h2>From page change to team action in minutes.</h2>
            <p>No noisy dashboards. Just one clean path from evidence to decision.</p>
          </div>
          <div ref={workflowTriggerRef} className="lp-workflow-trigger" aria-hidden="true"></div>
          <div className="lp-workflow-shell">
            <div className="lp-workflow-bar">
              <div className="lp-workflow-product">
                <RadarMark dark />
                <div><strong>Radar Intelligence</strong><span>Live workspace</span></div>
              </div>
              <span className="lp-workflow-status"><i></i> Monitoring 16 pages</span>
            </div>
            <div className="lp-step-rail" role="tablist" aria-label="Radar operating loop">
              {steps.map((step) => {
                const active = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    role="tab"
                    aria-selected={active}
                    className={`lp-step ${active ? "lp-step-active" : ""}`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <span>{step.number}</span>
                    <strong>{step.label}</strong>
                  </button>
                );
              })}
            </div>
            <div className="lp-workflow-canvas">
              <div key={`context-${activeStep}`} className="lp-workflow-context lp-context-swap">
                <span className="lp-mini-label">Stage {currentStep.number}</span>
                <h3>{currentStep.title}</h3>
                <p>{currentStep.copy}</p>
                <div className="lp-stage-progress">
                  <span>Signal journey</span>
                  <div>{steps.map((step) => <i key={step.id} className={steps.indexOf(step) <= steps.indexOf(currentStep) ? "is-complete" : ""}></i>)}</div>
                </div>
                <small>Average time to action</small>
                <strong className="lp-time-value">2m 48s</strong>
              </div>
              <div className="lp-preview-stage">
                <div key={`preview-${activeStep}`} className="lp-preview-motion">
                  <WorkflowPreview active={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="automation" className="lp-automation lp-section">
        <div className="lp-container">
          <div className="lp-section-intro lp-section-intro-center">
            <span className="lp-eyebrow">Your always-on analyst</span>
            <h2>Nothing important waits for Monday.</h2>
            <p>Radar watches, evaluates, and routes competitive signals around the clock—then leaves a clean decision trail for your team.</p>
          </div>
          <div className="lp-automation-console">
            <div className="lp-automation-head">
              <div><Workflow size={16} /><strong>Automation center</strong></div>
              <span><i></i> All systems running</span>
            </div>
            <div className="lp-automation-grid">
              <div className="lp-automation-feed">
                <div className="lp-feed-title"><span>Today</span><small>Live activity · Karachi time</small></div>
                <div className="lp-feed-row">
                  <time>08:00</time>
                  <span className="lp-feed-icon"><Globe2 size={15} /></span>
                  <div><strong>Morning surveillance completed</strong><p>127 competitor pages checked. Four meaningful changes found.</p></div>
                  <small>Done</small>
                </div>
                <div className="lp-feed-row lp-feed-row-active">
                  <time>08:03</time>
                  <span className="lp-feed-icon"><Sparkles size={15} /></span>
                  <div><strong>Pricing change scored 8/10</strong><p>Acme’s new usage model may affect upcoming renewals.</p></div>
                  <small>Analyzed</small>
                </div>
                <div className="lp-feed-row">
                  <time>08:05</time>
                  <span className="lp-feed-icon"><Bell size={15} /></span>
                  <div><strong>Revenue team briefed</strong><p>Evidence, impact, and recommended response delivered automatically.</p></div>
                  <small>Sent</small>
                </div>
                <div className="lp-feed-row">
                  <time>Fri</time>
                  <span className="lp-feed-icon"><FileSearch size={15} /></span>
                  <div><strong>Executive briefing scheduled</strong><p>The week’s decisions will arrive as one concise, searchable brief.</p></div>
                  <small>Queued</small>
                </div>
              </div>
              <aside className="lp-automation-summary">
                <span className="lp-mini-label">This week</span>
                <strong>Every signal accounted for.</strong>
                <div className="lp-summary-metric"><span>Pages checked</span><b>847</b></div>
                <div className="lp-summary-metric"><span>Noise removed</span><b>96%</b></div>
                <div className="lp-summary-metric"><span>Actions delivered</span><b>12</b></div>
                <div className="lp-summary-note"><ShieldCheck size={16} /><span><strong>Zero critical signals missed</strong>Coverage verified 3 minutes ago</span></div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-section-intro lp-section-intro-center">
            <span className="lp-eyebrow">Simple pricing</span>
            <h2>Start exploring today. Upgrade when your team is ready.</h2>
            <p>Use the complete demo workspace now. Team plans are being prepared for launch.</p>
          </div>
          <div className="lp-pricing-grid">
            <article className="lp-price-card">
              <span className="lp-price-kicker">Live workspace</span>
              <h3>Explorer</h3>
              <div className="lp-price"><strong>$0</strong><span>/ forever</span></div>
              <p>See the full Radar experience with a preloaded competitive-intelligence workspace.</p>
              <ul>
                <li><Check size={14} /> 4 demo competitors</li>
                <li><Check size={14} /> 30 days of analyzed changes</li>
                <li><Check size={14} /> AI briefs and War Room</li>
              </ul>
              <button onClick={openDemo}>Open live demo <ArrowRight size={14} /></button>
            </article>
            <article className="lp-price-card lp-price-card-featured">
              <span className="lp-coming-soon">Coming soon</span>
              <span className="lp-price-kicker">For active teams</span>
              <h3>Radar Team</h3>
              <div className="lp-price"><strong>$49</strong><span>/ month</span></div>
              <p>Always-on monitoring and team delivery for companies running a real competitive program.</p>
              <ul>
                <li><Check size={14} /> Unlimited competitors</li>
                <li><Check size={14} /> Automated alerts and routing</li>
                <li><Check size={14} /> Weekly executive briefings</li>
              </ul>
              <button disabled>Join the waitlist soon</button>
            </article>
          </div>
        </div>
      </section>

      <section id="war-room" className="lp-war-section lp-section">
        <div className="lp-container">
          <div className="lp-war-card">
            <div className="lp-war-copy">
              <span className="lp-war-pill"><Swords size={13} /> Strategic simulation</span>
              <h2>Pressure-test the response before the market does.</h2>
              <p>
                The AI War Room turns tracked competitor moves into a live strategy debate, then gives your team a decisive referee verdict.
              </p>
              <button onClick={openDemo}>Enter the War Room <ArrowRight size={14} /></button>
            </div>
            <div className="lp-debate-stage">
              <div className="lp-debate">
                <div className="lp-debate-header">
                  <div><span></span><span></span><span></span></div>
                  <strong>Live strategy room</strong>
                  <small>3 agents live</small>
                </div>
                <div className="lp-bubble lp-bubble-red">
                  <span>Acme strategist</span>
                  “Every renewal now begins with our lower price open in another tab.”
                </div>
                <div className="lp-bubble lp-bubble-purple">
                  <span>Your VP of strategy</span>
                  “The lower sticker price hides the usage penalty customers meet when they grow.”
                </div>
                <div className="lp-bubble lp-bubble-gold">
                  <span>Referee verdict</span>
                  Lead with total cost of ownership. Update renewal objection handling this week.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-final-section">
        <div className="lp-final-card">
          <ShieldCheck size={25} />
          <h2>Your market is moving right now.</h2>
          <p>Open the live workspace and see a month of competitor activity already analyzed, scored, and ready to act on.</p>
          <button onClick={openDemo} disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />}
            Explore Radar <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-brand"><RadarMark dark /><div><strong>Radar.</strong><span>Competitive intelligence, automated</span></div></div>
          <div className="lp-footer-end">
            <span>© 2026 Radar Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
