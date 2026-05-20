// /features - product knowledge hub, optimised for both search and
// Generative Engine Optimisation (GEO). The page is rebuilt around
// six business-category sections (Financial Visibility, AI Business
// Intelligence, Forecasting, Business Consultation, Data & Currency,
// Alerts) - each section carries a strong GEO heading, plain-English
// what/why/use-case structure per feature, mini FAQs, and a product
// mock visual where one exists. The hub-level FAQ section ships 15
// AI-ready Q/A pairs with full FAQPage JSON-LD, alongside
// SoftwareApplication and BreadcrumbList schema, so AI engines can
// extract structured understanding without scraping marketing copy.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { SignalDeckFull } from "@/components/mocks/SignalDeck";
import { ForecastChart } from "@/components/mocks/ForecastChart";
import { ConsultationMock } from "@/components/mocks/Consultation";
import { ExecutiveOverviewMock } from "@/components/mocks/ExecutiveOverview";
import {
  CATEGORIES, PAGE_FAQS,
  type FeatureCategory, type Feature, type VisualKey,
} from "@/content/features";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const SITE_URL    = "https://tweaxly.com";

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
// Structured data
// ─────────────────────────────────────────────────────────────────────
// Three schemas, all served as a single <script> per block.
//   • SoftwareApplication - flat feature list + ItemList of categories
//   • FAQPage             - the 15 hub-level Q/A pairs
//   • BreadcrumbList      - Home › Features
// Google + AI engines parse these independently of the visible HTML,
// so accurate structured data is the cheapest GEO win available.

