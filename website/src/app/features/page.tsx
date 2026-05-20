// /features - the central SEO landing page for the product surface.
// Built as a single H1 + eight H2 category sections + H3 feature
// cards so Google can map the IA cleanly. Each card carries an
// optional `href` field so a future per-feature sub-page (eg
// /features/business-signals) can be plugged in without re-laying
// out the page.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;

const DESCRIPTION =
  "Explore Tweaxly's AI-powered features for small and medium businesses, including business signals, financial reports, forecasting, scenario planning, multi-currency intelligence, alerts and AI consultation.";

const OG_DESCRIPTION =
  "See how Tweaxly turns financial data into clear business signals, reports, forecasts, alerts and AI-powered recommendations.";

export const metadata: Metadata = {
  title: { absolute: "Tweaxly Features | AI Business Intelligence for SMBs" },
  description: DESCRIPTION,
  keywords: [
    "Tweaxly features",
    "AI business intelligence",
    "SMB financial dashboard",
    "business signals",
    "financial forecasting",
    "expense analysis",
    "revenue reports",
    "AI financial insights",
    "multi-currency reports",
    "business alerts",
    "scenario planning",
    "AI business advisor",
  ],
  alternates: { canonical: "/features" },
  openGraph: {
    title: "Tweaxly Features | AI Business Intelligence for SMBs",
    description: OG_DESCRIPTION,
    url: "/features",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweaxly Features | AI Business Intelligence for SMBs",
    description: OG_DESCRIPTION,
  },
};

// ─────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────
// Each Feature has an optional `href` that points to a future
// per-feature page. When the destination exists it'll render a
// "Learn more →" link; until then the card is informational only.

type IconName =
  | "dashboard" | "card" | "compare"
  | "signal" | "bell" | "severity" | "target"
  | "revenue" | "expense" | "profit" | "download" | "notes"
  | "forecast" | "calendar" | "scenarios" | "summary"
  | "chat" | "context" | "history" | "question"
  | "upload" | "toggle" | "tag" | "review"
  | "globe" | "convert" | "info" | "shield"
  | "building" | "briefcase" | "language" | "notification";

interface Feature {
  name: string;
  description: string;
  icon: IconName;
  href?: string;  // future sub-page; rendered as "Learn more →" when set
}

