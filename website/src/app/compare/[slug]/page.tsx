// /compare/[slug] - lightweight GEO-optimised comparison pages.
// One per entry in src/content/comparisons.ts:
//   • /compare/excel
//   • /compare/accounting-software
//   • /compare/dashboards
//
// Each page ships unique meta, one H1, balanced "when [subject] /
// when Tweaxly" framing, a structured comparison table, real use
// cases, dedicated FAQs with FAQPage JSON-LD, BreadcrumbList
// JSON-LD, and back-links into the rest of the site.
//
// Comparison pages are some of the highest-leverage SEO + AI-search
// content for SaaS - every row in the table reads as a citation-
// ready snippet, and the balanced framing makes the page credible
// rather than promotional.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  COMPARISONS, getComparison, comparisonSlugs,
  type ComparisonContent,
} from "@/content/comparisons";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const SITE_URL    = "https://tweaxly.com";

// ─────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return comparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return { title: "Comparison not found | Tweaxly" };
  const url = `/compare/${slug}`;
  return {
    title: { absolute: c.metaTitle },
    description: c.metaDescription,
    keywords: c.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Structured data per comparison
// ─────────────────────────────────────────────────────────────────────

function ComparisonStructuredData({ c }: { c: ComparisonContent }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",        item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Compare",     item: `${SITE_URL}/compare/${c.slug}` },
      { "@type": "ListItem", position: 3, name: c.headline,    item: `${SITE_URL}/compare/${c.slug}` },
    ],
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
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

export default async function CompareSubpage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  return (
    <main id="main-content" className="flex-1">
      <ComparisonStructuredData c={c} />
      <SiteHeader />

      {/* Visible breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-wide pt-8 pb-2">
        <ol className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <li><Link href="/" className="hover:text-slate-800 transition">Home</Link></li>
          <li className="text-slate-600">›</li>
          <li><Link href="/features" className="hover:text-slate-800 transition">Features</Link></li>
          <li className="text-slate-600">›</li>
          <li className="text-slate-700">Tweaxly vs {c.subject}</li>
        </ol>
      </nav>

      <Hero c={c} />
      <IntroProse c={c} />
      <ComparisonTable c={c} />
      <BalancedFraming c={c} />
      <UseCases items={c.useCases} />
      <FaqSection faqs={c.faqs} subject={c.subject} />
      <OtherComparisons currentSlug={c.slug} />
      <FinalCta />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function Hero({ c }: { c: ComparisonContent }) {
  return (
    <section className="container-wide pt-6 pb-10 lg:pt-10 lg:pb-12 max-w-4xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-4">
        Comparison · Tweaxly vs {c.subject}
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[color:var(--color-ink-strong)]">
        {c.headline}
      </h1>
      <p className="mt-5 text-lg text-slate-700 leading-relaxed">
        {c.subtitle}
      </p>
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">Try Tweaxly Free</a>
        <Link href="/features" className="btn-ghost text-base px-6 py-3">See all features →</Link>
      </div>
    </section>
  );
}

function IntroProse({ c }: { c: ComparisonContent }) {
  return (
    <section className="container-wide pb-10 lg:pb-12 max-w-3xl">
      <div className="space-y-5 text-base sm:text-lg text-slate-700 leading-relaxed">
        {c.intro.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </section>
  );
}

function ComparisonTable({ c }: { c: ComparisonContent }) {
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="max-w-3xl mb-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          Side by side
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
          Tweaxly vs {c.subject}: the dimensions that actually matter.
        </h2>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-900/80 text-left text-[11px] uppercase tracking-[0.16em] text-slate-600">
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-1/4">Dimension</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-3/8">{c.subject}</th>
              <th scope="col" className="px-5 py-4 font-semibold border-b border-line w-3/8 text-brand-purple">Tweaxly</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((row, i) => (
              <tr
                key={row.dimension}
                className={i % 2 === 0 ? "bg-ink-950/40" : ""}
              >
                <td className="px-5 py-4 align-top text-slate-700 font-medium border-b border-line/40">
                  {row.dimension}
                </td>
                <td className="px-5 py-4 align-top text-slate-600 leading-relaxed border-b border-line/40">
                  {row.competitor}
                </td>
                <td className="px-5 py-4 align-top text-slate-800 leading-relaxed border-b border-line/40">
                  <div className="flex items-start gap-2">
                    <CheckGlyph />
                    <span>{row.tweaxly}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      className="text-good shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

function BalancedFraming({ c }: { c: ComparisonContent }) {
  return (
    <section className="container-wide pb-12 lg:pb-16">
      <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 max-w-5xl">
        <div className="card">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-600 font-semibold mb-3">
            When {c.subject} is the right tool
          </div>
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            {c.whenSubject.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card border-brand-purple/30">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
            When Tweaxly is the right tool
          </div>
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            {c.whenTweaxly.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckGlyph />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function UseCases({ items }: { items: string[] }) {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Real-world examples
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
        Where owners actually make the switch.
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

function FaqSection({
  faqs, subject,
}: { faqs: { q: string; a: string }[]; subject: string }) {
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Frequently asked questions
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)] mb-6">
        Tweaxly vs {subject}: the questions owners ask.
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

function OtherComparisons({ currentSlug }: { currentSlug: string }) {
  const others = COMPARISONS.filter((c) => c.slug !== currentSlug);
  return (
    <section className="container-wide pb-12 lg:pb-16 max-w-5xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Other comparisons
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[color:var(--color-ink-strong)] mb-6">
        See how Tweaxly compares to other tools.
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {others.map((o) => (
          <Link
            key={o.slug}
            href={`/compare/${o.slug}`}
            className="block card group hover:border-brand-purple/40 transition"
          >
            <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">
              Tweaxly vs {o.subject}
            </div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              {o.subtitle}
            </div>
            <div className="mt-3 text-[11px] text-brand-purple group-hover:text-brand-teal transition uppercase tracking-wider">
              Read the comparison →
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-sm text-slate-600 flex items-center gap-4 flex-wrap">
        <Link href="/features" className="text-brand-purple hover:text-brand-teal transition">
          See all features →
        </Link>
        <Link href="/pricing" className="text-brand-purple hover:text-brand-teal transition">
          See pricing →
        </Link>
        <Link href="/resources" className="text-brand-purple hover:text-brand-teal transition">
          Browse resources →
        </Link>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-wide pb-24 lg:pb-32">
      <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-12 text-center max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
          Try Tweaxly on your own numbers.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
          5-minute setup. No credit card. Your data stays yours. Bring a CSV
          and you'll have signals, a forecast and an AI advisor before lunch.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href={SIGNUP_URL} className="btn-brand text-base px-6 py-3">Start Free</a>
          <Link href="/pricing" className="btn-ghost text-base px-6 py-3">See Pricing →</Link>
        </div>
      </div>
    </section>
  );
}
