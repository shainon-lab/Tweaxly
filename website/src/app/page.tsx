import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { SignalDeckFull, SignalDeckHero } from "@/components/mocks/SignalDeck";
import { ForecastChart } from "@/components/mocks/ForecastChart";
import { ConsultationMock } from "@/components/mocks/Consultation";
import { ExecutiveOverviewMock } from "@/components/mocks/ExecutiveOverview";

// Homepage metadata - uses the `absolute` title key so we set the
// full title verbatim (no " | Tweaxly" suffix appended by the
// root template; the brand already sits at the end of this title).
export const metadata: Metadata = {
  title: { absolute: "AI Financial Intelligence for Business Owners | Tweaxly" },
  description:
    "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
  keywords: [
    "AI financial intelligence",
    "AI financial advisor",
    "financial forecasting",
    "cash flow forecasting",
    "business insights",
    "financial dashboard",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI Financial Intelligence for Business Owners | Tweaxly",
    description:
      "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Financial Intelligence for Business Owners | Tweaxly",
    description:
      "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
  },
};

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


export default function Home() {
  return (
    <main id="main-content" className="flex-1 overflow-x-hidden">
      <SiteHeader active="home" />
      <Hero />
      <PositioningStrip />
      <SignalsSection />
      <ConsultationSection />
      <ForecastSection />
      <OverviewSection />
      <SeoUnifiedSection />
      <HowItWorks />
      <FinalCTA />
    </main>
  );
}

// Home uses the shared <SiteHeader /> component imported above; the
// inline header was extracted to keep nav consistent across every
// public page (about / pricing / faq / testimonials / contact).

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-12 items-center">
        {/* Copy - leaner, more whitespace, fewer paragraphs. */}
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
      {/* Section accent - purple glow behind */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(167,139,250,0.12),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="container-wide relative grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-6 lg:order-2">
          <SectionHeader
            eyebrow="AI Financial Advisor"
            title={<>An AI financial advisor that understands your <span className="gradient-text">real numbers</span>.</>}
            body="Tweaxly continuously analyzes your financial activity, identifies trends, surfaces risks, and helps business owners make smarter decisions through AI-powered financial planning - without spreadsheets, dashboards no one opens, or a CFO retainer."
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
            body="Project where the business is heading. Tweaxly combines historical actuals, recurring patterns, seasonality, and your own scenarios into explainable cash flow forecasting and revenue forecasting - built for growing SMBs, not enterprise accounting teams."
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
            The first screen every morning - KPIs, deltas, and a single AI takeaway
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

// FAQ has its own dedicated /faq page now; the source list lives in
// src/lib/faq.ts. The homepage's old inline FAQ section was removed
// to keep the marketing page focused and improve nav-driven crawls.

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
// SEO summary section - sits after the four product sections and
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
          advisory, and real-time financial monitoring - in a single
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

