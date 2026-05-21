// /pricing - public pricing surface for the Tweaxly freemium model.
// Three tiers (Free / Pro / Business) with a clearly-separated AI
// Credits axis, a full feature-comparison matrix, an AI Credits
// explainer, dedicated FAQs, and Product + FAQPage + BreadcrumbList
// JSON-LD. Built to read as a single document for both buyers and
// AI engines that summarise pricing pages in chat.

import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const SITE_URL    = "https://tweaxly.com";

const DESCRIPTION =
  "Tweaxly pricing for AI business intelligence. Start free with 30 AI Credits and 90 days of history. Upgrade to Pro ($49/mo) for unlimited history, full forecasting and scenario planning, or Business ($149/mo) for teams, API access and priority AI processing.";
const OG_DESCRIPTION =
  "Three plans. Start free with AI Credits included. Upgrade to Pro for forecasting + scenario planning or Business for teams and API access.";

export const metadata: Metadata = {
  title: { absolute: "Tweaxly Pricing | AI Business Intelligence for SMBs" },
  description: DESCRIPTION,
  keywords: [
    "Tweaxly pricing",
    "AI business intelligence pricing",
    "SMB financial software pricing",
    "AI Credits",
    "AI financial forecasting cost",
    "small business BI subscription",
    "Tweaxly Pro plan",
    "Tweaxly Business plan",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tweaxly Pricing | AI Business Intelligence for SMBs",
    description: OG_DESCRIPTION,
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweaxly Pricing | AI Business Intelligence for SMBs",
    description: OG_DESCRIPTION,
  },
};

// ─────────────────────────────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────────────────────────────

type PlanKey = "free" | "pro" | "business";

interface Plan {
  key:        PlanKey;
  name:       string;
  price:      string;
  period:     string;
  tagline:    string;
  bullets:    string[];     // headline differentiators
  credits:    string;       // monthly AI Credits, plain text
  ctaLabel:   string;
  ctaHref:    string;
  ctaSub:     string;       // small line under the CTA
  highlight?: boolean;      // visually emphasise the Pro tier
}

