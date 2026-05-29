import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  CATEGORIES, articleHref, articlesByCategory, categoryHref, getCategory,
} from "@/content/resources";
import type { CategoryId } from "@/content/resources/types";
import { Breadcrumb, FAQ } from "@/components/article";
import { JsonLd, breadcrumbJsonLd, collectionJsonLd, faqJsonLd } from "@/lib/schema";
import GlossaryFilter from "./GlossaryFilter";

const SITE_ORIGIN = "https://tweaxly.com";

// Every category is a known route - pre-render all 10.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category as CategoryId);
  if (!cat) return { title: "Category not found | Tweaxly" };
  const title = `${cat.label} - Learning Center | Tweaxly`;
  const url = categoryHref(cat.id);
  return {
    title: { absolute: title },
    description: cat.blurb,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: cat.blurb,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cat.blurb,
    },
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// Suggest a couple of related categories. Curated mapping based on
// how the topics overlap - kept here rather than in types.ts because
// it's presentation, not content data.
const RELATED: Record<CategoryId, CategoryId[]> = {
  "financial-fundamentals":   ["business-metrics-kpis", "cash-flow-management", "expense-management"],
  "business-metrics-kpis":    ["business-intelligence", "business-forecasting", "financial-fundamentals"],
  "cash-flow-management":     ["business-forecasting", "financial-fundamentals", "business-signals"],
  "business-forecasting":     ["cash-flow-management", "business-intelligence", "expense-management"],
  "expense-management":       ["cash-flow-management", "financial-fundamentals", "business-forecasting"],
  "business-growth":          ["business-forecasting", "cash-flow-management", "small-business-operations"],
  "business-intelligence":    ["business-metrics-kpis", "business-signals", "business-forecasting"],
  "business-signals":         ["business-intelligence", "cash-flow-management", "business-forecasting"],
  "small-business-operations":["business-growth", "business-intelligence", "expense-management"],
  "business-glossary":        ["financial-fundamentals", "business-metrics-kpis", "business-intelligence"],
};

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params;
  const cat = getCategory(category as CategoryId);
  if (!cat) notFound();

  const articles = articlesByCategory(cat.id).sort(
    (a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt),
  );
  const featured = articles.filter((a) => a.meta.featured);
  const latest   = articles.filter((a) => !a.meta.featured);
  const relatedCategories = (RELATED[cat.id] ?? [])
    .map((id) => getCategory(id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <main id="main-content" className="flex-1">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home",      url: `${SITE_ORIGIN}/` },
        { name: "Resources", url: `${SITE_ORIGIN}/resources` },
        { name: cat.label,   url: `${SITE_ORIGIN}${categoryHref(cat.id)}` },
      ])} />
      <JsonLd data={collectionJsonLd({
        category: cat,
        articles: articles.map((a) => a.meta),
      })} />
      <JsonLd data={faqJsonLd(cat.faq)} />
      <SiteHeader />

      {/* Hero */}
      <section className="container-wide pt-10 pb-12 lg:pt-16 lg:pb-16 max-w-5xl">
        <Breadcrumb
          items={[
            { label: "Resources", href: "/resources" },
            { label: cat.label },
          ]}
        />
        <div className="eyebrow mb-3">Learning Center · Category</div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-white">
          {cat.label}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
          {cat.blurb}
        </p>
      </section>

      {/* Full category intro - 300-500 words. Drives topical
          authority and gives generative engines a substantive answer
          to "what is this category about?". */}
      <section className="container-wide pb-12 max-w-3xl">
        <div className="article-body text-slate-200 leading-relaxed">
          <p>{cat.description}</p>
        </div>
      </section>

      {/* Featured articles */}
      {featured.length > 0 ? (
        <section className="container-wide pb-12 max-w-5xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Featured</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((a) => (
              <Link
                key={a.meta.slug}
                href={articleHref(a.meta)}
                className="block group card hover:border-brand-purple/40 transition"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-2">Featured</div>
                <div className="text-base font-semibold text-white leading-snug">{a.meta.title}</div>
                <div className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">{a.meta.excerpt}</div>
                <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <span>{fmtDate(a.meta.publishedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{a.meta.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Latest articles - the glossary category renders as a
          filterable grid of all entries instead of the standard
          latest list (the glossary doesn't have a meaningful
          "latest" - it's a reference). */}
      <section className="container-wide pb-12 max-w-5xl">
        {cat.id === "business-glossary" ? (
          <GlossaryFilter
            entries={articles.map((a) => ({
              slug:       a.meta.slug,
              title:      a.meta.title,
              excerpt:    a.meta.excerpt,
              difficulty: a.meta.difficulty ?? "beginner",
              href:       articleHref(a.meta),
            }))}
          />
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">
              {featured.length ? "Latest" : "All articles"}
            </div>
            {latest.length === 0 && featured.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-ink-900/30 p-10 text-center">
                <div className="text-base font-medium text-slate-200 mb-1">
                  Articles for this category are on the way
                </div>
                <div className="text-sm text-slate-400 max-w-md mx-auto">
                  We&apos;re building out the {cat.label} library. In the meantime, explore
                  {" "}
                  <Link href="/resources" className="text-brand-purple hover:underline">
                    related categories
                  </Link>.
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {latest.map((a) => (
                  <Link
                    key={a.meta.slug}
                    href={articleHref(a.meta)}
                    className="block group card hover:border-brand-purple/40 transition"
                  >
                    <div className="text-base font-semibold text-white leading-snug">{a.meta.title}</div>
                    <div className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">{a.meta.excerpt}</div>
                    <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <span>{fmtDate(a.meta.publishedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{a.meta.readingTime} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Related categories */}
      {relatedCategories.length > 0 ? (
        <section className="container-wide pb-16 max-w-5xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Related categories</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {relatedCategories.map((rc) => (
              <Link
                key={rc.id}
                href={categoryHref(rc.id)}
                className="block group card hover:border-brand-purple/40 transition"
              >
                <div className="text-base font-semibold text-white leading-snug">{rc.label}</div>
                <div className="mt-2 text-xs text-slate-400 leading-relaxed">{rc.blurb}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Category FAQ. Both renders and emits FAQPage JSON-LD. */}
      <section className="container-wide pb-20 max-w-3xl">
        <FAQ items={cat.faq} title={`Frequently asked: ${cat.label}`} />
      </section>
    </main>
  );
}
