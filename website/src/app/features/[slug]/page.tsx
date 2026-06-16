// /features/[slug] - dynamic per-feature deep-dive page. One entry
// per SUBPAGES item in src/content/features.ts. Each page ships:
//   • Unique meta (title / description / keywords / canonical / OG / Twitter)
//   • One H1
//   • Hero + product visual + deep explanation prose
//   • Feature list pulled from the parent category
//   • Concrete use cases
//   • Per-page FAQs with FAQPage JSON-LD
//   • BreadcrumbList JSON-LD (Home › Features › <subpage>)
//   • Internal links back to /features, /resources, /pricing, /faq
//   • Final CTA
//
// Every URL pre-generates at build time via generateStaticParams.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { SignalDeckFull } from "@/components/mocks/SignalDeck";
import { ForecastChart } from "@/components/mocks/ForecastChart";
import { ConsultationMock } from "@/components/mocks/Consultation";
import { ExecutiveOverviewMock } from "@/components/mocks/ExecutiveOverview";
import {
  SUBPAGES, getSubpage, subpageSlugs, categoryById,
  type SubpageContent, type VisualKey,
} from "@/content/features";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const SITE_URL    = "https://tweaxly.com";

// ─────────────────────────────────────────────────────────────────────
// Static params + metadata
// ─────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return subpageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const sp = getSubpage(slug);
  if (!sp) return { title: "Feature not found | Tweaxly" };

  const url = `/features/${slug}`;
  return {
    title: { absolute: sp.metaTitle },
    description: sp.metaDescription,
    keywords: sp.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: sp.metaTitle,
      description: sp.metaDescription,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: sp.metaTitle,
      description: sp.metaDescription,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Structured data per subpage
// ─────────────────────────────────────────────────────────────────────

function SubpageStructuredData({ sp }: { sp: SubpageContent }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",     item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/features` },
      { "@type": "ListItem", position: 3, name: sp.h1,      item: `${SITE_URL}/features/${sp.slug}` },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sp.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default async function FeatureSubpage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const sp = getSubpage(slug);
  if (!sp) notFound();

  const category = categoryById(sp.categoryId);

  return (
    <main id="main-content" className="flex-1">
      <SubpageStructuredData sp={sp} />
      <SiteHeader active="features" />

      {/* Visible breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-wide pt-8 pb-2">
        <ol className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <li><Link href="/" className="hover:text-slate-800 transition">Home</Link></li>
          <li className="text-slate-600">›</li>
          <li><Link href="/features" className="hover:text-slate-800 transition">Features</Link></li>
          <li className="text-slate-600">›</li>
          <li className="text-slate-700">{category?.navLabel ?? sp.h1}</li>
        </ol>
      </nav>

      <Hero sp={sp} />
      {category ? <FeatureVisual visual={category.visual} /> : null}
      <DeepExplanation paragraphs={sp.deepExplanation} />
      {category ? <CategoryFeatureList categoryId={sp.categoryId} /> : null}
      <UseCases items={sp.useCases} />
      <FaqSection faqs={sp.faqs} />
      <RelatedArticles slugs={sp.relatedArticleSlugs} />
      <FinalCta />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function Hero({ sp }: { sp: SubpageContent }) {
  return (
    <section className="container-wide pt-6 pb-10 lg:pt-10 lg:pb-12 max-w-4xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-4">
        Tweaxly Features
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[color:var(--color-ink-strong)]">
        {sp.h1}
      </h1>
      <p className="mt-5 text-lg text-slate-700 leading-relaxed">
        {sp.subtitle}
      </p>
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">Start Free</a>
        <Link href="/features" className="btn-ghost text-base px-6 py-3">All features →</Link>
      </div>
    </section>
  );
}

function FeatureVisual({ visual }: { visual: VisualKey }) {
  if (visual === null) return null;
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="rounded-2xl border border-line bg-ink-900 p-2 shadow-2xl max-w-5xl mx-auto">
        {visual === "executive-overview" ? <ExecutiveOverviewMock /> : null}
        {visual === "signal-deck"        ? <SignalDeckFull />        : null}
        {visual === "forecast-chart"     ? <ForecastChart />         : null}
        {visual === "consultation"       ? <ConsultationMock />      : null}
      </div>
    </section>
  );
}

function DeepExplanation({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="space-y-5 text-base sm:text-lg text-slate-700 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

function CategoryFeatureList({ categoryId }: { categoryId: string }) {
  const category = categoryById(categoryId);
  if (!category) return null;
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="max-w-3xl mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          What's included
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
          Capabilities in this area.
        </h2>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        {category.features.map((f) => (
          <article key={f.name} className="card">
            <h3 className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">{f.name}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.whatItDoes}</p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              <span className="text-slate-600">Why it matters: </span>
              {f.whyItMatters}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function UseCases({ items }: { items: string[] }) {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Real business use cases
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
        How owners use this in practice.
      </h2>
      <ul className="mt-6 space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4">
            <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-purple/15 border border-brand-purple/40 text-brand-purple text-xs font-semibold">
              {i + 1}
            </span>
            <p className="text-base text-slate-700 leading-relaxed pt-0.5">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FaqSection({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Frequently asked questions
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)] mb-6">
        Questions about this feature.
      </h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card group">
            <summary className="cursor-pointer list-none flex items-start gap-3">
              <span className="text-brand-purple group-open:rotate-90 transition-transform mt-1">›</span>
              <span className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug flex-1">{f.q}</span>
            </summary>
            <div className="mt-3 ml-7 text-sm text-slate-700 leading-relaxed">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedArticles({ slugs }: { slugs?: string[] }) {
  if (!slugs || slugs.length === 0) return null;
  // Article titles aren't imported here to avoid coupling - the
  // article-card title slot just shows a friendly version of the slug,
  // since by the time the link is rendered the resources page has the
  // full title anyway. Keeps this section dependency-light.
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-5xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Related reading
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[color:var(--color-ink-strong)] mb-6">
        Go deeper on this topic.
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slugs.map((slug) => (
          <Link
            key={slug}
            href={`/resources/${slug}`}
            className="block card group hover:border-brand-purple/40 transition"
          >
            <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">
              {slugToTitle(slug)}
            </div>
            <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">
              Read on the Resources hub →
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-sm text-slate-600 flex items-center gap-4 flex-wrap">
        <Link href="/features" className="text-brand-purple hover:text-brand-teal transition">
          ← Back to all features
        </Link>
        <Link href="/resources" className="text-brand-purple hover:text-brand-teal transition">
          All articles →
        </Link>
        <Link href="/pricing" className="text-brand-purple hover:text-brand-teal transition">
          See pricing →
        </Link>
        <Link href="/faq" className="text-brand-purple hover:text-brand-teal transition">
          Full FAQ →
        </Link>
      </div>
    </section>
  );
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function FinalCta() {
  return (
    <section className="container-wide pb-24 lg:pb-32">
      <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-12 text-center max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
          Bring AI business intelligence <br className="hidden sm:inline" />
          <span className="gradient-text">to your business</span>.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Tweaxly turns your real financial activity into business signals,
          forecasts, and advice - in real time, using AI.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">Start Free</a>
          <Link href="/pricing" className="btn-ghost text-base px-6 py-3">See Pricing →</Link>
        </div>
      </div>
    </section>
  );
}

// Silence unused-import warning if SUBPAGES were imported lazily.
void SUBPAGES;
