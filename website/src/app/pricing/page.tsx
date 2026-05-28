// /pricing - simplified 2-tier model (Free / Pro) with AI Credits
// as the scaling layer. The previous 3-tier model (Free / Pro /
// Business) was collapsed into a single premium tier; everything
// that used to be Business-only is now in Pro, and the only thing
// above Pro is purchasing additional AI Credit packs.
//
// Page sections: Hero · Two plan cards · Feature comparison ·
// AI Credits explainer + add-on packs · FAQ · Comparison page
// cross-links · Final CTA. Ships Product + FAQPage + BreadcrumbList
// JSON-LD.

import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const SITE_URL    = "https://tweaxly.com";

const DESCRIPTION =
  "Tweaxly pricing for AI business intelligence. Start free with 30 AI Credits and 90 days of history. Upgrade to Pro ($49/mo) for unlimited everything + 100 AI Credits/month. Buy more AI Credit packs anytime.";
const OG_DESCRIPTION =
  "Two plans. Start free with AI Credits included. Upgrade to Pro for unlimited platform access, then buy AI Credit packs as you scale.";

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

type PlanKey = "free" | "pro";

interface Plan {
  key:        PlanKey;
  name:       string;
  price:      string;
  period:     string;
  tagline:    string;
  bullets:    string[];
  credits:    string;
  ctaLabel:   string;
  ctaHref:    string;
  ctaSub:     string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    key:      "free",
    name:     "Free",
    price:    "$0",
    period:   "forever",
    tagline:  "Connect your business and experience AI-powered insights. Starter credits included.",
    credits:  "30 starter AI Credits (one-time grant)",
    bullets: [
      "1 workspace owner (no team invites on Free)",
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
    tagline:   "Unlock the full platform - everything Tweaxly can do, in one premium plan.",
    credits:   "100 AI Credits / month",
    highlight: true,
    bullets: [
      "Owner + up to 2 team members with role-based access",
      "Buy add-on AI Credit packs anytime as you scale",
      "Advanced AI analysis & faster responses",
      "Real-Time Business Alerts (desktop push + custom monitors)",
      "Unlimited historical data + custom date ranges",
      "Unlimited business signals + smart alerts",
      "Long-horizon forecasting (6, 12, 24, 36, 60 months)",
      "Scenario Builder + multi-scenario compare",
      "Workforce Planning + hire/cost modelling",
      "Export to Excel, CSV, PDF (+ white-label)",
    ],
    ctaLabel: "Start Pro Free",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "Start free, upgrade when ready",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Feature matrix
// ─────────────────────────────────────────────────────────────────────

interface MatrixRow { dimension: string; free: string; pro: string }
interface MatrixGroup { label: string; rows: MatrixRow[] }

const MATRIX: MatrixGroup[] = [
  {
    label: "Workspace",
    rows: [
      // Workspaces are unlimited on both plans (each workspace has
      // its own subscription), so we don't surface a count.
      { dimension: "Team members",     free: "1 owner only", pro: "Owner + 2 team members" },
      { dimension: "Data sources",     free: "1",        pro: "Unlimited + integrations" },
      { dimension: "Historical data",  free: "90 days",  pro: "Unlimited" },
      { dimension: "Custom historical range", free: "—", pro: "✓" },
    ],
  },
  {
    label: "AI & intelligence",
    rows: [
      { dimension: "Included AI Credits",             free: "30 (starter, one-time)", pro: "100 / month (+ packs)" },
      { dimension: "Business signals / month",        free: "Up to 3",   pro: "Unlimited" },
      { dimension: "Smart alerts",                    free: "—",         pro: "✓" },
      { dimension: "Real-Time Business Alerts (desktop push)", free: "—", pro: "✓" },
      { dimension: "Custom monitors",                 free: "1 threshold", pro: "Unlimited + severity routing" },
      { dimension: "Quiet hours + daily limit",       free: "—",         pro: "✓" },
      { dimension: "AI consultation",                 free: "Basic",     pro: "Full + priority processing" },
      { dimension: "Action-oriented recommendations", free: "—",         pro: "✓" },
    ],
  },
  {
    label: "Forecasting",
    rows: [
      { dimension: "Forecast horizon",       free: "3 months",  pro: "Up to 60 months" },
      { dimension: "Scenario Builder",       free: "—",         pro: "✓" },
      { dimension: "Multi-scenario compare", free: "—",         pro: "✓" },
      { dimension: "Workforce Planning",     free: "—",         pro: "✓" },
      { dimension: "Yearly reports + insights", free: "—",      pro: "✓" },
    ],
  },
  {
    label: "Reports",
    rows: [
      { dimension: "On-screen reports",    free: "✓",  pro: "✓" },
      { dimension: "Excel / CSV export",   free: "—",  pro: "✓" },
      { dimension: "PDF export",           free: "—",  pro: "✓" },
      { dimension: "White-label reports",  free: "—",  pro: "✓" },
    ],
  },
  {
    label: "Integrations & access",
    rows: [
      { dimension: "Basic integrations",    free: "✓",  pro: "✓" },
      { dimension: "Advanced integrations", free: "—",  pro: "✓" },
      { dimension: "Webhooks",              free: "—",  pro: "✓" },
      { dimension: "Dedicated onboarding",  free: "—",  pro: "✓" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// AI Credits explainer
// ─────────────────────────────────────────────────────────────────────

const CREDIT_COSTS: { action: string; cost: string }[] = [
  { action: "Ask the AI advisor a question",      cost: "1 credit" },
  { action: "Deep business analysis on a signal", cost: "3 credits" },
  { action: "Generate a fresh forecast",          cost: "5 credits" },
  { action: "Scenario builder run",               cost: "5 credits" },
];

const CREDIT_PACKS: { pack: string; price: string }[] = [
  { pack: "+30 AI Credits",       price: "$9" },
  { pack: "+50 AI Credits",       price: "$14" },
  { pack: "+100 AI Credits",      price: "$19" },
  { pack: "Custom (30+ credits)", price: "from $9" },
];

// ─────────────────────────────────────────────────────────────────────
// FAQs (pricing-specific)
// ─────────────────────────────────────────────────────────────────────

const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: "Is the Free plan really free?",
    a: "Yes. The Free plan is free forever - no credit card required. You get 90 days of visible history, the core signals + forecasts + AI advisor at the levels listed above, and a one-time grant of 30 starter AI Credits to experience the AI. Free workspaces have a single owner (no team invitations on Free). Create as many workspaces as you want (each is its own subscription). Upgrade any workspace to Pro when you're ready to use AI continuously or bring in teammates.",
  },
  {
    q: "What is an AI Credit?",
    a: "AI Credits are how Tweaxly meters AI-powered work. A simple question to the advisor costs 1 credit. A deep analysis on a signal costs 3 credits. Generating a fresh forecast or running a scenario costs 5 credits. Free workspaces get 30 starter credits once (no renewal). Pro workspaces get 100 credits every month plus the ability to buy more anytime, and Pro routes those credits through a more capable AI tier with faster responses.",
  },
  {
    q: "What's the difference between AI on Free vs Pro?",
    a: "Free uses a lightweight AI tier so the starter credits go further - you still get useful consultation, signals, and basic forecasting. Pro switches you to the advanced tier: deeper analysis, longer reasoning, priority processing, and access to the full feature set (Scenario Builder, Workforce Planning, multi-scenario compare, Smart Alerts). The metering (credits per action) stays the same on both tiers.",
  },
  {
    q: "Can I invite team members to my workspace?",
    a: "Yes, on Pro. A Pro workspace supports the owner plus up to 2 additional members - 3 people total - with role-based access. Invite by email from Settings > Members & Access; the invited person gets a one-click link, accepts, and lands inside your workspace with their own login. Pending invitations count toward the 3-person cap. Free workspaces have a single owner only.",
  },
  {
    q: "What can each role do?",
    a: "Three roles: Owner (the workspace creator) has full access including billing, member management, and workspace deletion. Admin can use the app and manage data - uploads, transactions, categories, insights, forecasts, consultations - but cannot access billing or invite/remove members. Viewer is read-only: they can see dashboards, reports and signals but cannot upload, edit or change settings. Roles are assigned per workspace, so the same person can be an Admin in one and a Viewer in another.",
  },
  {
    q: "What happens when my starter credits run out on Free?",
    a: "Your workspace data, dashboards, past reports and historical signals remain fully available. AI-powered features (the advisor, deep analysis, fresh forecast runs) pause - starter credits are a one-time onboarding grant on Free workspaces, not a recurring monthly allowance. Upgrade to Pro to continue using AI continuously with 500 monthly credits + add-on packs.",
  },
  {
    q: "What happens when I run out of AI Credits on Pro?",
    a: "Your Pro monthly allowance resets at the start of each billing cycle. If you need more this month, buy an add-on credit pack from Billing & Credits - they're added instantly and expire 12 months after purchase.",
  },
  {
    q: "Can Free users buy more AI Credits?",
    a: "No. Buying add-on AI Credits is a Pro feature. On Free workspaces, the starter grant is a one-time experience - if you want to keep using the AI, upgrade to Pro for 500 monthly credits + the ability to buy packs anytime.",
  },
  {
    q: "How far into the future does Tweaxly forecast?",
    a: "Free workspaces forecast up to 3 months ahead - enough to spot near-term cash-flow issues. Pro extends the horizon to as far as 60 months (5 years) for long-range scenario planning, hiring decisions and growth modelling. Forecast confidence is shown alongside each projection so you know how much weight to put on the longer windows.",
  },
  {
    q: "What happens if I downgrade or cancel?",
    a: "Your data is never deleted. The workspace moves to read-only mode: dashboards, past reports and historical signals stay visible. New AI consultation, forecast updates, uploads and advanced reports pause until you reactivate. Team members are suspended (not removed) - their access returns automatically when you upgrade back to Pro. Re-subscribe and everything resumes where it left off.",
  },
  {
    q: "Is there an annual plan?",
    a: "Annual billing is coming - typically saves around 20% on the monthly rate. If you'd like to start on annual today, email info@tweaxly.com and we'll set it up manually.",
  },
  {
    q: "Each workspace is its own plan - what does that mean?",
    a: "If you run multiple businesses, every workspace has its own subscription, its own AI Credits, and its own team. Upgrading workspace A to Pro doesn't change workspace B - they're independent, including team membership: the same person can be an Owner in one, Admin in another, and Viewer in a third. Useful for accountants, consultants and multi-business owners who want different tiers per business.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Structured data
// ─────────────────────────────────────────────────────────────────────

function PricingStructuredData() {
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
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }} />
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
        <span className="gradient-text">Upgrade to Pro when ready.</span>
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
        Two plans. AI Credits included on both - 30 one-time starter
        credits on Free, 500 every month on Pro plus add-on packs you
        can buy anytime as your AI usage grows.
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
      <div className="grid sm:grid-cols-2 gap-5 lg:gap-6 max-w-4xl mx-auto">
        {PLANS.map((p) => <PlanCard key={p.key} plan={p} />)}
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
              Recommended
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-slate-400">{plan.period}</span>
        </div>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">{plan.tagline}</p>
      </header>

      <ul className="space-y-2 text-sm text-slate-300 leading-relaxed mb-6 flex-1">
        <li className="flex gap-2">
          <CheckGlyph />
          <span>{plan.credits}</span>
        </li>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-good shrink-0 mt-0.5" aria-hidden="true">
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
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-1/2">Capability</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line">Free</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line text-brand-purple">Pro</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-ink-950/40">
                  <th
                    scope="rowgroup"
                    colSpan={3}
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
            Need more AI power without changing plans? Buy a credit pack.
            That&apos;s the scaling layer - no extra tiers to figure out.
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
              Pro plan only. Added instantly. Expire 12 months after purchase.
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
          Pro $49/mo · 100 AI Credits included · Buy more credits anytime
        </div>
      </div>
    </section>
  );
}
