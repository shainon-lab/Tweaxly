import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  CATEGORIES, articleHref, articlesByCategory, categoryHref, getCategory,
} from "@/content/resources";
import type { CategoryId } from "@/content/resources/types";
import { Breadcrumb, FAQ } from "@/components/article";
import { JsonLd, breadcrumbJsonLd, collectionJsonLd, itemListJsonLd, faqJsonLd } from "@/lib/schema";
import GlossaryFilter from "./GlossaryFilter";
import { keyTermsForCategory, relatedCategoriesForCategory } from "@/content/resources/relations";

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
  // Computed cross-category cluster - aggregates tag overlap from
  // each category's articles, no hardcoded map. Auto-evolves when
  // new articles drop in to any category. The earlier RELATED
  // record (Free / Pro / etc. style hand-curated mapping) was
  // removed per the GEO spec's "no hardcoded links" rule.
  const relatedCategories = relatedCategoriesForCategory(cat.id, 3);

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
      {/* ItemList is functionally redundant with CollectionPage's
          hasPart array, but Google product/article carousels and a
          few citation crawlers key off ItemList specifically. Two
          tiny blobs is cheap insurance for richer surfacing. */}
      <JsonLd data={itemListJsonLd({
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
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-[color:var(--color-ink-strong)]">
          {cat.label}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
          {cat.blurb}
        </p>
      </section>

      {/* Full category intro - 300-500 words. Drives topical
          authority and gives generative engines a substantive answer
          to "what is this category about?". */}
      <section className="container-wide pb-12 max-w-3xl">
        <div className="article-body text-slate-800 leading-relaxed">
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
                <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">{a.meta.title}</div>
                <div className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{a.meta.excerpt}</div>
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
                <div className="text-base font-medium text-slate-800 mb-1">
                  Articles for this category are on the way
                </div>
                <div className="text-sm text-slate-600 max-w-md mx-auto">
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
                    <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">{a.meta.title}</div>
                    <div className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{a.meta.excerpt}</div>
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

      {/* Key Terms in this Category (Layer 7).
          Glossary entries that align with the category by shared
          tags. Strengthens the topic cluster - readers browsing the
          category can jump straight to the underlying vocabulary
          without leaving the topic. */}
      {(() => {
        const keyTerms = keyTermsForCategory(cat.id, 8);
        if (keyTerms.length === 0) return null;
        return (
          <section className="container-wide pb-12 max-w-5xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">
              Key terms in {cat.label}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {keyTerms.map((t) => (
                <Link
                  key={t.meta.slug}
                  href={articleHref(t.meta)}
                  className="block group card hover:border-brand-purple/40 transition"
                >
                  <div className="text-sm font-semibold text-[color:var(--color-ink-strong)] leading-snug">
                    {t.meta.title}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {t.meta.excerpt}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-500">
              <Link href="/resources/business-glossary" className="text-brand-purple hover:underline">
                Browse the full Business Glossary →
              </Link>
            </div>
          </section>
        );
      })()}

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
                <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">{rc.label}</div>
                <div className="mt-2 text-xs text-slate-600 leading-relaxed">{rc.blurb}</div>
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
