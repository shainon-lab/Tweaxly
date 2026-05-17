import Logo from "@/components/Logo";

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Business Signals you can act on",
    body: "Rotating, plain-English insights anchored to specific months — payroll growth, vendor spikes, margin shifts, expense jumps. Refresh to surface different angles; close anything you don't want right now.",
  },
  {
    title: "Insights with seven charts in one view",
    body: "Trend, cash flow, top expense categories, revenue channels, spending shape, biggest swing, and top vendors — all driven by one period filter (last 6 months, monthly, quarterly, yearly, or a custom range).",
  },
  {
    title: "Forecast as a decision-impact engine",
    body: "Baseline vs scenario, side-by-side. Layer in hires, terminations, raises, marketing changes, new contracts, one-time expenses — see the dollar effect on revenue, expenses, profit, and cashflow before you commit.",
  },
  {
    title: "Workforce Overview — financial, not HR",
    body: "Real cost per employee (salary + taxes + pension + benefits + extras), payroll growth vs revenue, fixed vs variable workforce cost, and how many hires the business can actually afford right now.",
  },
  {
    title: "Threshold notifications & AI advisor",
    body: "Define alert rules (\"revenue down 10% MoM\", \"expenses above $5,000 QoQ\") and they fire automatically. Ask the advisor any question — it answers with your real categories, vendors, and trends.",
  },
  {
    title: "Multi-source upload, branded workspace",
    body: "Import CSV/Excel from any bank, credit card, or PSP. Rules auto-categorize on every future import. Upload your own logo and favicon — Tweaxly is the engine in the background.",
  },
];

const MODULES: { name: string; tagline: string; body: string }[] = [
  {
    name: "Dashboard",
    tagline: "What changed",
    body: "Live KPIs (revenue, expenses, net profit, payroll, headcount), period comparisons, business signals, and threshold alerts — the first thing you see every morning.",
  },
  {
    name: "Insights",
    tagline: "Why it changed",
    body: "Seven visual breakdowns across one chosen window — trend, cash flow, top expense categories, revenue channels, spending shape, swing analysis, top vendors.",
  },
  {
    name: "Workforce Overview",
    tagline: "What the team costs",
    body: "Real per-employee cost, payroll-to-revenue ratio, fixed vs variable workforce, contractor share, and how many hires you can support — no HR clutter.",
  },
  {
    name: "Forecast",
    tagline: "What happens next",
    body: "Baseline projection plus a scenario layer. Add hires, marketing changes, new revenue, one-time expenses — every assumption flows through to projected profit and cashflow.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is TWEAXLY?",
    a: "TWEAXLY is an AI-powered business intelligence platform for small and medium business owners. It connects your financial data — bank, credit card, payroll, invoices — and turns it into a live dashboard, forecasts, alerts, and an AI advisor that answers questions in plain English.",
  },
  {
    q: "Is this accounting software?",
    a: "No. TWEAXLY isn't bookkeeping or ERP. It's the intelligence layer above the systems you already use: it reads your data, tells you what changed, what matters, and what to do next. Your accountant still does the books.",
  },
  {
    q: "What data sources does TWEAXLY support?",
    a: "Bank transactions, credit cards, PayPal/Stripe, invoicing, payroll, and manual entries (recurring or one-time). You can import CSV/Excel files from any source — auto-categorization rules learn your patterns and apply on every future upload.",
  },
  {
    q: "How long does it take to set up?",
    a: "Most owners are looking at their first dashboard within 5 minutes: upload one bank statement, accept the suggested categories, and the platform fills in the rest. Forecasts and alerts get sharper as you import more.",
  },
  {
    q: "Do I need to be technical or financially trained?",
    a: "No. TWEAXLY is built for owners, not accountants. Every screen is designed around the questions you actually ask: am I profitable, what's changing, and what should I do about it?",
  },
  {
    q: "Can the AI advisor see my real numbers?",
    a: "Yes — that's the point. The advisor reads your actual categories, vendors, employees, and monthly snapshots, so its answers reference your real situation (\"your Marketing & Ads spend in May was $1,100, down from $2,400 in April…\") instead of generic finance tips.",
  },
  {
    q: "Is my data secure?",
    a: "Your business data is stored in your private workspace and never used to train shared models. We process the minimum amount of data needed to generate the dashboards and answers you see.",
  },
  {
    q: "How much does it cost?",
    a: "We're onboarding a small group of business owners during early access. Pricing will be announced closer to general availability — join the waitlist and we'll keep you posted.",
  },
];

