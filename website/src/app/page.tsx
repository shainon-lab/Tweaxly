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
    a: "Tweaxly is an AI-native business intelligence platform for small and medium business owners. It connects your financial activity, watches for changes, forecasts what's next, and gives you an AI advisor that understands your real numbers — so you can run your business with the clarity of a finance team without hiring one.",
  },
  {
    q: "Is this accounting software?",
    a: "No. Tweaxly isn't bookkeeping or ERP. It's the intelligence layer above the systems you already use — it reads your data, tells you what changed, what matters, and what to do next. Your accountant still does the books.",
  },
  {
    q: "What data does Tweaxly connect?",
    a: "Bank transactions, credit cards, payment processors (Stripe / PayPal), invoicing, payroll, and manual entries. Upload CSV/Excel from any source — categorization rules learn your patterns and apply on every future import automatically.",
  },
  {
    q: "How long does it take to see something useful?",
    a: "Most owners see their first signals within minutes of the first upload. Forecasts and signals get sharper as more data arrives, but the platform produces something on day one.",
  },
  {
    q: "Do I need to be technical or financially trained?",
    a: "No. Tweaxly is built for owners, not accountants. Every screen is designed around the questions you actually ask — am I profitable, what's changing, and what should I do about it?",
  },
  {
    q: "Can the AI advisor see my real numbers?",
    a: "Yes — that's the point. The advisor reads your actual categories, vendors, employees, and monthly snapshots, so its answers reference your real situation (\"Your Marketing & Ads spend in May was $1,100, down from $2,400 in April…\") instead of generic finance tips.",
  },
  {
    q: "Is my data secure?",
    a: "Your business data lives in your private workspace and is never used to train shared models. We process only the minimum data needed to generate the dashboards and answers you see.",
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
    <header className="container-wide pt-8 pb-4 flex items-center justify-between gap-3">
      <Logo size="md" showTagline />
      <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
        <a href="#signals"      className="hover:text-white transition">Signals</a>
        <a href="#advisory"     className="hover:text-white transition">Advisory</a>
        <a href="#forecast"     className="hover:text-white transition">Forecast</a>
        <a href="#how-it-works" className="hover:text-white transition">How it works</a>
        <a href="#faq"          className="hover:text-white transition">FAQ</a>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <a href={LOGIN_URL} className="btn-ghost text-sm">Log in</a>
        <a href={SIGNUP_URL} className="btn-brand text-sm">Sign up</a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        {/* Copy */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="eyebrow self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-good anim-pulse-soft" />
            AI Financial Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Your business already has <span className="gradient-text">signals</span>. Tweaxly helps you see them.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
            Tweaxly connects your financial activity, detects what&apos;s changing,
            forecasts where you&apos;re heading, and gives you an AI advisor that
            understands your real numbers — in real time.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              See the platform
            </a>
            <a href="#signals" className="btn-ghost text-base px-6 py-3">
              Explore insights →
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
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
            eyebrow="Signals"
            title={<>The platform <span className="gradient-text">proactively</span> surfaces what matters.</>}
            body="Tweaxly watches every line of your financial data and flags the changes worth your attention — vendor spikes, margin compression, cash risks, growth opportunities — before they become problems."
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
            eyebrow="Advisory"
            title={<>Ask your business <span className="gradient-text">anything</span>.</>}
            body="A built-in AI advisor that reads your real categories, vendors, and trends — and answers in plain English with reasoning you can verify."
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
            eyebrow="Forecast"
            title={<>See where you&apos;re <span className="gradient-text">heading</span> before deciding.</>}
            body="Baseline projection plus a scenario layer. Add hires, marketing changes, contracts, one-time expenses — every assumption flows through to projected profit and cashflow."
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

function SiteFooter() {
  return (
    <footer className="container-wide py-10 border-t border-line text-xs text-slate-500 flex items-center justify-between flex-wrap gap-3">
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
        <a href="/accessibility" className="hover:text-slate-200 transition">Accessibility</a>
      </nav>
    </footer>
  );
}