const PLANS: Plan[] = [
  {
    key:      "free",
    name:     "Free",
    price:    "$0",
    period:   "forever",
    tagline:  "Get your business intelligence layer up and running in 5 minutes.",
    credits:  "30 AI Credits / month",
    bullets: [
      "1 business, 1 user",
      "1 data source (CSV, bank or card)",
      "90 days of visible history",
      "Up to 3 business signals per month",
      "Forecast up to 3 months ahead",
      "On-screen reports (no export)",
    ],
    ctaLabel: "Start Free",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "No credit card required",
  },
  {
    key:       "pro",
    name:      "Pro",
    price:     "$49",
    period:    "per month",
    tagline:   "Unlimited history, full forecasting and the AI advisor at full power.",
    credits:   "500 AI Credits / month",
    highlight: true,
    bullets: [
      "Multiple businesses, multiple users",
      "Unlimited connected data sources",
      "Unlimited historical data",
      "Unlimited business signals + smart alerts",
      "Full forecasting + Scenario Builder",
      "Export reports to Excel, CSV, PDF",
      "Multi-currency intelligence",
    ],
    ctaLabel: "Start Pro Free",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "Start free, upgrade when ready",
  },
  {
    key:      "business",
    name:     "Business",
    price:    "$149",
    period:   "per month",
    tagline:  "Teams, priority AI processing, API access and enterprise forecasting.",
    credits:  "2,000 AI Credits / month",
    bullets: [
      "Everything in Pro",
      "Team collaboration + role-based access",
      "Priority AI processing",
      "API access + webhooks",
      "Advanced integrations",
      "White-label reports",
      "Audit logs + dedicated onboarding",
    ],
    ctaLabel: "Start Business Free",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "Talk to us about annual or team plans",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Feature matrix
// ─────────────────────────────────────────────────────────────────────

interface MatrixRow {
  dimension: string;
  free:      string;
  pro:       string;
  business:  string;
}
interface MatrixGroup { label: string; rows: MatrixRow[] }

const MATRIX: MatrixGroup[] = [
  {
    label: "Workspace",
    rows: [
      { dimension: "Businesses",     free: "1",              pro: "Multiple",   business: "Multiple" },
      { dimension: "Team members",   free: "1",              pro: "Multiple",   business: "Team + roles" },
      { dimension: "Data sources",   free: "1",              pro: "Unlimited",  business: "Unlimited + integrations" },
      { dimension: "Historical data", free: "90 days",       pro: "Unlimited",  business: "Unlimited" },
    ],
  },
  {
    label: "AI & intelligence",
    rows: [
      { dimension: "Included AI Credits / month", free: "30",        pro: "500",         business: "2,000" },
      { dimension: "Business signals / month",    free: "Up to 3",   pro: "Unlimited",   business: "Unlimited" },
      { dimension: "Smart alerts",                free: "—",         pro: "✓",           business: "✓" },
      { dimension: "AI consultation",             free: "Basic",     pro: "Full",        business: "Priority processing" },
      { dimension: "Action-oriented recommendations", free: "—",     pro: "✓",           business: "✓" },
    ],
  },
  {
    label: "Forecasting",
    rows: [
      { dimension: "Forecast horizon",     free: "3 months",     pro: "Full",   business: "Enterprise" },
      { dimension: "Scenario Builder",     free: "—",            pro: "✓",      business: "✓" },
      { dimension: "Multi-scenario compare", free: "—",          pro: "✓",      business: "✓" },
    ],
  },
  {
    label: "Reports",
    rows: [
      { dimension: "On-screen reports",   free: "✓",            pro: "✓",            business: "✓" },
      { dimension: "Excel / CSV export",  free: "—",            pro: "✓",            business: "✓" },
      { dimension: "PDF export",          free: "—",            pro: "✓",            business: "✓" },
      { dimension: "White-label reports", free: "—",            pro: "—",            business: "✓" },
      { dimension: "Audit logs",          free: "—",            pro: "—",            business: "✓" },
    ],
  },
  {
    label: "Integrations & access",
    rows: [
      { dimension: "Basic integrations",   free: "✓",  pro: "✓",  business: "✓" },
      { dimension: "Advanced integrations", free: "—", pro: "—",  business: "✓" },
      { dimension: "API access",           free: "—",  pro: "—",  business: "✓" },
      { dimension: "Webhooks",             free: "—",  pro: "—",  business: "✓" },
      { dimension: "Dedicated onboarding", free: "—",  pro: "—",  business: "✓" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// AI Credits explainer
// ─────────────────────────────────────────────────────────────────────

const CREDIT_COSTS: { action: string; cost: string }[] = [
  { action: "Ask the AI advisor a question",       cost: "1 credit"   },
  { action: "Deep business analysis on a signal",  cost: "3 credits"  },
  { action: "Generate a fresh forecast",           cost: "5 credits"  },
  { action: "Scenario builder run",                cost: "5 credits"  },
];

const CREDIT_PACKS: { pack: string; price: string }[] = [
  { pack: "+100 AI Credits", price: "$19" },
  { pack: "+500 AI Credits", price: "$79" },
];

// ─────────────────────────────────────────────────────────────────────
// FAQs (pricing-specific)
// ─────────────────────────────────────────────────────────────────────

const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: "Is the Free plan really free?",
    a: "Yes. The Free plan is free forever - no credit card required to sign up. You get one business, one user, 30 AI Credits per month, 90 days of visible history, and the core signals, forecasts and AI advisor at the levels listed above. Upgrade only when you need more.",
  },
  {
    q: "What is an AI Credit?",
    a: "AI Credits are how Tweaxly meters AI-powered work. A simple question to the advisor costs 1 credit. A deep analysis on a signal costs 3 credits. Generating a fresh forecast or running a scenario costs 5 credits. Every plan includes a monthly allowance, and you can buy more anytime.",
  },
  {
    q: "What happens when I run out of AI Credits?",
    a: "Your business data, dashboards, signals and forecasts remain fully available. AI-powered features (the advisor, deep analysis, fresh forecast runs) are paused until credits renew at the start of your next month - or until you buy a credit pack, which is added instantly.",
  },
  {
    q: "Do AI Credits roll over month to month?",
    a: "Not by default. Plan credits reset at the start of each billing cycle. Credits you buy as add-on packs are separate - they expire 12 months after purchase, not at the end of the month.",
  },
  {
    q: "Can I buy more AI Credits without upgrading my plan?",
    a: "Yes. Credit packs (+100 for $19, +500 for $79) are available on every plan and add immediately. They're useful for occasional heavy-analysis months - you don't have to commit to a higher tier if you only need it for a quarter.",
  },
  {
    q: "What happens if I downgrade or cancel?",
    a: "Your data is never deleted. You move to read-only mode: dashboards, past reports and historical signals stay visible. New AI consultation, forecast updates, uploads and advanced reports pause until you reactivate. Re-subscribe and everything resumes where it left off.",
  },
  {
    q: "Is there an annual plan?",
    a: "Annual billing is coming - typically saves around 20% on the monthly rate. If you'd like to start on annual today, email info@tweaxly.com and we'll set it up manually.",
  },
  {
    q: "Can I try Pro or Business before paying?",
    a: "Yes - sign up for Free, then start a Pro or Business plan free during early access (no credit card required at signup). When public pricing goes live, early-access users will have the option to lock in early-access terms.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Structured data
// ─────────────────────────────────────────────────────────────────────

function PricingStructuredData() {
  // One Product schema per paid plan + the Free plan as a separate
  // Product. priceCurrency USD, monthly billing.
  const products = PLANS.map((p) => ({
    "@context": "https://schema.org",
    "@type":    "Product",
    name:       `Tweaxly ${p.name}`,
    description: `${p.tagline} ${p.credits}.`,
    brand:      { "@type": "Brand", name: "Tweaxly" },
    offers: {
      "@type":         "Offer",
      price:           p.price.replace("$", ""),
      priceCurrency:   "USD",
      availability:    "https://schema.org/PreOrder",
      url:             `${SITE_URL}/pricing`,
      priceValidUntil: "2027-12-31",
      ...(p.key === "free"
        ? {}
        : {
            priceSpecification: {
              "@type":           "UnitPriceSpecification",
              price:             p.price.replace("$", ""),
              priceCurrency:     "USD",
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
            },
          }),
    },
  }));

  const faqPage = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: PRICING_FAQS.map((f) => ({
      "@type": "Question",
      name:    f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",    item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
    ],
  };

  return (
    <>
      {products.map((p, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }}
        />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main id="main-content" className="flex-1">
      <PricingStructuredData />
      <SiteHeader active="pricing" />

      <nav aria-label="Breadcrumb" className="container-wide pt-8 pb-2">
        <ol className="flex items-center gap-2 text-xs text-slate-500">
          <li><Link href="/" className="hover:text-slate-200 transition">Home</Link></li>
          <li className="text-slate-600">›</li>
          <li className="text-slate-300">Pricing</li>
        </ol>
      </nav>

      <Hero />
      <PlanCards />
      <FeatureMatrix />
      <AICreditsExplainer />
      <PricingFaq />
      <ComparisonLinks />
      <FinalCta />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-6 pb-12 lg:pt-8 lg:pb-16 max-w-4xl">
      <div className="eyebrow mb-4">Pricing</div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
        Start free.{" "}
        <span className="gradient-text">Upgrade when ready.</span>
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
        Three plans. AI Credits included on every tier. No credit card to
        start - you only pay when you need more history, more team members,
        more forecasts or more AI processing.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-good" />
        No credit card · 5-minute setup · Your data stays yours
      </div>
    </section>
  );
}

function PlanCards() {
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
        {PLANS.map((p) => (
          <PlanCard key={p.key} plan={p} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={[
        "card flex flex-col h-full",
        plan.highlight ? "border-brand-purple/50 ring-1 ring-brand-purple/30" : "",
      ].join(" ")}
    >
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
          {plan.highlight ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-purple font-semibold">
              Most popular
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-slate-400">{plan.period}</span>
        </div>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">{plan.tagline}</p>
      </header>

      <div className="rounded-lg border border-line/60 bg-ink-900/40 px-3 py-2 mb-5 text-sm">
        <span className="text-brand-purple font-semibold">{plan.credits}</span>
      </div>

      <ul className="space-y-2 text-sm text-slate-300 leading-relaxed mb-6 flex-1">
        {plan.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <CheckGlyph />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <a
          href={plan.ctaHref}
          className={
            plan.highlight
              ? "btn-brand w-full text-base px-5 py-3 text-center block"
              : "btn-ghost w-full text-base px-5 py-3 text-center block"
          }
        >
          {plan.ctaLabel}
        </a>
        <div className="mt-2 text-[11px] text-slate-500 text-center">
          {plan.ctaSub}
        </div>
      </div>
    </article>
  );
}

function CheckGlyph() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-good shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

function FeatureMatrix() {
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="max-w-3xl mb-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          Full comparison
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Everything that&apos;s included, by plan.
        </h2>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-900/80 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-1/3">Capability</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line">Free</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line text-brand-purple">Pro</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line">Business</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-ink-950/40">
                  <th
                    scope="rowgroup"
                    colSpan={4}
                    className="px-5 pt-5 pb-2 text-left text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold"
                  >
                    {group.label}
                  </th>
                </tr>
                {group.rows.map((row, i) => (
                  <tr key={`${group.label}-${row.dimension}`} className={i % 2 === 0 ? "bg-ink-950/30" : ""}>
                    <td className="px-5 py-3 align-top text-slate-200 font-medium border-b border-line/40">
                      {row.dimension}
                    </td>
                    <td className="px-5 py-3 align-top text-slate-300 border-b border-line/40">
                      {row.free === "✓" ? <CheckGlyph /> : row.free === "—" ? <span className="text-slate-600">—</span> : row.free}
                    </td>
                    <td className="px-5 py-3 align-top text-slate-100 border-b border-line/40">
                      {row.pro === "✓" ? <CheckGlyph /> : row.pro === "—" ? <span className="text-slate-600">—</span> : row.pro}
                    </td>
                    <td className="px-5 py-3 align-top text-slate-300 border-b border-line/40">
                      {row.business === "✓" ? <CheckGlyph /> : row.business === "—" ? <span className="text-slate-600">—</span> : row.business}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AICreditsExplainer() {
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 max-w-6xl">
        <div className="lg:col-span-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
            AI Credits, explained
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            One simple meter for AI work.
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            AI Credits are how Tweaxly meters AI-powered work like consultation,
            deep analysis and fresh forecast runs. Every plan includes a
            monthly allowance, and you can buy more anytime - they&apos;re
            added instantly and expire 12 months after purchase.
          </p>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Plan credits reset at the start of each billing cycle. Add-on
            credit packs do not.
          </p>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 lg:gap-5">
          <div className="card">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
              What it costs
            </div>
            <ul className="space-y-2.5 text-sm">
              {CREDIT_COSTS.map((c) => (
                <li key={c.action} className="flex items-center justify-between gap-4 border-b border-line/30 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-slate-300">{c.action}</span>
                  <span className="text-white font-semibold whitespace-nowrap">{c.cost}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
              Add-on credit packs
            </div>
            <ul className="space-y-2.5 text-sm">
              {CREDIT_PACKS.map((p) => (
                <li key={p.pack} className="flex items-center justify-between gap-4 border-b border-line/30 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-slate-300">{p.pack}</span>
                  <span className="text-white font-semibold">{p.price}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-slate-500 leading-relaxed">
              Available on every plan. Added instantly. Expire 12 months
              after purchase.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingFaq() {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Pricing FAQ
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-6">
        Questions before you start.
      </h2>
      <div className="space-y-3">
        {PRICING_FAQS.map((f) => (
          <details key={f.q} className="card group">
            <summary className="cursor-pointer list-none flex items-start gap-3">
              <span className="text-brand-purple group-open:rotate-90 transition-transform mt-1">›</span>
              <span className="text-base font-semibold text-white leading-snug flex-1">{f.q}</span>
            </summary>
            <div className="mt-3 ml-7 text-sm text-slate-300 leading-relaxed">{f.a}</div>
          </details>
        ))}
      </div>
      <div className="mt-6 text-sm text-slate-400">
        Still have questions?{" "}
        <Link href="/faq" className="text-brand-purple hover:text-brand-teal transition">
          See the full FAQ →
        </Link>
        {" or "}
        <Link href="/contact" className="text-brand-purple hover:text-brand-teal transition">
          email us
        </Link>
        .
      </div>
    </section>
  );
}

function ComparisonLinks() {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-5xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        How Tweaxly compares
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        Evaluating Tweaxly against what you use today.
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/compare/excel" className="block card group hover:border-brand-purple/40 transition">
          <div className="text-base font-semibold text-white">Tweaxly vs Excel</div>
          <div className="mt-2 text-sm text-slate-400 leading-relaxed">
            When to move from spreadsheets to continuous AI business intelligence.
          </div>
          <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">Read →</div>
        </Link>
        <Link href="/compare/accounting-software" className="block card group hover:border-brand-purple/40 transition">
          <div className="text-base font-semibold text-white">Tweaxly vs Accounting Software</div>
          <div className="mt-2 text-sm text-slate-400 leading-relaxed">
            Accounting records the past. Tweaxly explains the present and forecasts what&apos;s next.
          </div>
          <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">Read →</div>
        </Link>
        <Link href="/compare/dashboards" className="block card group hover:border-brand-purple/40 transition">
          <div className="text-base font-semibold text-white">Tweaxly vs Static Dashboards</div>
          <div className="mt-2 text-sm text-slate-400 leading-relaxed">
            Power BI &amp; Tableau show data. Tweaxly explains it, forecasts and advises.
          </div>
          <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">Read →</div>
        </Link>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-wide pb-24 lg:pb-32 max-w-5xl">
      <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
          Get your first <span className="gradient-text">AI business signals</span> today.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          5-minute setup. No credit card. Your data stays yours. Bring a CSV
          and you&apos;ll have signals, a forecast and an AI advisor before lunch.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">Start Free</a>
          <Link href="/features" className="btn-ghost text-base px-6 py-3">See all features →</Link>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Pro $49/mo · Business $149/mo · AI Credits included on every plan
        </div>
      </div>
    </section>
  );
}