interface Category {
  id: string;       // anchor + jump-link target
  eyebrow: string;  // small uppercase tag
  title: string;    // <h2>
  intro: string;    // 1-2 sentence framing
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    id: "overview",
    eyebrow: "A · Business Overview",
    title: "See where your business stands in seconds.",
    intro:
      "A clear, executive-style first look at revenue, expenses, profit and the changes that actually matter - without digging through reports.",
    features: [
      {
        name: "Quick Overview Dashboard",
        description:
          "A single first look at business performance - revenue, expenses, profit, cash movement and the key changes since last period.",
        icon: "dashboard",
      },
      {
        name: "KPI Cards",
        description:
          "The numbers owners actually check, surfaced in simple cards so you understand the current state of the business in seconds.",
        icon: "card",
      },
      {
        name: "Period Comparison",
        description:
          "Compare current performance against last month, last quarter or last year - with deltas, trends and direction at a glance.",
        icon: "compare",
      },
    ],
  },
  {
    id: "signals",
    eyebrow: "B · Business Signals & Alerts",
    title: "Catch what's changing the moment it changes.",
    intro:
      "Tweaxly watches your numbers continuously and pushes the things you'd want a finance team to flag - prioritised, explained and actionable.",
    features: [
      {
        name: "AI Business Signals",
        description:
          "Push-style insights generated automatically when something important shifts in revenue, expenses, vendors or cash position.",
        icon: "signal",
      },
      {
        name: "Alert Rules & Monitoring",
        description:
          "Define your own thresholds - cash floor, expense ceiling, vendor spike - and get notified the moment any of them are crossed.",
        icon: "bell",
      },
      {
        name: "Signal Severity",
        description:
          "Every signal is tagged Low, Medium, Medium-High, High or Critical so you always know what to act on first.",
        icon: "severity",
      },
      {
        name: "Action-Oriented Insights",
        description:
          "Each signal explains what changed, why it matters and what you can do about it - not just a number on a chart.",
        icon: "target",
      },
    ],
  },
  {
    id: "reports",
    eyebrow: "C · Reports & Financial Analysis",
    title: "Reports that read like a briefing, not a spreadsheet.",
    intro:
      "Revenue, expenses, profitability and exports - all built around the questions owners actually ask, with notes-aware AI analysis baked in.",
    features: [
      {
        name: "Revenue Reports",
        description:
          "Track revenue trends, growth and drops, recurring patterns and period-over-period change - by category, customer or source.",
        icon: "revenue",
      },
      {
        name: "Expense Reports",
        description:
          "Understand expense behaviour by category, supplier and period, and surface unusual increases before they become a problem.",
        icon: "expense",
      },
      {
        name: "Profitability View",
        description:
          "See how revenue and expenses combine into the bottom line - with margin trends, contribution shifts and what's driving them.",
        icon: "profit",
      },
      {
        name: "Download Reports",
        description:
          "Export any report as Excel, CSV or PDF when you need to share with an accountant, investor or partner.",
        icon: "download",
      },
      {
        name: "Notes-Aware Analysis",
        description:
          "Transaction notes show up where they're relevant and feed the AI advisor so explanations reflect what really happened.",
        icon: "notes",
      },
    ],
  },
  {
    id: "forecasting",
    eyebrow: "D · Forecasting & Scenarios",
    title: "Look ahead with numbers you can actually plan against.",
    intro:
      "Forward-looking forecasts grounded in your real history, plus a scenario builder that lets you stress-test decisions before you make them.",
    features: [
      {
        name: "Forecast Engine",
        description:
          "Generate forward-looking forecasts of revenue, expenses and cash flow from your real historical activity - no guesswork.",
        icon: "forecast",
      },
      {
        name: "Historical Window Selection",
        description:
          "Choose a reliable baseline - last quarter, 6, 12 or 18 months, or a custom window of at least 90 days - to match your business rhythm.",
        icon: "calendar",
      },
      {
        name: "Scenario Builder",
        description:
          "Model what changes if you hire, cut spend, double marketing, sign a new contract or shift revenue assumptions - side by side with baseline.",
        icon: "scenarios",
      },
      {
        name: "Forecast Summary",
        description:
          "Every forecast comes with a plain-English summary explaining the trajectory, the assumptions and what to watch.",
        icon: "summary",
      },
    ],
  },
  {
    id: "ai-consultation",
    eyebrow: "E · AI Consultation",
    title: "An AI advisor that already knows your business.",
    intro:
      "Ask questions about your own numbers, jump from any signal or report into a contextual consultation, and keep a history of every conversation.",
    features: [
      {
        name: "Business-Aware AI Chat",
        description:
          "A consultation area where you can ask anything about your own financial data - revenue, expenses, customers, vendors, trends - in plain language.",
        icon: "chat",
      },
      {
        name: "Contextual Consultation",
        description:
          "Hit \"Consult\" on any signal or report and open a pre-filled conversation about that exact issue - no copy-pasting numbers.",
        icon: "context",
      },
      {
        name: "Consultation History",
        description:
          "Every conversation is saved with date, time and the context it started from - so you can come back, refine or share later.",
        icon: "history",
      },
      {
        name: "Suggested Questions",
        description:
          "Useful starters like \"Why did my expenses increase?\" or \"What should I watch this month?\" - tuned to where you are in the app.",
        icon: "question",
      },
    ],
  },
  {
    id: "data",
    eyebrow: "F · Data Import & Categorization",
    title: "Get your real numbers in - without the setup pain.",
    intro:
      "Simple CSV imports, an income/expense type that's required up front, and review tools that let the system learn from how you categorise.",
    features: [
      {
        name: "CSV Upload",
        description:
          "Upload financial transactions with a simple, documented CSV template - no API integrations or bookkeeper required to get started.",
        icon: "upload",
      },
      {
        name: "Required Income / Expense Type",
        description:
          "Every transaction is marked as income or expense at upload, so Tweaxly can analyse your business even before full categorisation.",
        icon: "toggle",
      },
      {
        name: "Smart Categorization",
        description:
          "Assign and refine categories as you go - the system learns from your corrections and gets sharper over time.",
        icon: "tag",
      },
      {
        name: "Transaction Review",
        description:
          "A clean review surface where you can correct, re-categorise and improve transactions after upload - your data, your rules.",
        icon: "review",
      },
    ],
  },
  {
    id: "currency",
    eyebrow: "G · Multi-Currency Intelligence",
    title: "Multi-currency, handled the way you'd want a CFO to handle it.",
    intro:
      "Automatic detection, base-currency conversion and transparent tooltips - so any number that crosses currencies is clearly explained.",
    features: [
      {
        name: "Automatic Currency Detection",
        description:
          "Tweaxly identifies every currency in your transactions and reports - no manual flagging.",
        icon: "globe",
      },
      {
        name: "Base Currency Conversion",
        description:
          "Amounts are converted into your business base currency for reporting, with the rate and date used kept on record.",
        icon: "convert",
      },
      {
        name: "Multi-Currency Tooltip",
        description:
          "Where a total spans currencies, a tooltip shows the original breakdown and the converted total - so the number always tells the full story.",
        icon: "info",
      },
      {
        name: "Currency-Aware Reports",
        description:
          "Any calculation that crossed currencies clearly indicates conversion was applied - no silent assumptions, ever.",
        icon: "shield",
      },
    ],
  },
  {
    id: "settings",
    eyebrow: "H · Business Settings",
    title: "Built for owners who run more than one thing.",
    intro:
      "Manage multiple businesses under one account, set your base currency and fiscal preferences, choose your language and tune notifications.",
    features: [
      {
        name: "Business Profile",
        description:
          "Manage business name, base currency, fiscal settings and preferences from one place.",
        icon: "building",
      },
      {
        name: "Multiple Businesses Under One Account",
        description:
          "Run more than one business? Add them all under a single account and switch between them in a click - data stays cleanly separated.",
        icon: "briefcase",
      },
      {
        name: "Language Selection",
        description:
          "Switch interface language from account settings - English first, with more languages rolling out alongside the platform.",
        icon: "language",
      },
      {
        name: "Notification Preferences",
        description:
          "Choose which alerts and signals reach you, on which channels - so the right things get through and the noise doesn't.",
        icon: "notification",
      },
    ],
  },
];