const PRODUCT_URL = "https://adoption-bus-bee-regularly.trycloudflare.com";
const SIGNUP_URL = `${PRODUCT_URL}/register`;
const LOGIN_URL  = `${PRODUCT_URL}/login`;

export default function Home() {
  return (
    <main className="flex-1">
      <header className="container-tweaxly pt-10 pb-6 flex items-center justify-between gap-3">
        <Logo size="md" showTagline />
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#modules" className="hover:text-white transition">Modules</a>
          <a href="#how-it-works" className="hover:text-white transition">How it works</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a href={LOGIN_URL} className="btn-ghost text-sm">Log in</a>
          <a href={SIGNUP_URL} className="btn-brand text-sm">Sign up</a>
        </div>
      </header>

      {/* Hero */}
      <section className="container-tweaxly pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900/60 px-3 py-1 text-xs text-slate-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-good" />
          AI-powered business intelligence for small business owners
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
          Know what&rsquo;s <span className="gradient-text">really happening</span> in your business.
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          Tweaxly connects your revenue, expenses, payroll, and cashflow into one
          intelligent layer — giving you forecasts, business signals, and smarter
          decision support.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
            Try the platform
          </a>
          <a href="#features" className="btn-ghost text-base px-6 py-3">
            See features
          </a>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="container-tweaxly py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Built for owners, not accountants
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Every screen is designed to answer the questions you actually ask:
            am I profitable, what&apos;s changing, and what should I do about it?
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="text-base font-semibold text-white mb-2">{f.title}</div>
              <div className="text-sm text-slate-400">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules — what's actually in the platform */}
      <section id="modules" className="container-tweaxly py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Four intelligence modules, one workspace
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Each module answers a different question — together they give you the
            full operating picture without the spreadsheet workout.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map((m) => (
            <div key={m.name} className="card">
              <div className="text-xs uppercase tracking-wide text-slate-400">{m.tagline}</div>
              <div className="text-lg font-semibold text-white mt-1 mb-2">{m.name}</div>
              <div className="text-sm text-slate-400">{m.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-tweaxly py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            From first upload to clarity in 5 minutes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Connect your data", body: "Upload bank/credit card statements, or paste them in. Add manual entries for income or expenses that don't show up in transactions." },
            { step: "2", title: "Categorize once", body: "Set up rules so future imports auto-tag themselves. Every other number on the platform sharpens as your data does." },
            { step: "3", title: "Ask anything", body: "Open the consultation tab and ask questions in plain English. The advisor reads your real data and answers like a CFO who's been with you for years." },
          ].map((s) => (
            <div key={s.step} className="card">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-brand-purple/20 text-brand-purple font-semibold">
                  {s.step}
                </span>
                <div className="text-base font-semibold text-white">{s.title}</div>
              </div>
              <div className="text-sm text-slate-400">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-tweaxly py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Common questions about TWEAXLY, how it works, and what you get.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <div className="faq-answer">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-tweaxly py-20">
        <div className="card text-center" style={{ backgroundColor: "#0a1428" }}>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Stop wondering. <span className="gradient-text">Start knowing.</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Open your TWEAXLY workspace and see your finances the way they should look.
          </p>
          <div className="mt-8">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              Try the platform
            </a>
          </div>
        </div>
      </section>

      <footer className="container-tweaxly py-10 border-t border-line text-xs text-slate-500 flex items-center justify-between">
        <div>© {new Date().getFullYear()} TWEAXLY</div>
        <div>AI-Powered Business Intelligence</div>
      </footer>
    </main>
  );
}