function HubStructuredData() {
  const flatFeatureNames = CATEGORIES.flatMap((c) => c.features.map((f) => f.name));

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tweaxly",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${SITE_URL}/features`,
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
        name: c.h2,
        url: `${SITE_URL}/features#${c.id}`,
      })),
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PAGE_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",     item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/features` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <main id="main-content" className="flex-1">
      <HubStructuredData />
      <SiteHeader active="features" />

      <Hero />
      <Breadcrumb />
      <CategoryNav />

      {CATEGORIES.map((c) => (
        <CategorySection key={c.id} category={c} />
      ))}

      <FaqSection />
      <ComparisonLinks />
      <RelatedReading />
      <FinalCta />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cross-links to /compare/* pages - GEO + funnel-relevant
// ─────────────────────────────────────────────────────────────────────

function ComparisonLinks() {
  const comparisons: { slug: string; title: string; blurb: string }[] = [
    {
      slug:  "excel",
      title: "Tweaxly vs Excel",
      blurb: "When to move from spreadsheets to continuous AI business intelligence.",
    },
    {
      slug:  "accounting-software",
      title: "Tweaxly vs Accounting Software",
      blurb: "Accounting records the past. Tweaxly explains the present and forecasts what's next.",
    },
    {
      slug:  "dashboards",
      title: "Tweaxly vs Static Dashboards",
      blurb: "Power BI and Tableau show data. Tweaxly explains it, forecasts and advises.",
    },
  ];
  return (
    <section className="container-wide py-12 lg:py-16 border-t border-line/40">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        How Tweaxly compares
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        Evaluating Tweaxly against what you use today.
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {comparisons.map((c) => (
          <Link
            key={c.slug}
            href={`/compare/${c.slug}`}
            className="block card group hover:border-brand-purple/40 transition"
          >
            <div className="text-base font-semibold text-white">{c.title}</div>
            <div className="mt-2 text-sm text-slate-400 leading-relaxed">{c.blurb}</div>
            <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">
              Read the comparison →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="container-wide pt-10 pb-14 lg:pt-16 lg:pb-16">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="eyebrow mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-good anim-pulse-soft" />
            Tweaxly Platform · Features
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            AI-Powered Business Intelligence <br className="hidden sm:inline" />
            for <span className="gradient-text">Small Business Owners</span>.
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
            Understand revenue, expenses, profitability, forecasting and
            business trends - without manually analysing spreadsheets.
            Tweaxly turns your real financial activity into business
            signals, forecasts and AI consultation in real time.
          </p>
          <div className="mt-9 flex items-center gap-3 flex-wrap">
            <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">
              Start Free
            </a>
            <Link href="/#how-it-works" className="btn-ghost text-base px-6 py-3">
              See How It Works →
            </Link>
          </div>

          {/* Trust indicators */}
          <ul className="mt-8 flex items-center gap-x-6 gap-y-3 flex-wrap text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <CheckGlyph /> No credit card required
            </li>
            <li className="flex items-center gap-2">
              <CheckGlyph /> 5-minute setup
            </li>
            <li className="flex items-center gap-2">
              <CheckGlyph /> Your data stays yours
            </li>
            <li className="flex items-center gap-2">
              <CheckGlyph /> Multi-currency, audit-logged
            </li>
          </ul>
        </div>

        {/* Hero product visual */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-line bg-ink-900/60 p-2 shadow-2xl">
            <ExecutiveOverviewMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckGlyph() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-good"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Breadcrumb (visible) - sits below the hero, sets up navigation context.
// ─────────────────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="container-wide pb-3 -mt-2">
      <ol className="flex items-center gap-2 text-xs text-slate-500">
        <li>
          <Link href="/" className="hover:text-slate-200 transition">Home</Link>
        </li>
        <li className="text-slate-600">›</li>
        <li className="text-slate-300">Features</li>
      </ol>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Anchor jump-nav across the six categories
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
            {c.navLabel}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Category section
// ─────────────────────────────────────────────────────────────────────

function CategorySection({ category }: { category: FeatureCategory }) {
  return (
    <section
      id={category.id}
      className="container-wide py-16 lg:py-24 scroll-mt-24"
    >
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Heading + visual on the left */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
            {category.eyebrow}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15] text-white">
            {category.h2}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            {category.intro}
          </p>

          {/* Product visual where one is available */}
          <CategoryVisual visual={category.visual} />

          <div className="mt-6">
            <Link
              href={`/features/${category.subpageSlug}`}
              className="text-sm font-medium text-brand-purple hover:text-brand-teal transition"
            >
              Learn more about {category.navLabel} →
            </Link>
          </div>
        </div>

        {/* Feature blocks on the right */}
        <div className="lg:col-span-7 space-y-4">
          {category.features.map((f) => (
            <FeatureBlock key={f.name} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryVisual({ visual }: { visual: VisualKey }) {
  if (visual === null) return null;
  return (
    <div className="mt-8 rounded-2xl border border-line bg-ink-900/60 p-2 shadow-xl">
      {visual === "executive-overview" ? <ExecutiveOverviewMock /> : null}
      {visual === "signal-deck"        ? <SignalDeckFull />        : null}
      {visual === "forecast-chart"     ? <ForecastChart />         : null}
      {visual === "consultation"       ? <ConsultationMock />      : null}
    </div>
  );
}

function FeatureBlock({ feature }: { feature: Feature }) {
  return (
    <article className="card">
      <h3 className="text-lg font-semibold text-white leading-snug">
        {feature.name}
      </h3>

      <dl className="mt-3 space-y-2.5 text-sm leading-relaxed">
        <div>
          <dt className="inline text-slate-500 uppercase tracking-wider text-[10px] mr-2">
            What it does ·
          </dt>
          <dd className="inline text-slate-300">{feature.whatItDoes}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500 uppercase tracking-wider text-[10px] mr-2">
            Why it matters ·
          </dt>
          <dd className="inline text-slate-300">{feature.whyItMatters}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500 uppercase tracking-wider text-[10px] mr-2">
            Example ·
          </dt>
          <dd className="inline text-slate-400 italic">{feature.useCase}</dd>
        </div>
      </dl>

      {feature.faqs && feature.faqs.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-line/50 space-y-2">
          {feature.faqs.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="cursor-pointer text-sm text-slate-300 hover:text-white transition list-none flex items-start gap-2">
                <span className="text-brand-purple group-open:rotate-90 transition-transform mt-0.5">›</span>
                <span>{faq.q}</span>
              </summary>
              <div className="mt-2 ml-5 text-sm text-slate-400 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hub-level FAQ section
// ─────────────────────────────────────────────────────────────────────

function FaqSection() {
  return (
    <section className="container-wide py-16 lg:py-24 border-t border-line/40">
      <div className="max-w-3xl mb-10">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          Frequently Asked Questions
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15] text-white">
          Answers about Tweaxly, in plain English.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          What the platform does, how it's different from accounting software,
          how forecasting works, how the AI advisor handles your data, and the
          questions owners ask most often before getting started.
        </p>
      </div>

      <div className="max-w-3xl space-y-3">
        {PAGE_FAQS.map((f) => (
          <details key={f.q} className="card group">
            <summary className="cursor-pointer list-none flex items-start gap-3">
              <span className="text-brand-purple group-open:rotate-90 transition-transform mt-1">›</span>
              <span className="text-base font-semibold text-white leading-snug flex-1">
                {f.q}
              </span>
            </summary>
            <div className="mt-3 ml-7 text-sm text-slate-300 leading-relaxed">
              {f.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 text-sm text-slate-400">
        Still have questions?{" "}
        <Link href="/faq" className="text-brand-purple hover:text-brand-teal transition">
          See the full FAQ →
        </Link>
        {" or "}
        <Link href="/contact" className="text-brand-purple hover:text-brand-teal transition">
          contact us
        </Link>
        .
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Related reading - internal linking to the Resources hub
// ─────────────────────────────────────────────────────────────────────

function RelatedReading() {
  // Curated set of cornerstone articles. Hard-coded here (rather than
  // imported from /content/resources) so this section stays tight - we
  // don't want every new article auto-appearing on the Features hub.
  const articles: { slug: string; title: string; blurb: string }[] = [
    {
      slug:  "what-is-ai-financial-advisor",
      title: "What is an AI Financial Advisor?",
      blurb: "How AI financial advisors differ from accountants, bookkeepers and generic chatbots.",
    },
    {
      slug:  "financial-forecasting-small-business-guide",
      title: "Financial Forecasting: a Small Business Guide",
      blurb: "How forecasting actually works for SMBs, and what makes a forecast useful vs. theatre.",
    },
    {
      slug:  "business-signals-founders-monitor",
      title: "Business Signals Every Founder Should Monitor",
      blurb: "The seven business signals worth checking weekly - and how to spot them.",
    },
    {
      slug:  "cash-flow-problems-early-warning",
      title: "Cash Flow Problems: Early Warning Signs",
      blurb: "What to watch for in your numbers before cash becomes a real problem.",
    },
    {
      slug:  "spreadsheets-not-enough",
      title: "Why Spreadsheets Aren't Enough Anymore",
      blurb: "Where spreadsheet-based financial management breaks down for growing SMBs.",
    },
  ];

  return (
    <section className="container-wide py-12 lg:py-16 border-t border-line/40">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Related reading
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        Deep dives from the Tweaxly Resources hub.
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/resources/${a.slug}`}
            className="block card group hover:border-brand-purple/40 transition"
          >
            <div className="text-base font-semibold text-white leading-snug">{a.title}</div>
            <div className="mt-2 text-xs text-slate-400 leading-relaxed">{a.blurb}</div>
            <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">
              Read →
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-sm text-slate-400">
        <Link href="/resources" className="text-brand-purple hover:text-brand-teal transition">
          Browse all resources →
        </Link>
        {" · "}
        <Link href="/pricing" className="text-brand-purple hover:text-brand-teal transition">
          See pricing →
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="container-wide pb-24 lg:pb-32 pt-8">
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
