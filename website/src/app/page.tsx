import Logo from "@/components/Logo";
import { SignalDeckFull, SignalDeckHero } from "@/components/mocks/SignalDeck";
import { ForecastChart } from "@/components/mocks/ForecastChart";
import { ConsultationMock } from "@/components/mocks/Consultation";
import { ExecutiveOverviewMock } from "@/components/mocks/ExecutiveOverview";
import { PreferencesLink } from "@/lib/consent";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const LOGIN_URL   = `${PRODUCT_URL}/login`;

const POSITIONING = [
  "Built for modern SMB owners",
  "AI-native financial intelligence",
  "Trends detected in real time",
  "Forecast business impact",
  "Signals you can act on",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Tweaxly?",
    a: "Tweaxly is an AI financial intelligence platform for small and medium business owners. It connects your financial activity, surfaces business signals in real time, runs cash flow forecasting and revenue forecasting, and gives you an AI financial advisor that understands your real numbers — so you can run your business with the clarity of a finance team without hiring one.",
  },
  {
    q: "What is an AI financial advisor?",
    a: "An AI financial advisor reads the actual numbers in your business — categories, vendors, payroll, monthly snapshots — and answers questions about them in plain English. Unlike a generic finance chatbot, it references your real data (\"Marketing spend in May was $1,100, down from $2,400 in April\") and reasons over financial trends, cash flow, and forecasts you can verify.",
  },
  {
    q: "How does AI financial forecasting work?",
    a: "Tweaxly's forecasting engine combines validated historical actuals with detected trends, recurring patterns, light seasonality, and your own scenarios into an explainable projection. Every forecasted number is traceable to a baseline period, growth assumption, and confidence score — no black-box AI predictions.",
  },
  {
    q: "Can Tweaxly help with cash flow forecasting?",
    a: "Yes — cash flow forecasting is one of the core surfaces. The platform projects expected revenue, expenses, payroll, and net cash position month by month, and lets you layer hires, marketing changes, contracts, and one-time items on top to model what-if scenarios.",
  },
  {
    q: "Is Tweaxly a financial planning platform?",
    a: "Yes. Tweaxly is built for AI-powered financial planning — financial forecasting, scenario modeling, expense tracking and forecasting, revenue forecasting, and business performance analytics — all in one financial intelligence platform.",
  },
  {
    q: "How does AI detect business signals?",
    a: "Tweaxly continuously watches every line of your financial data and flags changes worth your attention — vendor cost spikes, margin compression, cash risks, unusual financial behavior, and growth opportunities — using statistical thresholds plus AI interpretation, with a confidence level on every signal.",
  },
  {
    q: "Can I track business expenses and revenue in real time?",
    a: "Yes. Connect or upload bank, card, and payment-processor data and the platform produces a real-time financial dashboard with revenue, expenses, payroll, profitability, and cash flow updated as new data arrives.",
  },
  {
    q: "Is Tweaxly suitable for small businesses?",
    a: "Tweaxly is built specifically for small and medium business owners who need financial intelligence without hiring a CFO. It's small business financial software designed around the questions owners actually ask — am I profitable, what changed, what should I do about it?",
  },
  {
    q: "What makes Tweaxly different from accounting software?",
    a: "Tweaxly isn't bookkeeping or ERP. It's the intelligence layer above the systems you already use — it reads your data, tells you what changed, what matters, and what to do next. Your accountant still does the books; Tweaxly turns those books into business insights.",
  },
  {
    q: "Can Tweaxly forecast future business performance?",
    a: "Yes — Tweaxly produces forward-looking projections for revenue, expenses, payroll, profitability, and cash flow, with confidence bands. Forecasts are based on validated historical data and respect the financial-date rule (no in-progress months distorting the trend).",
  },
  {
    q: "How does the AI advisory system work?",
    a: "The AI advisor sees your aggregated business context — current and trailing-month snapshots, top vendors, top categories, employees, forecast, recent uploads, and free-text notes from your own transactions — and uses that to answer free-form questions about your business in real time.",
  },
  {
    q: "Does Tweaxly replace a CFO?",
    a: "Tweaxly doesn't replace a senior CFO for complex M&A or capital-strategy work, but it covers the day-to-day financial intelligence most SMBs hire fractional CFOs for — financial planning, forecasting, expense tracking, business performance analytics, and decision-support advisory.",
  },
  {
    q: "Can I connect multiple business accounts?",
    a: "Yes. Owners with more than one business can run multiple workspaces under a single login. Each workspace has its own base currency, fiscal year, transactions, forecast, and AI advisor context.",
  },
  {
    q: "How does financial trend analysis work?",
    a: "Tweaxly compares each period to its trailing window and to comparable prior periods to surface trends — revenue growth, margin shifts, payroll ratio changes, expense-category trajectories — and explains them in plain language with the underlying numbers attached.",
  },
  {
    q: "Can Tweaxly identify unusual business activity?",
    a: "Yes. Statistical outlier detection plus pattern matching identifies unusual months, vendor cost spikes, missing expected income, duplicate transactions, and other irregularities. These surface in the signals deck with severity tags and recommended actions.",
  },
  {
    q: "What financial metrics does Tweaxly monitor?",
    a: "Revenue, expenses, net profit, normalized profit (one-times excluded), fixed and variable expenses, payroll, marketing spend, processing fees, taxes, one-time costs, gross margin, cash flow, payroll-to-revenue ratio, marketing-to-revenue ratio — plus per-category and per-vendor totals.",
  },
  {
    q: "Do I need to be technical or financially trained?",
    a: "No. Tweaxly is built for owners, not accountants. Every screen is designed around the questions you actually ask, and the AI advisor accepts plain-English questions and answers in plain English — no formulas, no SQL, no spreadsheets.",
  },
  {
    q: "Is my data secure?",
    a: "Your business data lives in your private workspace and is never used to train shared models. We process only the minimum data needed to generate the dashboards, signals, forecasts, and answers you see.",
  },
  {
    q: "How much does it cost?",
    a: "We're onboarding a small group of business owners during early access. Pricing will be announced closer to general availability — sign up and we'll keep you posted.",
  },
];

