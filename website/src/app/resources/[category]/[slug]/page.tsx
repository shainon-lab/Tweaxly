import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  CATEGORIES, allArticleParams, articleHref, categoryHref,
  getArticle, getCategory, relatedArticles,
} from "@/content/resources";
import type { CategoryId } from "@/content/resources/types";
import { Breadcrumb, TLDR, FAQ } from "@/components/article";
import { JsonLd, articleJsonLd, faqJsonLd } from "@/lib/schema";
import {
  featuresForCategory, EXPLORE_LINKS,
  glossaryTermsFor, articlesUsingTerm,
} from "@/content/resources/relations";

// Pre-generate every article route at build time.
export function generateStaticParams() {
  return allArticleParams();
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> },
): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category as CategoryId, slug);
  if (!article) return { title: "Resource not found | Tweaxly" };
  const { seo } = article.meta;
  const url = `/resources/${category}/${slug}`;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      type: "article",
      publishedTime: article.meta.publishedAt,
      modifiedTime:  article.meta.updatedAt ?? article.meta.publishedAt,
      authors: [article.meta.author.name],
      tags: article.meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    other: { "article:section": article.meta.category },
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default async function ArticlePage(
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  const { category, slug } = await params;
  const article = getArticle(category as CategoryId, slug);
  if (!article) notFound();

  const cat = getCategory(article.meta.category);
  if (!cat) notFound();
  const related = relatedArticles(article.meta.category, article.meta.slug, 3);
  const Body = article.Body;

  return (
    <main id="main-content" className="flex-1">
      <JsonLd data={articleJsonLd({ article: article.meta, categoryLabel: cat.label })} />
      <JsonLd data={faqJsonLd(article.meta.faq ?? [])} />
      <SiteHeader />

      {/* Hero */}
      <article className="container-wide pt-10 pb-16 lg:pt-16 lg:pb-20 max-w-3xl">
        <Breadcrumb
          items={[
            { label: "Resources", href: "/resources" },
            { label: cat.label,   href: categoryHref(cat.id) },
            { label: article.meta.title },
          ]}
        />
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-white">
          {article.meta.title}
        </h1>
        <div className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          {article.meta.excerpt}
        </div>

        {/* Author + meta strip */}
        <div className="mt-7 flex items-center gap-4 text-xs text-slate-400 border-t border-line/40 pt-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-teal text-white text-xs font-semibold flex items-center justify-center">
              {article.meta.author.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="text-sm text-slate-200 font-medium">{article.meta.author.name}</div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{article.meta.author.role}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <span>{fmtDate(article.meta.publishedAt)}</span>
            <span>·</span>
            <span>{article.meta.readingTime} min read</span>
          </div>
        </div>

        {/* TL;DR (from meta.tldr) - sits BEFORE the article body so
            both human readers and generative engines land on a direct
            answer immediately. */}
        {article.meta.tldr?.length ? (
          <div className="mt-10">
            <TLDR items={article.meta.tldr} />
          </div>
        ) : null}

        {/* Auto-derived link block. Full articles get a "Key terms"
            rail (glossary entries that share topical overlap);
            glossary entries get an "Articles using this term" rail
            (full articles where the term shows up). Driven by
            relations.ts so every existing and future entry inherits
            this linking density automatically - hits the
            8-15-glossary-links-per-article goal on the article side
            and ensures every glossary entry funnels to at least a few
            deeper reads. */}
        {(() => {
          const isGlossary = article.meta.kind === "glossary";
          const links = isGlossary
            ? articlesUsingTerm(article.meta.category, article.meta.slug, 6)
            : glossaryTermsFor(article.meta.category, article.meta.slug, 10);
          if (links.length === 0) return null;
          return (
            <aside className="mt-8 rounded-2xl border border-line bg-ink-900/40 p-5 sm:p-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3 font-semibold">
                {isGlossary ? "Articles using this term" : "Key terms in this article"}
              </div>
              {isGlossary ? (
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={`${l.meta.category}-${l.meta.slug}`}>
                      <Link
                        href={articleHref(l.meta)}
                        className="text-sm text-slate-200 hover:text-white hover:underline transition"
                      >
                        {l.meta.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {links.map((l) => (
                    <Link
                      key={`${l.meta.category}-${l.meta.slug}`}
                      href={articleHref(l.meta)}
                      className="inline-flex items-center rounded-full border border-line bg-ink-950/60 px-3 py-1.5 text-xs sm:text-[13px] text-slate-200 hover:border-brand-purple/60 hover:text-white transition"
                    >
                      {l.meta.title}
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          );
        })()}

        {/* Body */}
        <div className="article-body mt-10">
          <Body />
        </div>

        {/* Article FAQ - rendered from meta.faq. The visible accordion
            doubles as the data source for FAQPage JSON-LD emitted in
            the page <head>. */}
        {article.meta.faq?.length ? (
          <FAQ items={article.meta.faq} />
        ) : null}

        {/* Tags */}
        {article.meta.tags.length > 0 ? (
          <div className="mt-12 pt-6 border-t border-line/40 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mr-1">Tags</span>
            {article.meta.tags.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-line bg-ink-900/60 px-3 py-1 text-xs text-slate-300">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      {/* Related */}
      {related.length > 0 ? (
        <section className="container-wide pb-20 max-w-5xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Continue reading</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r) => {
              const rcat = CATEGORIES.find((c) => c.id === r.meta.category);
              return (
                <Link
                  key={`${r.meta.category}-${r.meta.slug}`}
                  href={articleHref(r.meta)}
                  className="block group card hover:border-brand-purple/40 transition"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-2">
                    {rcat?.label ?? r.meta.category}
                  </div>
                  <div className="text-base font-semibold text-white leading-snug">{r.meta.title}</div>
                  <div className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">{r.meta.excerpt}</div>
                  <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide">
                    {r.meta.readingTime} min read
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Practical Application (Layer 8).
          Contextual product CTA - each category maps to 1-2
          Tweaxly features that fit the topic. Phrased as a
          natural follow-on to the educational content, not as
          sales copy. Skipped entirely for the Business Glossary
          category since glossary entries are reference, not
          guidance. */}
      {(() => {
        const features = featuresForCategory(article.meta.category);
        if (features.length === 0) return null;
        return (
          <section className="container-wide pb-16 max-w-3xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">
              Practical application
            </div>
            <div className="rounded-2xl border border-line bg-ink-900/40 p-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                The concepts above show up in two Tweaxly features in particular:
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/features/${f.slug}`}
                    className="block rounded-xl border border-line bg-ink-950/40 p-4 hover:border-brand-purple/40 transition"
                  >
                    <div className="text-sm font-semibold text-white">{f.label}</div>
                    <div className="mt-1.5 text-xs text-slate-400 leading-relaxed">{f.hook}</div>
                    <div className="mt-3 text-[11px] text-brand-purple">Read more →</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Final CTA */}
      <section className="container-wide pb-16 max-w-5xl">
        <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Bring AI financial intelligence to your business.
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            See how Tweaxly turns your real financial activity into business
            signals, forecasts, and advice - in real time, using AI.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <a href="https://app.tweaxly.com/register" className="btn-brand text-base px-6 py-3">Start Free</a>
            <Link href="/resources" className="btn-ghost text-base px-6 py-3">Browse all resources →</Link>
          </div>
        </div>
      </section>

      {/* Explore Tweaxly (Layer 9).
          Small navigation rail at the bottom of every article so
          pages aren't dead ends. Pure navigation, no marketing
          copy. Helps crawlers discover the rest of the site and
          gives readers a clear next step. */}
      <section className="container-wide pb-20 max-w-5xl">
        <div className="border-t border-line/40 pt-8">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">
            Explore Tweaxly
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {EXPLORE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-slate-400 hover:text-white transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
