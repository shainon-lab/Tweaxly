import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { featuredArticles } from "@/content/resources/relations";
import { articleHref } from "@/content/resources/types";
import BrandFlow from "@/components/BrandFlow";
import BrandPhilosophy from "@/components/BrandPhilosophy";
import { SignalDeckFull, SignalDeckHero } from "@/components/mocks/SignalDeck";
import { ForecastChart } from "@/components/mocks/ForecastChart";
import { ConsultationMock } from "@/components/mocks/Consultation";
import { ExecutiveOverviewMock } from "@/components/mocks/ExecutiveOverview";

// Homepage metadata - uses the `absolute` title key so we set the
// full title verbatim (no " | Tweaxly" suffix appended by the
// root template; the brand already sits at the end of this title).
export const metadata: Metadata = {
  title: { absolute: "AI That Understands Your Business | Tweaxly" },
  description:
    "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
  keywords: [
    "AI business intelligence",
    "AI for business owners",
    "business data insights",
    "real-time business insights",
    "AI business decisions",
    "financial forecasting",
    "cash flow forecasting",
    "business signals",
    "AI financial advisor",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI That Understands Your Business | Tweaxly",
    description:
      "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI That Understands Your Business | Tweaxly",
    description:
      "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
  },
};

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;

// Four items so the strip sits on a single clean row at every
// width - five was orphaning the last pill onto its own line.
// \"Signals you can act on\" overlapped thematically with \"Trends
// detected in real time\", so that was the safe one to drop.
const POSITIONING = [
  "Built for modern SMB owners",
  "AI-native financial intelligence",
  "Trends detected in real time",
  "Forecast business impact",
];