export default function Home() {
  return (
    <main id="main-content" className="flex-1 overflow-x-hidden">
      <SiteHeader />
      <Hero />
      <PositioningStrip />
      <SignalsSection />
      <ConsultationSection />
      <ForecastSection />
      <OverviewSection />
      <SeoUnifiedSection />
      <HowItWorks />
      <FAQSection />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────

function SiteHeader() {
  return (
    <header className="container-wide pt-6 sm:pt-8 pb-4 flex items-center justify-between gap-2 sm:gap-3">
      {/* `min-w-0` lets the logo shrink rather than pushing the
          action buttons off-screen on narrow viewports. */}
      <div className="min-w-0">
        <Logo size="md" showTagline />
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
        <a href="#signals"       className="hover:text-white transition">Signals</a>
        <a href="#advisory"      className="hover:text-white transition">Advisory</a>
        <a href="#forecast"      className="hover:text-white transition">Forecast</a>
        <a href="/testimonials"  className="hover:text-white transition">Testimonials</a>
        <a href="#how-it-works"  className="hover:text-white transition">How it works</a>
        <a href="#faq"           className="hover:text-white transition">FAQ</a>
      </nav>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <a href={LOGIN_URL}  className="btn-ghost text-xs sm:text-sm px-3 sm:px-4">Log in</a>
        <a href={SIGNUP_URL} className="btn-brand text-xs sm:text-sm px-3 sm:px-4">Sign up</a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-12 items-center">
        {/* Copy — leaner, more whitespace, fewer paragraphs. */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="eyebrow self-start mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-good anim-pulse-soft" />
            AI Financial Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="gradient-text">AI Financial Intelligence</span> for Business Owners
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl">
            Financial planning, forecasting, and AI-powered business insights
            in one real-time platform.
          </p>
          <div className="mt-10 flex items-center gap-3 flex-wrap">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              See the Platform
            </a>
            <a href="#signals" className="btn-ghost text-base px-6 py-3">
              Explore Insights →
            </a>
          </div>
          <div className="mt-8 text-xs text-slate-500 leading-relaxed max-w-xl">
            AI Financial Advisor · Financial Forecasting · Cash Flow Intelligence · Business Insights
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-good" />
            No credit card · 5-minute setup · Your data stays yours
          </div>
        </div>

        {/* Product visual */}
        <div className="lg:col-span-7 relative">
          <SignalDeckHero />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Positioning strip
// ─────────────────────────────────────────────────────────────────────

function PositioningStrip() {
  return (
    <section className="border-y border-line/60 bg-ink-900/30 backdrop-blur-sm">
      <div className="container-wide py-5">
        <div className="flex items-center justify-between gap-6 flex-wrap text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {POSITIONING.map((p) => (
            <div key={p} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-purple" />
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section template
// ─────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  body,
}: { eyebrow: string; title: React.ReactNode; body: string }) {
  return (
    <div className="max-w-2xl">
      <div className="eyebrow mb-4">{eyebrow}</div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
        {title}
      </h2>
      <p className="mt-4 text-lg text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Signals
// ─────────────────────────────────────────────────────────────────────

function SignalsSection() {
  return (
    <section id="signals" className="container-wide py-24 lg:py-32">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Business Insights"
            title={<>Business signals <span className="gradient-text">in real time</span>.</>}
            body="Tweaxly automatically detects vendor cost spikes, revenue changes, profitability shifts, and growth opportunities the moment they appear in your financial activity. Real-time business insights without complex spreadsheets or a dedicated finance team."
          />
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            <ValueCell tone="bad"     label="Cash risk detected" />
            <ValueCell tone="warn"    label="Vendor spike" />
            <ValueCell tone="purple"  label="Trend reversed" />
            <ValueCell tone="good"    label="Growth opportunity" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <SignalDeckFull />
        </div>
      </div>
    </section>
  );
}

function ValueCell({ tone, label }: { tone: "bad" | "warn" | "purple" | "good"; label: string }) {
  const dot =
    tone === "bad"    ? "bg-bad"          :
    tone === "warn"   ? "bg-warn"         :
    tone === "purple" ? "bg-brand-purple" :
                        "bg-good";
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-sm text-slate-200">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Consultation / Advisory
// ─────────────────────────────────────────────────────────────────────

function ConsultationSection() {
  return (
    <section id="advisory" className="relative py-24 lg:py-32">
      {/* Section accent — purple glow behind */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(167,139,250,0.12),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="container-wide relative grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-6 lg:order-2">
          <SectionHeader
            eyebrow="AI Financial Advisor"
            title={<>An AI financial advisor that understands your <span className="gradient-text">real numbers</span>.</>}
            body="Tweaxly continuously analyzes your financial activity, identifies trends, surfaces risks, and helps business owners make smarter decisions through AI-powered financial planning — without spreadsheets, dashboards no one opens, or a CFO retainer."
          />
          <ul className="mt-8 flex flex-col gap-2.5 max-w-md">
            {[
              "Why did profitability drop this month?",
              "What changed in payroll expenses?",
              "What happens if I hire 2 more engineers?",
              "Which expense category is growing fastest?",
            ].map((q) => (
              <li key={q} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-purple shrink-0" />
                &ldquo;{q}&rdquo;
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6 lg:order-1 flex justify-center lg:justify-end">
          <ConsultationMock />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Forecast
// ─────────────────────────────────────────────────────────────────────

function ForecastSection() {
  return (
    <section id="forecast" className="container-wide py-24 lg:py-32">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Financial Forecasting"
            title={<>Financial forecasting and <span className="gradient-text">cash flow intelligence</span>.</>}
            body="Project where the business is heading. Tweaxly combines historical actuals, recurring patterns, seasonality, and your own scenarios into explainable cash flow forecasting and revenue forecasting — built for growing SMBs, not enterprise accounting teams."
          />
          <ul className="mt-8 flex flex-col gap-3 max-w-md text-sm text-slate-300">
            <ListBullet icon="↗">Baseline vs scenario, side by side</ListBullet>
            <ListBullet icon="◇">Layer hires, raises, contracts, one-time costs</ListBullet>
            <ListBullet icon="∑">Dollar impact on revenue, margin, and cashflow</ListBullet>
          </ul>
        </div>
        <div className="lg:col-span-7">
          <ForecastChart />
        </div>
      </div>
    </section>
  );
}

function ListBullet({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-6 h-6 rounded-md border border-brand-purple/40 bg-brand-purple/10 text-brand-purple text-xs inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Executive Overview
// ─────────────────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <section id="overview" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(34,211,238,0.10),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="container-wide relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="eyebrow mb-4">Executive Overview</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Clarity in minutes, not <span className="gradient-text">spreadsheets</span>.
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            The first screen every morning — KPIs, deltas, and a single AI takeaway
            anchored to what just changed in your numbers.
          </p>
        </div>
        <ExecutiveOverviewMock />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const STEPS = [
    { n: "1", title: "Connect your data",  body: "Upload bank, card, or payment-processor statements. Or paste them in. Categorization rules learn your patterns." },
    { n: "2", title: "Watch the deck",     body: "Within minutes, Signals start populating with what changed, what's at risk, and where the opportunity is." },
    { n: "3", title: "Ask anything",       body: "Open Advisory and ask in plain English. The AI answers using your real categories, vendors, and trends." },
  ];
  return (
    <section id="how-it-works" className="container-wide py-24 lg:py-32">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="eyebrow mb-4">How it works</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
          From first upload to clarity in <span className="gradient-text">5 minutes</span>.
        </h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-line bg-ink-900/40 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-sm font-semibold">
                {s.n}
              </span>
              <div className="text-base font-semibold text-white">{s.title}</div>
            </div>
            <div className="text-sm text-slate-400 leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section id="faq" className="container-wide py-24 lg:py-32">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="eyebrow mb-4">FAQ</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
          Common questions.
        </h2>
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
  );
}

// ─────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="container-wide py-20">
      <div className="relative rounded-3xl border border-brand-purple/25 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.15),transparent_60%)]" aria-hidden="true" />
        <div className="relative p-10 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Stop wondering. <span className="gradient-text">Start understanding.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
            Open Tweaxly and see your business the way a finance team would.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              See the platform
            </a>
            <a href={LOGIN_URL} className="btn-ghost text-base px-6 py-3">
              Log in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// SEO summary section — sits after the four product sections and
// names the platform's positioning explicitly. Keyword cluster:
// financial intelligence platform / AI-powered financial planning /
// business forecasting platform / financial dashboard / SMB
// financial intelligence.
// ─────────────────────────────────────────────────────────────────────

function SeoUnifiedSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(167,139,250,0.10),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="container-wide relative text-center max-w-3xl mx-auto">
        <div className="eyebrow mb-4">One platform</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
          One financial intelligence platform
        </h2>
        <p className="mt-5 text-base text-slate-300 leading-relaxed">
          Unified dashboard, financial forecasting, business insights, AI
          advisory, and real-time financial monitoring — in a single
          financial intelligence platform built for SMB owners. Tweaxly
          replaces the gap between accounting software and a fractional CFO
          with an AI-powered financial planning system that actually talks
          to your numbers.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href="/login" className="btn-brand text-sm px-6 py-3">See the platform</a>
          <a href="#how-it-works" className="btn-ghost text-sm px-6 py-3">How it works →</a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    // Extra bottom padding on mobile (pb-24) leaves clear space below
    // the last footer line so the floating accessibility button — at
    // bottom-left — never overlaps Terms / Privacy / Preferences
    // links. Restores to py-10 at the sm breakpoint.
    <footer className="container-wide pt-10 pb-24 sm:pb-10 border-t border-line text-xs text-slate-500 flex items-center justify-between flex-wrap gap-3">
      {/* Left cluster: copyright + tagline grouped together. */}
      <div className="flex items-center gap-4 flex-wrap">
        <span>© {new Date().getFullYear()} TWEAXLY</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
          AI Financial Intelligence
        </span>
      </div>
      {/* Right cluster: legal nav. Privacy Policy and Privacy
          Preferences sit adjacent on purpose so the user can move
          from reading the policy to changing their consent in a
          single visual hop. */}
      <nav className="flex items-center gap-5">
        <a href="/terms"         className="hover:text-slate-200 transition">Terms of Service</a>
        <a href="/privacy"       className="hover:text-slate-200 transition">Privacy Policy</a>
        <PreferencesLink className="consent-footer-link hover:text-slate-200 transition">
          Privacy Preferences
        </PreferencesLink>
        <a href="/accessibility" className="hover:text-slate-200 transition">Accessibility Statement</a>
      </nav>
    </footer>
  );
}
