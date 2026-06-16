import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  ARTICLES, CATEGORIES, articleHref, articlesByCategory, categoryHref,
} from "@/content/resources";
import ResourcesSearch from "./ResourcesSearch";
import { JsonLd, breadcrumbJsonLd } from "@/lib/schema";
import { popularGlossaryTerms } from "@/content/resources/relations";

const SITE_ORIGIN = "https://tweaxly.com";

const DESCRIPTION =
  "Tweaxly Learning Center - plain-English guides on financial fundamentals, KPIs, cash flow, forecasting, growth, expense management, business intelligence and small business operations.";

export const metadata: Metadata = {
  title: { absolute: "Learning Center - Tweaxly Resources" },
  description: DESCRIPTION,
  alternates: { canonical: "/resources" },
  openGraph: {
    title:       "Learning Center - Tweaxly Resources",
    description: DESCRIPTION,
    url:         "/resources",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Learning Center - Tweaxly Resources",
    description: DESCRIPTION,
  },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function ResourcesIndexPage() {
  // Latest articles across every category (chronological).
  const latest = [...ARTICLES]
    .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt))
    .slice(0, 6);

  // Featured for the homepage hero rail. If none flagged, the rail
  // gracefully falls back to the 3 most recent.
  const featured = ARTICLES.filter((a) => a.meta.featured).slice(0, 3);
  const featuredOrLatest = featured.length ? featured : latest.slice(0, 3);

  // Categories minus the glossary (highlighted separately below).
  const topicalCategories = CATEGORIES.filter((c) => c.id !== "business-glossary");
  const glossary          = CATEGORIES.find((c) => c.id === "business-glossary")!;

  return (
    <main id="main-content" className="flex-1">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home",      url: `${SITE_ORIGIN}/` },
        { name: "Resources", url: `${SITE_ORIGIN}/resources` },
      ])} />
      <SiteHeader />

      {/* Hero */}
      <section className="container-wide pt-10 pb-12 lg:pt-16 lg:pb-16 max-w-5xl">
        <div className="eyebrow mb-4">Learning Center</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Small business finance,<br className="hidden sm:inline" />{" "}
          <span className="gradient-text">in plain English</span>.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
          A growing knowledge base for business owners. Financial fundamentals,
          the metrics worth tracking, cash flow, forecasting, growth, expenses,
          operations, and a glossary you can actually understand. No MBA required.
        </p>

        <div className="mt-8">
          <ResourcesSearch articles={ARTICLES.map((a) => ({
            slug: a.meta.slug,
            title: a.meta.title,
            excerpt: a.meta.excerpt,
            category: a.meta.category,
            href: articleHref(a.meta),
          }))} categories={CATEGORIES.map((c) => ({
            id: c.id, label: c.label, href: categoryHref(c.id),
          }))} />
        </div>
      </section>

      {/* Featured categories grid */}
      <section className="container-wide pb-12 max-w-6xl">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Explore by topic</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicalCategories.map((cat) => {
            const count = articlesByCategory(cat.id).length;
            return (
              <Link
                key={cat.id}
                href={categoryHref(cat.id)}
                className="block group card hover:border-brand-purple/40 transition"
              >
                <div className="text-base sm:text-lg font-semibold text-[color:var(--color-ink-strong)] leading-snug">
                  {cat.label}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {cat.blurb}
                </div>
                <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide">
                  {count} {count === 1 ? "article" : "articles"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Business Glossary highlight - separate so it stands out as a
          reference resource vs the topical categories above. */}
      <section className="container-wide pb-8 max-w-6xl">
        <Link
          href={categoryHref(glossary.id)}
          className="block group rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-7 sm:p-9 hover:border-brand-purple/60 transition"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="eyebrow mb-3">Reference</div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
                {glossary.label}
              </div>
              <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                {glossary.blurb} Look up any term you&apos;ve heard but never had clearly explained - one entry per term, written for owners, not analysts.
              </p>
            </div>
            <div className="text-sm text-brand-purple group-hover:underline shrink-0 self-end">
              Open the glossary →
            </div>
          </div>
        </Link>
      </section>

      {/* Popular Business Terms (Layer 10).
          Direct quick-links into the highest-traffic glossary
          entries. Acts as a low-friction entry point for readers
          searching for specific definitions, and passes homepage
          authority into the glossary cluster. */}
      <section className="container-wide pb-12 max-w-6xl">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">
          Popular business terms
        </div>
        <div className="flex flex-wrap gap-2">
          {popularGlossaryTerms(12).map((t) => (
            <Link
              key={t.meta.slug}
              href={articleHref(t.meta)}
              className="inline-flex items-center rounded-full border border-line bg-ink-900/60 px-4 py-2 text-sm text-slate-800 hover:border-brand-purple/60 hover:text-[color:var(--color-ink-strong)] transition"
            >
              {t.meta.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured articles */}
      {featuredOrLatest.length > 0 ? (
        <section className="container-wide pb-12 max-w-6xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">
            {featured.length ? "Featured articles" : "Recently published"}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredOrLatest.map((a) => {
              const cat = CATEGORIES.find((c) => c.id === a.meta.category);
              return (
                <Link
                  key={`${a.meta.category}-${a.meta.slug}`}
                  href={articleHref(a.meta)}
                  className="block group card hover:border-brand-purple/40 transition"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-2">
                    {cat?.label ?? a.meta.category}
                  </div>
                  <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">{a.meta.title}</div>
                  <div className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{a.meta.excerpt}</div>
                  <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide">
                    {a.meta.readingTime} min read
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Latest resources - up to 6, mixing every category. Repeats
          some of the featured cards above when the library is small;
          this is fine and reflects the genuine state of the catalog. */}
      {latest.length > 0 ? (
        <section className="container-wide pb-16 max-w-6xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Latest resources</div>
          <ul className="space-y-3">
            {latest.map((a) => {
              const cat = CATEGORIES.find((c) => c.id === a.meta.category);
              return (
                <li key={`${a.meta.category}-${a.meta.slug}`} className="card hover:border-brand-purple/40 transition">
                  <Link href={articleHref(a.meta)} className="block">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-1.5">
                      {cat?.label ?? a.meta.category}
                    </div>
                    <div className="text-base font-semibold text-[color:var(--color-ink-strong)]">{a.meta.title}</div>
                    <div className="text-sm text-slate-600 mt-1 leading-relaxed">{a.meta.excerpt}</div>
                    <div className="mt-3 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-3">
                      <span>{fmtDate(a.meta.publishedAt)}</span>
                      <span>·</span>
                      <span>{a.meta.readingTime} min read</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* CTA */}
      <section className="container-wide py-16">
        <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Run your business with clearer numbers
          </h2>
          <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            Tweaxly turns your real financial activity into business signals,
            forecasts, and advice you can actually understand - in plain English.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <a href="https://app.tweaxly.com/register" className="btn-brand text-base px-6 py-3">Start Free</a>
            <Link href="/contact" className="btn-ghost text-base px-6 py-3">Get in touch</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