// JSON-LD lets Google parse the feature list as structured content.
// SoftwareApplication is the closest schema.org type for a SaaS
// product page; we expose the flat list of feature names via
// featureList plus an ItemList of categories for richer parsing.
function FeaturesStructuredData() {
  const flatFeatureNames = CATEGORIES.flatMap((c) => c.features.map((f) => f.name));
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tweaxly",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://tweaxly.com/features",
    description: DESCRIPTION,
    featureList: flatFeatureNames,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: CATEGORIES.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `https://tweaxly.com/features#${c.id}`,
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function FeaturesPage() {
  return (
    <main id="main-content" className="flex-1">
      <FeaturesStructuredData />
      <SiteHeader active="features" />

      <Hero />
      <CategoryNav />

      {CATEGORIES.map((c) => (
        <CategorySection key={c.id} category={c} />
      ))}

      <FinalCta />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-12 pb-16 lg:pt-20 lg:pb-20">
      <div className="max-w-4xl">
        <div className="eyebrow mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-good anim-pulse-soft" />
          Tweaxly Platform · Features
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Everything your business numbers <br className="hidden sm:inline" />
          are <span className="gradient-text">trying to tell you</span>.
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
          From revenue trends and expense changes to currency-aware reports,
          forecasts, alerts, and AI consultation - Tweaxly helps business
          owners understand what is happening, why it matters, and what to
          do next.
        </p>
        <div className="mt-10 flex items-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
            Start Free
          </a>
          <Link href="/#how-it-works" className="btn-ghost text-base px-6 py-3">
            See How It Works →
          </Link>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-good" />
          No credit card · 5-minute setup · Your data stays yours
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Anchor jump-nav across the eight categories
// ─────────────────────────────────────────────────────────────────────

function CategoryNav() {
  return (
    <nav
      aria-label="Feature categories"
      className="border-y border-line/60 bg-ink-900/30 backdrop-blur-sm"
    >
      <div className="container-wide py-4 flex items-center gap-x-6 gap-y-2 flex-wrap text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {CATEGORIES.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="hover:text-white transition flex items-center gap-2"
          >
            <span className="w-1 h-1 rounded-full bg-brand-purple" />
            {c.eyebrow.split(" · ")[1] ?? c.eyebrow}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Category section + feature card
// ─────────────────────────────────────────────────────────────────────

function CategorySection({ category }: { category: Category }) {
  return (
    <section
      id={category.id}
      className="container-wide py-16 lg:py-20 scroll-mt-24"
    >
      <div className="max-w-3xl mb-10 lg:mb-12">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          {category.eyebrow}
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15] text-white">
          {category.title}
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          {category.intro}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {category.features.map((f) => (
          <FeatureCard key={f.name} feature={f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const inner = (
    <div className="h-full card group hover:border-brand-purple/40 transition flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-teal/20 border border-line/60 text-brand-purple group-hover:text-white transition">
          <Icon name={feature.icon} />
        </div>
      </div>
      <h3 className="text-base font-semibold text-white leading-snug">{feature.name}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">
        {feature.description}
      </p>
      {feature.href ? (
        <div className="mt-4 text-xs text-brand-purple group-hover:text-brand-teal transition font-medium">
          Learn more →
        </div>
      ) : null}
    </div>
  );

  if (feature.href) {
    return (
      <Link
        href={feature.href}
        className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-purple"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="container-wide pb-24 lg:pb-32">
      <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
          Bring every signal, forecast and answer <br className="hidden sm:inline" />
          <span className="gradient-text">into one control center</span>.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Tweaxly turns your real financial activity into business signals,
          forecasts, and advice - in real time, using AI.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
            Start Free
          </a>
          <Link href="/pricing" className="btn-ghost text-base px-6 py-3">
            See Pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inline icon set
// ─────────────────────────────────────────────────────────────────────
// One-line stroke SVGs at a fixed 20×20 box. Single component keeps
// the feature data file pure data (just an `icon` key) and avoids a
// per-icon component-soup.

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <path d="M4 20V8" /><path d="M10 20V4" />
          <path d="M16 20v-9" /><path d="M22 20V14" />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" />
          <path d="M8 8a5.7 5.7 0 0 0 0 8" />
          <path d="M16 8a5.7 5.7 0 0 1 0 8" />
          <path d="M5 5a10 10 0 0 0 0 14" />
          <path d="M19 5a10 10 0 0 1 0 14" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "severity":
      return (
        <svg {...common}>
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v5" />
          <path d="M12 18h.01" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "revenue":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "expense":
      return (
        <svg {...common}>
          <path d="M3 7l6 6 4-4 8 8" />
          <path d="M14 17h7v-7" />
        </svg>
      );
    case "profit":
      return (
        <svg {...common}>
          <path d="M21 12A9 9 0 1 1 12 3v9z" />
          <path d="M21 12A9 9 0 0 0 12 3v9z" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v12" />
          <path d="M6 12l6 6 6-6" />
          <path d="M4 20h16" />
        </svg>
      );
    case "notes":
      return (
        <svg {...common}>
          <path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <path d="M8 10h8M8 14h8M8 18h5" />
        </svg>
      );
    case "forecast":
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <path d="M3 16l4-4 4 3 4-5 5 6" />
          <circle cx="11" cy="15" r="0.8" />
          <circle cx="15" cy="10" r="0.8" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
        </svg>
      );
    case "scenarios":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M7 12c4 0 6-2 10-7" />
          <path d="M7 12c4 0 6 2 10 7" />
        </svg>
      );
    case "summary":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 1 1-3.1-6.3L21 5l-1 4.2A8 8 0 0 1 21 12z" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </svg>
      );
    case "context":
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 0 1 0-5.7l2.8-2.8a4 4 0 0 1 5.7 5.7L17 12.5" />
          <path d="M14 10a4 4 0 0 1 0 5.7l-2.8 2.8a4 4 0 0 1-5.7-5.7L7 11.5" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "question":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 20V8" />
          <path d="M6 12l6-6 6 6" />
          <path d="M4 20h16" />
        </svg>
      );
    case "toggle":
      return (
        <svg {...common}>
          <path d="M4 7h12" /><path d="M11 4l5 3-5 3" />
          <path d="M20 17H8" /><path d="M13 14l-5 3 5 3" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M3 12V4h8l10 10-8 8z" />
          <circle cx="8" cy="9" r="1.4" />
        </svg>
      );
    case "review":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z" />
        </svg>
      );
    case "convert":
      return (
        <svg {...common}>
          <path d="M4 7h13l-3-3" />
          <path d="M20 17H7l3 3" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V4h6v3" />
          <path d="M3 13h18" />
        </svg>
      );
    case "language":
      return (
        <svg {...common}>
          <path d="M5 8h8" />
          <path d="M9 6v2c0 4-2 7-5 8" />
          <path d="M5 14c2.5 3 6 4 8 4" />
          <path d="M13 20l4-9 4 9" />
          <path d="M14.5 17h5" />
        </svg>
      );
    case "notification":
      return (
        <svg {...common}>
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16z" />
          <circle cx="18" cy="5" r="3" fill="currentColor" />
        </svg>
      );
  }
}
