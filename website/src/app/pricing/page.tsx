// /pricing - 3-tier model (Free / Pro / Executive). Free has a
// one-time starter grant of AI Credits and a single workspace; Pro
// is the working-business tier with renewing credits and a small
// team; Executive (internal key still "business") is the
// collaboration / multi-workspace tier with Share Insights as the
// headline entitlement.
//
// Earlier history: simplified 2-tier model (Free / Pro) with AI Credits
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

type PlanKey = "free" | "pro" | "business";

// One bullet line in a plan card.
//
// `text` is the line as-rendered. Wrap any segment that should be
// colour-highlighted (the part that DIFFERS from the other plans)
// inside <em>…</em>. The renderer parses those markers and styles
// the marked segments in brand purple. Lines whose value is the
// same across all three plans should have NO <em> markers so the
// highlight stays scoped to actual differences.
//
// `tooltip` shows on hover. Used to flesh out short bullet labels
// without lengthening the card itself - the headline reads in two
// seconds, the tooltip gives the operator-level detail.
interface PlanBullet {
  text:    string;
  tooltip?: string;
}

// Bullets are split into three tiers so each card renders the same
// reading order:
//   1. universal  - features available on EVERY plan (with the
//                   value for THIS plan, colour-coded so the
//                   tier scaling is scannable across columns)
//   2. paidOnly   - features available on Pro AND Executive (the
//                   "you have to pay" tier). Free omits this
//                   section.
//   3. executiveOnly - features available only on Executive. Pro
//                      and Free both omit this section.
// Higher tier always has the strict superset of sections shown -
// Free has section 1, Pro has 1 + 2, Executive has 1 + 2 + 3.
interface PlanBullets {
  universal:      PlanBullet[];
  paidOnly?:      PlanBullet[];
  executiveOnly?: PlanBullet[];
}

interface Plan {
  key:        PlanKey;
  name:       string;
  price:      string;
  period:     string;
  tagline:    string;
  bullets:    PlanBullets;
  credits:    string;
  ctaLabel:   string;
  ctaHref:    string;
  ctaSub:     string;
  highlight?: boolean;
}

// Tooltip strings reused across plans. Defined once so Pro and
// Executive show the SAME hover text for the same feature - keeps
// the cards in sync as we evolve the copy.
const TIP = {
  workspace:     "A workspace is a single business. Each has its own data, signals, AI Credits and (on paid plans) team.",
  credits:       "AI Credits meter every AI-powered action: 1 per consultation question, 3 per deep analysis, 5 per fresh forecast or scenario run.",
  aiEngine:      "Standard is a lightweight tier so starter credits go further. Advanced is deeper analysis, longer reasoning and priority processing.",
  dataSources:   "Upload as many files and as much historical data as you need. No caps on data ingestion, on any plan.",
  signals:       "Tweaxly automatically surfaces the most important business observations from your data, ranked by impact.",
  forecast:      "How far ahead Tweaxly projects revenue, expenses and cash position.",
  reports:       "View every report inside the app. Paid plans add Excel / CSV / PDF export.",
  teamPro:       "Pro adds the Viewer role. Viewers see everything but can't write. Only the Owner can upload data, manage sources, and use the advisor.",
  teamExec:      "Executive adds the Admin role so an operations lead can manage day-to-day. Up to 5 invited members across Admin and Viewer.",
  smartAlerts:   "Desktop push notifications + custom monitors for unusual changes detected in your data.",
  customRange:   "Drill into any historical window, not just the preset ones.",
  scenarios:     "Build multiple what-if scenarios (hires, cuts, price changes, marketing shifts) and compare them side by side.",
  workforce:     "Model hires, cuts and contract changes; see the impact on cash and runway.",
  export:        "Excel, CSV, PDF. Accountant-ready files; Executive adds white-label branding.",
  buyCredits:    "Run out mid-cycle? Buy 30 / 50 / 100 / custom packs on demand. Credits add instantly.",
  priorityAI:    "Faster responses and longer reasoning on the advanced AI tier.",
  shareInsights: "Secure read-only links for any AI analysis. 24h / 7d / 30d expiry, optional password, view analytics. Recipients don't need a Tweaxly account.",
};