export default function Home() {
  return (
    <main id="main-content" className="flex-1 overflow-x-hidden">
      <SiteHeader active="home" />
      <Hero />
      <PositioningStrip />
      <PlainEnglishExplainer />
      <BrandFlow />
      <SignalsSection />
      <ConsultationSection />
      <ForecastSection />
      <OverviewSection />
      <FinancialReviewSection />
      <SeoUnifiedSection />
      <HowItWorks />
      <ConnectYourDataBanner />
      <LearningCenterSection />
      <BrandPhilosophy />
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
          {/* Methodology hint above the H1. The slogan ('Your AI
              Business Pulse') already lives under the logo in the
              header, so we don't repeat it here - the six-step
              framework gets the slot instead. Inline + flex-wrap
              so it stays on one line on lg+ and breaks cleanly on
              narrow viewports. */}
          <div
            aria-label="The Tweaxly methodology"
            className="self-start mb-8 flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-medium text-slate-600"
          >
            <span className="text-brand-purple">Track</span>
            <span className="text-slate-600" aria-hidden="true">→</span>
            <span>Evaluate</span>
            <span className="text-slate-600" aria-hidden="true">→</span>
            <span>Analyze</span>
            <span className="text-slate-600" aria-hidden="true">→</span>
            <span>e<span className="gradient-text">X</span>ecute</span>
            <span className="text-slate-600" aria-hidden="true">→</span>
            <span>Lead</span>
            <span className="text-slate-600" aria-hidden="true">→</span>
            <span className="text-brand-teal">Yield</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="gradient-text">AI That Understands</span> Your Business
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl">
            Turn your business data into real-time insights, forecasts, signals,
            and AI-powered decisions.
          </p>
          {/* Single primary CTA - the secondary \"Connect Your Business\"
              button was creating decision paralysis at the top of the
              page (users still evaluating the product, not ready to
              connect data yet). The connect-your-data narrative now
              lives in <ConnectYourDataBanner /> further down the page,
              after the user has seen what the product actually does. */}
          <div className="mt-10">
            <a href={SIGNUP_URL} className="btn-brand text-base px-7 py-3.5 inline-flex items-center gap-2">
              Start Free — No Credit Card Required
            </a>
          </div>
          <div className="mt-8 text-xs text-slate-500 leading-relaxed max-w-xl">
            Real-Time Business Insights · AI Forecasting · Business Signals · AI Business Intelligence
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
        <div className="flex items-center justify-between gap-6 flex-wrap text-[11px] uppercase tracking-[0.18em] text-slate-600">
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
// Plain-English explainer
// ─────────────────────────────────────────────────────────────────────
// Sits just after the hero/positioning strip and before the demo
// sections. Four short blocks (What / Who / Problems / Why different)
// written as AI-citable snippets so Google AI Overviews, ChatGPT,
// Perplexity and Gemini can extract a clean summary of Tweaxly
// without having to scrape the marketing visuals further down.

function PlainEnglishExplainer() {
  const blocks: { eyebrow: string; h3: string; body: string }[] = [
    {
      eyebrow: "What Tweaxly does",
      h3:      "Turns financial data into decisions.",
      body:    "Tweaxly is an AI business intelligence platform that ingests your real financial activity (revenue, expenses, vendors, cash) and produces business signals, forecasts, scenario plans and an AI advisor you can ask questions of. It explains what's happening, projects what's next, and recommends what to do - in plain English, in real time.",
    },
    {
      eyebrow: "Who it's for",
      h3:      "Small and medium business owners.",
      body:    "Built for owner-operators, founders, fractional CFOs and operations leads at SMBs - typically $250K to $25M in annual revenue. If you're running the business and don't want to hire a finance team to understand the numbers, Tweaxly is the layer between your data and your decisions.",
    },
    {
      eyebrow: "Problems it solves",
      h3:      "The questions owners actually ask.",
      body:    "Tweaxly answers \"am I profitable?\", \"what just changed?\", \"is cash going to be a problem?\", \"which vendors got more expensive?\", \"what happens if I hire two engineers?\" - without spreadsheet maintenance, without a BI team, and without waiting for the monthly accounting close.",
    },
    {
      eyebrow: "Why it's different",
      h3:      "Intelligence layer, not accounting software.",
      body:    "Accounting software records what happened. Static dashboards display what happened. Tweaxly is the AI intelligence layer above both - it surfaces anomalies, forecasts the future, runs scenarios, and grounds an AI advisor in your real transactions. Most owners keep their accounting tool and use Tweaxly for the live view.",
    },
  ];

  return (
    <section
      id="what-is-tweaxly"
      className="container-wide py-20 lg:py-28"
      aria-labelledby="explainer-h2"
    >
      <div className="max-w-3xl mb-10 lg:mb-12">
        <div className="eyebrow mb-4">What is Tweaxly</div>
        <h2
          id="explainer-h2"
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]"
        >
          AI business intelligence for SMB owners,{" "}
          <span className="gradient-text">in plain English</span>.
        </h2>
        <p className="mt-5 text-lg text-slate-600 leading-relaxed">
          The short version of what Tweaxly does, who it&apos;s for, and what
          makes it different from the accounting software and dashboards you
          may already use.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
        {blocks.map((b) => (
          <article key={b.h3} className="card">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
              {b.eyebrow}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[color:var(--color-ink-strong)] leading-snug">
              {b.h3}
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              {b.body}
            </p>
          </article>
        ))}
      </div>

      {/* Internal-linking strip - builds the topical-authority graph */}
      <div className="mt-8 text-sm text-slate-600 flex items-center gap-x-5 gap-y-2 flex-wrap">
        <Link href="/features" className="text-brand-purple hover:text-brand-teal transition">
          See all features →
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/compare/accounting-software" className="text-brand-purple hover:text-brand-teal transition">
          Tweaxly vs accounting software
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/compare/dashboards" className="text-brand-purple hover:text-brand-teal transition">
          Tweaxly vs dashboards
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/faq" className="text-brand-purple hover:text-brand-teal transition">
          Read the FAQ →
        </Link>
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
      <p className="mt-4 text-lg text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Signals
// ─────────────────────────────────────────────────────────────────────

function SignalsSection() {
  return (
    <section id="signals" className="container-wide relative overflow-hidden py-24 lg:py-32">
      <span aria-hidden="true" className="brand-backdrop-word">Evaluate</span>
      <div className="relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
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
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-sm text-slate-800">
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
    <section id="advisory" className="relative overflow-hidden py-24 lg:py-32">
      {/* Section accent - purple glow behind */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(167,139,250,0.12),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <span aria-hidden="true" className="brand-backdrop-word">Lead</span>
      <div className="container-wide relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
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
              <li key={q} className="flex items-start gap-3 text-sm text-slate-700">
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
    <section id="forecast" className="container-wide relative overflow-hidden py-24 lg:py-32">
      <span aria-hidden="true" className="brand-backdrop-word">Analyze</span>
      <div className="relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Financial Forecasting"
            title={<>Financial forecasting and <span className="gradient-text">cash flow intelligence</span>.</>}
            body="Project where the business is heading. Tweaxly combines historical actuals, recurring patterns, seasonality, and your own scenarios into explainable cash flow forecasting and revenue forecasting - built for growing SMBs, not enterprise accounting teams."
          />
          <ul className="mt-8 flex flex-col gap-3 max-w-md text-sm text-slate-700">
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
    <section id="overview" className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(34,211,238,0.10),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <span aria-hidden="true" className="brand-backdrop-word">Track</span>
      <div className="container-wide relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="eyebrow mb-4">Executive Overview</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Clarity in minutes, not <span className="gradient-text">spreadsheets</span>.
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
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
// Financial Review
// ─────────────────────────────────────────────────────────────────────

function FinancialReviewSection() {
  return (
    <section id="financial-review" className="container-wide relative overflow-hidden py-24 lg:py-32">
      <span aria-hidden="true" className="brand-backdrop-word">Evaluate</span>
      <div className="relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Financial Review"
            title={<>Understand the report your <span className="gradient-text">accountant</span> sends you.</>}
            body="Upload a balance sheet, profit & loss or cash flow statement and get a plain-English review of your business - a health score, an AI second opinion, the questions to ask your CPA, and a 12-month outlook. Upload more than one year and watch how the business has evolved."
          />
          <ul className="mt-8 flex flex-col gap-3 max-w-md text-sm text-slate-700">
            <ListBullet icon="◷">From upload to review in 30-90 seconds</ListBullet>
            <ListBullet icon="✓">Health score, second opinion, CPA questions, action plan</ListBullet>
            <ListBullet icon="↗">Multi-year Business Evolution: trends, DNA profile, forecast</ListBullet>
          </ul>
          <div className="mt-8">
            <Link href="/features/financial-review" className="btn-ghost text-sm">
              Explore Financial Review →
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <FinancialReviewMock />
        </div>
      </div>
    </section>
  );
}

function FinancialReviewMock() {
  const SECTIONS = ["Executive summary", "AI second opinion", "Questions for your CPA", "Action plan"];
  return (
    <div className="card relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Audited annual statements</div>
          <div className="mt-1 text-sm text-slate-700">FY 2024 · reviewed in 48s</div>
        </div>
        <div className="rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-center shrink-0">
          <div className="text-3xl font-bold leading-none text-good">
            82<span className="text-base font-semibold text-slate-600"> /100</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-good">Healthy</div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Profitable in its first full year (net margin 3.6%). Most of the assets -
        71,232 of 132,184 - sit in short-term securities, while only 1,552 is left
        in cash.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {SECTIONS.map((s) => (
          <div key={s} className="rounded-lg border border-line bg-ink-950/40 px-3 py-2 text-xs text-slate-700">
            {s}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-slate-700">
        <span className="font-semibold text-warn shrink-0">Discuss with CPA:</span>
        <span>Payroll rose 32% while revenue rose 8% - one-off hiring or structural?</span>
      </div>
    </div>
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
              <div className="text-base font-semibold text-[color:var(--color-ink-strong)]">{s.title}</div>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed">{s.body}</div>
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
// Connect-your-data banner
// ─────────────────────────────────────────────────────────────────────
// Full-bleed conversion section that sits AFTER the user has scrolled
// through demos + HowItWorks. The hero CTA is intentionally minimal
// ("Start Free"); this one earns the "connect your data" framing by
// landing only after the value prop has been demonstrated.
//
// Visual: dark navy gradient with two soft radial blobs (purple +
// teal), six floating data-source chip cards on the left that
// shimmer subtly, and a clear headline + supporting paragraph + one
// big CTA on the right. Mobile collapses to a stack with the chips
// above the copy.

function ConnectYourDataBanner() {
  const SOURCES: { name: string; tag: string }[] = [
    { name: "Bank accounts", tag: "Checking · Savings" },
    { name: "Credit & debit cards", tag: "Visa · Mastercard · Amex" },
    { name: "PayPal",              tag: "Business" },
    { name: "Stripe",              tag: "Payouts · Fees" },
    { name: "Invoices",            tag: "Manual or CSV" },
    { name: "Bookkeeping exports", tag: "QuickBooks · Xero" },
  ];

  return (
    <section
      aria-labelledby="connect-data-heading"
      className="relative overflow-hidden mt-8 mb-16"
    >
      {/* Full-bleed dark backdrop. The site body sits on a near-black
          base; this stretches to viewport edges via negative margins
          so the section reads as a distinct band, not just another
          card. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            backgroundColor: "#efedfb",
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 20% 30%, rgba(124,92,250,0.12), transparent 65%)," +
              "radial-gradient(ellipse 60% 50% at 85% 80%, rgba(8,145,178,0.10), transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 grid-bg opacity-40"
        />

        <div className="container-wide py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Floating data-source chips */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
                  {SOURCES.map((s, i) => (
                    <div
                      key={s.name}
                      className="rounded-xl border border-line/60 bg-ink-900/70 backdrop-blur px-3 py-3 shadow-lg hover:border-brand-purple/40 hover:bg-ink-900/85 transition will-change-transform"
                      style={{
                        transform: `translateY(${(i % 2 === 0 ? -4 : 4)}px)`,
                        animation: `float ${5 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[color:var(--color-ink-strong)] leading-tight truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {s.tag}
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-good/15 text-good"
                        >
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8.5l3 3 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* "→ Tweaxly" badge under the chips on lg+ to suggest
                    the data flows into the platform. */}
                <div className="mt-6 hidden lg:flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span className="w-6 h-px bg-gradient-to-r from-transparent to-brand-purple" />
                  <span>Flows into Tweaxly</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple anim-pulse-soft" />
                </div>
              </div>
            </div>

            {/* Headline + copy + CTA */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="eyebrow mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                Connect your data
              </div>
              <h2
                id="connect-data-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-[color:var(--color-ink-strong)]"
              >
                Your business data.{" "}
                <span className="gradient-text">Finally understandable.</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl">
                Connect your bank accounts, cards, PayPal, invoices, and
                business data in minutes — and let Tweaxly turn them into
                real-time business signals, forecasts, and AI-powered
                recommendations.
              </p>

              <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700 max-w-xl">
                {[
                  "5-minute setup",
                  "No credit card required",
                  "Multi-currency by default",
                  "Your data stays yours",
                ].map((l) => (
                  <li key={l} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-good/15 text-good shrink-0"
                    >
                      <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3 3 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {l}
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <a
                  href={SIGNUP_URL}
                  className="btn-brand text-base px-7 py-3.5 inline-flex items-center gap-2 group"
                >
                  Create Free Account
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  >→</span>
                </a>
                <div className="mt-3 text-xs text-slate-500">
                  Free forever for one business · upgrade only when you need more.
                </div>
              </div>
            </div>
          </div>
        </div>
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
            Get your first <span className="gradient-text">AI business signals</span> today.
          </h2>
          <p className="mt-4 text-lg text-slate-700 max-w-xl mx-auto">
            Upload a CSV, see your business the way a finance team would.
            Free forever - upgrade only when you&apos;re ready.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              Start Free
            </a>
            <a href="/pricing" className="btn-ghost text-base px-6 py-3">
              See pricing →
            </a>
          </div>
          <div className="mt-5 text-xs text-slate-500">
            No credit card · 5-minute setup · 30 AI Credits included
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

// ─────────────────────────────────────────────────────────────────────
// Learning Center surfaced on the marketing homepage. Passes
// homepage authority into the Resources cluster (Layer 10 of the
// internal linking architecture) and gives top-of-funnel visitors
// an educational entry point before the final CTA.
// ─────────────────────────────────────────────────────────────────────

function LearningCenterSection() {
  // Three editorial picks across the highest-traffic categories.
  // Plain links so the section ships as static HTML with no
  // additional bundle weight.
  const FEATURED_CATEGORIES = [
    { slug: "financial-fundamentals",  label: "Financial Fundamentals",  blurb: "Revenue, profit, margin, cash - in plain English." },
    { slug: "cash-flow-management",    label: "Cash Flow Management",    blurb: "Forecast, protect, and improve the cash that keeps you in business." },
    { slug: "business-metrics-kpis",   label: "Business Metrics & KPIs", blurb: "CAC, LTV, MRR, ARR - what to track and how to read it." },
  ];

  // Popular articles - computed via featuredArticles() so the rail
  // auto-evolves as new pieces ship. Editorial featured: true entries
  // surface first; the helper backfills with most-recent so the rail
  // never looks empty. Limit to 4 to balance with the 3 category cards.
  const POPULAR_ARTICLES = featuredArticles(4).map((a) => a.meta);

  // Highest-search-volume glossary terms. Curated to match the
  // popularGlossaryTerms() list in src/content/resources/relations.ts.
  const POPULAR_TERMS = [
    { slug: "ebitda",      label: "EBITDA"      },
    { slug: "arr",         label: "ARR"         },
    { slug: "mrr",         label: "MRR"         },
    { slug: "cac",         label: "CAC"         },
    { slug: "ltv",         label: "LTV"         },
    { slug: "cash-flow",   label: "Cash Flow"   },
    { slug: "burn-rate",   label: "Burn Rate"   },
    { slug: "runway",      label: "Runway"      },
    { slug: "revenue",     label: "Revenue"     },
    { slug: "gross-margin", label: "Gross Margin" },
  ];

  return (
    <section className="container-wide py-24 lg:py-32 max-w-6xl">
      <div className="max-w-3xl">
        <div className="eyebrow mb-4">Learning Center</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
          Learn the language of your business.
        </h2>
        <p className="mt-5 text-base text-slate-700 leading-relaxed">
          The vocabulary, metrics and frameworks every small business
          owner should know - written without finance jargon. Over 50
          articles and 50 glossary terms, organised by topic.
        </p>
      </div>

      {/* Featured category cards */}
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURED_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/resources/${c.slug}`}
            className="block group card hover:border-brand-purple/40 transition"
          >
            <div className="text-base sm:text-lg font-semibold text-[color:var(--color-ink-strong)] leading-snug">
              {c.label}
            </div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              {c.blurb}
            </div>
            <div className="mt-4 text-[11px] uppercase tracking-wider text-brand-purple">
              Explore →
            </div>
          </Link>
        ))}
      </div>

      {/* Popular articles - editorial-featured first, most-recent
          as backfill. Computed via featuredArticles() so the rail
          auto-evolves as articles are published / re-featured. */}
      {POPULAR_ARTICLES.length > 0 ? (
        <div className="mt-10">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">
            Popular articles
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {POPULAR_ARTICLES.map((m) => (
              <Link
                key={m.slug}
                href={articleHref(m)}
                className="block group card hover:border-brand-purple/40 transition"
              >
                <div className="text-sm font-semibold text-[color:var(--color-ink-strong)] leading-snug">
                  {m.title}
                </div>
                <div className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {m.excerpt}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-wider text-brand-purple">
                  Read →
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Popular business terms - direct entry into the glossary */}
      <div className="mt-10">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">
          Popular business terms
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TERMS.map((t) => (
            <Link
              key={t.slug}
              href={`/resources/business-glossary/${t.slug}`}
              className="inline-flex items-center rounded-full border border-line bg-ink-900/60 px-4 py-2 text-sm text-slate-800 hover:border-brand-purple/60 hover:text-[color:var(--color-ink-strong)] transition"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse-all hand-off */}
      <div className="mt-10 flex items-center gap-3 flex-wrap">
        <Link href="/resources" className="btn-brand text-sm px-5 py-2.5">
          Browse all 10 categories
        </Link>
        <Link href="/resources/business-glossary" className="btn-ghost text-sm px-5 py-2.5">
          Open the Business Glossary →
        </Link>
      </div>
    </section>
  );
}

function SeoUnifiedSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(167,139,250,0.10),transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="container-wide relative text-center max-w-3xl mx-auto">
        <div className="eyebrow mb-4">One platform</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
          One financial intelligence platform
        </h2>
        <p className="mt-5 text-base text-slate-700 leading-relaxed">
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