// Section 2 (paid-only) features that are IDENTICAL on Pro and
// Executive. No <em> markers because there's nothing differential
// to highlight between the two paid tiers on these lines. The
// team-members line lives on each plan separately because that's
// the one paid-only entry that genuinely differs by tier.
const PAID_ONLY_BASE: PlanBullet[] = [
  { text: "Smart alerts + Real-Time alerts",   tooltip: TIP.smartAlerts },
  { text: "Custom date ranges",                tooltip: TIP.customRange },
  { text: "Scenario Builder",                  tooltip: TIP.scenarios   },
  { text: "Workforce Planning",                tooltip: TIP.workforce   },
  { text: "Export (Excel / CSV / PDF)",        tooltip: TIP.export      },
  { text: "Buy add-on credit packs",           tooltip: TIP.buyCredits  },
  { text: "Priority AI processing",            tooltip: TIP.priorityAI  },
];

const PLANS: Plan[] = [
  {
    key:      "free",
    name:     "Free",
    price:    "$0",
    period:   "forever",
    tagline:  "Connect your business and experience AI-powered insights.",
    // <em>30</em> is highlighted because the number differs from
    // Pro (100) and Executive (250). The cadence "(one-time)" also
    // differs from "per cycle" but we keep the highlight scoped
    // to the number so the eye lands on the comparable digit.
    credits:  "<em>30</em> starter AI Credits (one-time)",
    bullets: {
      universal: [
        { text: "<em>1</em> workspace",                 tooltip: TIP.workspace   },
        { text: "<em>Standard</em> AI engine",          tooltip: TIP.aiEngine    },
        // Data sources + history are Unlimited on every plan, so
        // no <em> highlight - the line is informational, not
        // differential.
        { text: "Unlimited data sources + history",    tooltip: TIP.dataSources },
        { text: "Up to <em>3</em> business signals",   tooltip: TIP.signals     },
        { text: "<em>3 months</em> forecast horizon",  tooltip: TIP.forecast    },
        // On-screen reports exist on every plan - no highlight.
        { text: "On-screen reports",                    tooltip: TIP.reports     },
      ],
    },
    ctaLabel: "Start Free",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "No credit card required",
  },
  {
    key:       "pro",
    name:      "Pro",
    price:     "$49",
    period:    "per month",
    tagline:   "Advanced AI, real-time alerts and team access for the working business.",
    credits:   "<em>100</em> AI Credits per cycle",
    bullets: {
      universal: [
        { text: "Up to <em>3</em> workspaces",          tooltip: TIP.workspace   },
        { text: "<em>Advanced</em> AI engine",          tooltip: TIP.aiEngine    },
        { text: "Unlimited data sources + history",    tooltip: TIP.dataSources },
        { text: "Up to <em>6</em> business signals",   tooltip: TIP.signals     },
        { text: "Up to <em>60 months</em> forecast",   tooltip: TIP.forecast    },
        { text: "On-screen reports",                    tooltip: TIP.reports     },
      ],
      paidOnly: [
        // Owner + 2 highlighted because both the count and role
        // tier differ from Executive (5 + Admin).
        { text: "Owner + <em>2 Viewers</em>",          tooltip: TIP.teamPro     },
        ...PAID_ONLY_BASE,
      ],
    },
    ctaLabel: "Upgrade to Pro",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "Start free, upgrade when ready",
  },
  {
    // Internal key stays "business" - aligned with the product app
    // (Subscription.plan / Polar metadata.planId). User-facing
    // label is "Executive".
    key:       "business",
    name:      "Executive",
    price:     "$89",
    period:    "per month",
    tagline:   "Built for teams, partnerships, accountants and multi-business operators.",
    credits:   "<em>250</em> AI Credits per cycle",
    highlight: true,
    bullets: {
      universal: [
        { text: "<em>Unlimited</em> workspaces",       tooltip: TIP.workspace   },
        { text: "<em>Advanced</em> AI engine",          tooltip: TIP.aiEngine    },
        { text: "Unlimited data sources + history",    tooltip: TIP.dataSources },
        { text: "Up to <em>6</em> business signals",   tooltip: TIP.signals     },
        { text: "Up to <em>60 months</em> forecast",   tooltip: TIP.forecast    },
        { text: "On-screen reports",                    tooltip: TIP.reports     },
      ],
      paidOnly: [
        // Owner + 5 + Admin highlighted because both differ from
        // Pro's "2 + Viewers" line.
        { text: "Owner + <em>5</em> (<em>Admin + Viewer</em>)", tooltip: TIP.teamExec },
        ...PAID_ONLY_BASE,
      ],
      executiveOnly: [
        // No <em> markers - this entire section is Executive-only
        // already, so highlighting inside it would be noise. The
        // tooltip carries the detail.
        { text: "Share Insights", tooltip: TIP.shareInsights },
      ],
    },
    ctaLabel: "Upgrade to Executive",
    ctaHref:  SIGNUP_URL,
    ctaSub:   "Start free, upgrade when ready",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Feature matrix
// ─────────────────────────────────────────────────────────────────────

interface MatrixRow { dimension: string; free: string; pro: string; business: string }
interface MatrixGroup { label: string; rows: MatrixRow[] }

const MATRIX: MatrixGroup[] = [
  {
    label: "Workspace",
    rows: [
      { dimension: "Workspaces",             free: "1",            pro: "Up to 3",                 business: "Unlimited" },
      { dimension: "Team members",           free: "1 (Owner)",    pro: "Owner + 2 (Viewer)",      business: "Owner + 5 (Admin + Viewer)" },
      { dimension: "Data sources",           free: "Unlimited",    pro: "Unlimited + integrations", business: "Unlimited + integrations" },
      { dimension: "Historical data",        free: "Unlimited",    pro: "Unlimited",               business: "Unlimited" },
      { dimension: "Custom historical range", free: "—",           pro: "✓",                       business: "✓" },
    ],
  },
  {
    label: "AI & intelligence",
    rows: [
      { dimension: "AI engine",                                free: "Standard",              pro: "Advanced",                 business: "Advanced" },
      { dimension: "Included AI Credits",                       free: "30 (starter, one-time)", pro: "100 / cycle (+ packs)",   business: "250 / cycle (+ packs)" },
      { dimension: "Active business signals",                   free: "Up to 3",               pro: "Up to 6",                 business: "Up to 6" },
      { dimension: "Smart alerts",                              free: "—",                     pro: "✓",                       business: "✓" },
      { dimension: "Real-Time Business Alerts (desktop push)",  free: "—",                     pro: "✓",                       business: "✓" },
      { dimension: "Custom monitors",                           free: "1 threshold",           pro: "Unlimited + severity routing", business: "Unlimited + severity routing" },
      { dimension: "AI consultation",                           free: "Basic",                 pro: "Full + priority processing", business: "Full + priority processing" },
      { dimension: "Action-oriented recommendations",           free: "—",                     pro: "✓",                       business: "✓" },
    ],
  },
  {
    label: "Forecasting",
    rows: [
      { dimension: "Forecast horizon",          free: "3 months", pro: "Up to 60 months", business: "Up to 60 months" },
      { dimension: "Scenario Builder",          free: "—",        pro: "✓",               business: "✓" },
      { dimension: "Multi-scenario compare",    free: "—",        pro: "✓",               business: "✓" },
      { dimension: "Workforce Planning",        free: "—",        pro: "✓",               business: "✓" },
      { dimension: "Yearly reports + insights", free: "—",        pro: "✓",               business: "✓" },
    ],
  },
  {
    label: "Reports",
    rows: [
      { dimension: "On-screen reports",    free: "✓",  pro: "✓",  business: "✓" },
      { dimension: "Excel / CSV export",   free: "—",  pro: "✓",  business: "✓" },
      { dimension: "PDF export",           free: "—",  pro: "✓",  business: "✓" },
      { dimension: "White-label reports",  free: "—",  pro: "✓",  business: "✓" },
    ],
  },
  {
    label: "Share Insights",
    rows: [
      // Sharing is Executive-only at launch. Grandfathered Pro
      // subscribers (those who had Pro at the moment Business
      // shipped) retain their existing sharing entitlement - but
      // the public pricing page reflects the going-forward policy.
      { dimension: "Secure share links (consultations, signals, forecasts, insights)", free: "—", pro: "—", business: "✓" },
      { dimension: "Expiry control (24h / 7d / 30d)",                                   free: "—", pro: "—", business: "✓" },
      { dimension: "Optional password protection",                                      free: "—", pro: "—", business: "✓" },
      { dimension: "Per-link view analytics",                                           free: "—", pro: "—", business: "✓" },
    ],
  },
  {
    label: "Integrations & access",
    rows: [
      { dimension: "Basic integrations",    free: "✓",  pro: "✓",  business: "✓" },
      { dimension: "Advanced integrations", free: "—",  pro: "✓",  business: "✓" },
      { dimension: "Webhooks",              free: "—",  pro: "✓",  business: "✓" },
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
    q: "What are business signals?",
    a: "Signals are the most important business observations currently affecting your business. We generate them automatically from your data and continuously re-evaluate them as new data arrives. We only display signals that pass our significance threshold - if there's nothing meaningful to flag, the slot stays empty. Quality over quantity. Free workspaces show up to 3 active signals, Pro shows up to 6, both ranked by business impact.",
  },
  {
    q: "What are notifications and how are they different from signals?",
    a: "Notifications are events that happened to a signal. You get a notification when a signal is created, updated, escalated to a higher severity, or resolved. Signals are the current state of your business; notifications are the history of what changed. Notifications never repeat for a signal that's simply still present - so you'll never have 23 notifications for 9 signals.",
  },
  {
    q: "Do signals use AI credits?",
    a: "No. Automatic signal generation - new data uploads, the weekly re-evaluation, the lifecycle updates - is part of the platform and uses zero credits. Only the user-initiated 'Refresh signals' button consumes credits (3 per refresh), and that's optional. You'll always have a calm, free baseline running in the background.",
  },
  {
    q: "Why don't I always see the maximum number of signals?",
    a: "Tweaxly only displays signals that pass its significance threshold. We prioritize relevance over filling slots. If your business is running smoothly and there's nothing meaningful to flag right now, you'll see fewer signals - which is the signal that everything is fine.",
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
    a: "Your workspace data, dashboards, past reports and historical signals remain fully available. AI-powered features (the advisor, deep analysis, fresh forecast runs) pause - starter credits are a one-time onboarding grant on Free workspaces, not a recurring monthly allowance. Upgrade to Pro to continue using AI continuously with 100 monthly credits + add-on packs.",
  },
  {
    q: "What happens when I run out of AI Credits on Pro?",
    a: "Your Pro monthly allowance resets at the start of each billing cycle. If you need more this month, buy an add-on credit pack from Billing & Credits - they're added instantly and expire 12 months after purchase.",
  },
  {
    q: "Can Free users buy more AI Credits?",
    a: "No. Buying add-on AI Credits is a Pro feature. On Free workspaces, the starter grant is a one-time experience - if you want to keep using the AI, upgrade to Pro for 100 monthly credits + the ability to buy packs anytime.",
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
      <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto">
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

      <div className="mb-6 flex-1">
        {/* Credits line - kept above the bullet list because it's
            the single most-asked-about number on every plan. The
            same renderer is used so the <em>NNN</em> highlight on
            the credit number is consistent with the universal
            bullets below. */}
        <BulletSection
          bullets={[{ text: plan.credits, tooltip: TIP.credits }]}
        />

        {/* Section 1 - universal features (every plan has them).
            Values that differ across plans are wrapped in <em>…</em>
            inside the bullet text and rendered in brand purple. */}
        <BulletSection bullets={plan.bullets.universal} />

        {/* Section 2 - paid-only (Pro + Executive). Skipped on Free.
            No section label - the bullets flow continuously from the
            universal section. */}
        {plan.bullets.paidOnly ? (
          <BulletSection bullets={plan.bullets.paidOnly} />
        ) : null}

        {/* Section 3 - Executive-only. Skipped on Free and Pro.
            No section label here either - the bullets flow
            continuously. */}
        {plan.bullets.executiveOnly ? (
          <BulletSection bullets={plan.bullets.executiveOnly} />
        ) : null}
      </div>

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

// One section of bullets inside a PlanCard. Optional header
// (used for the paid-only / Executive-only groups). Each bullet
// can carry highlighted segments (wrapped in <em>…</em> in the
// source string) and an optional tooltip shown on hover.
function BulletSection({
  label,
  bullets,
}: {
  label?:   string;
  bullets:  PlanBullet[];
}) {
  if (bullets.length === 0) return null;
  return (
    <div className="mt-4">
      {label ? (
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple font-semibold mb-2">
          {label}
        </div>
      ) : null}
      <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
        {bullets.map((b, i) => (
          <BulletLine key={i} bullet={b} />
        ))}
      </ul>
    </div>
  );
}

// Renders a single bullet line. Parses <em>…</em> segments and
// wraps them in the brand-purple highlight; renders the tooltip
// (if any) in a CSS-only floating box that appears on hover via
// the `group` / `group-hover` pattern. The dotted underline + help
// cursor on lines that carry a tooltip cues the user to hover.
function BulletLine({ bullet }: { bullet: PlanBullet }) {
  const segments = parseHighlightedSegments(bullet.text);
  const hasTooltip = !!bullet.tooltip;
  return (
    <li className="flex gap-2 group relative">
      <CheckGlyph />
      <span
        className={hasTooltip ? "cursor-help" : undefined}
      >
        {segments.map((seg, i) =>
          seg.highlight ? (
            <span key={i} className="text-brand-purple font-semibold">{seg.text}</span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </span>
      {hasTooltip ? (
        <span
          role="tooltip"
          className={
            "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 " +
            "transition duration-150 absolute z-20 left-0 top-full mt-1.5 " +
            "max-w-xs w-max rounded-md border border-line bg-ink-900 px-3 py-2 " +
            "text-[11px] leading-snug text-slate-300 shadow-lg shadow-black/40"
          }
        >
          {bullet.tooltip}
        </span>
      ) : null}
    </li>
  );
}

// Splits a bullet's source string on <em>…</em> markers. Returns
// alternating segments tagged with `highlight: false` for plain text
// and `highlight: true` for the matched em content. Used so the
// renderer can wrap highlighted segments in the brand-purple span
// without using dangerouslySetInnerHTML.
function parseHighlightedSegments(text: string): { text: string; highlight: boolean }[] {
  const out: { text: string; highlight: boolean }[] = [];
  // Capturing group inside split returns the matched groups
  // interleaved with the surrounding text - even indices are plain,
  // odd indices are the captured (highlighted) content.
  const parts = text.split(/<em>(.*?)<\/em>/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "") continue;
    out.push({ text: parts[i], highlight: i % 2 === 1 });
  }
  return out;
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
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-2/5">Capability</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line">Free</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line">Pro</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line text-brand-purple">Executive</th>
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
                    <td className="px-5 py-3 align-top text-slate-300 border-b border-line/40">
                      {row.pro === "✓" ? <CheckGlyph /> : row.pro === "—" ? <span className="text-slate-600">—</span> : row.pro}
                    </td>
                    <td className="px-5 py-3 align-top text-slate-100 border-b border-line/40">
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
