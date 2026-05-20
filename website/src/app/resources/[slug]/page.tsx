import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  ARTICLES, CATEGORIES, articleSlugs, getArticle, relatedArticles,
} from "@/content/resources";
import type { ArticleModule } from "@/content/resources/types";

// Pre-generate every article route at build time.
export function generateStaticParams() {
  return articleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Resource not found | Tweaxly" };
  const { seo, title, excerpt } = article.meta;
  const url = `/resources/${slug}`;
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
      authors: [article.meta.author.name],
      tags: article.meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    other: { "article:section": article.meta.category },
    // Defensive: also surface the excerpt for previewers that read
    // the description fallback.
    ...({ description: excerpt } as object),
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// JSON-LD Article schema lets Google render rich results (author,
// date, image, breadcrumb). Same data the on-page metadata exposes,
// in a separate machine-readable form.
function ArticleStructuredData({ article }: { article: ArticleModule }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.meta.title,
    description: article.meta.seo.description,
    datePublished: article.meta.publishedAt,
    dateModified: article.meta.publishedAt,
    author: { "@type": "Organization", name: article.meta.author.name },
    publisher: {
      "@type": "Organization",
      name: "Tweaxly",
      url: "https://tweaxly.com",
      logo: { "@type": "ImageObject", url: "https://tweaxly.com/og-image.svg" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://tweaxly.com/resources/${article.meta.slug}` },
    image: ["https://tweaxly.com/og-image.svg"],
    keywords: article.meta.seo.keywords.join(", "),
    articleSection: article.meta.category,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const cat = CATEGORIES.find((c) => c.id === article.meta.category);
  const related = relatedArticles(article.meta.slug, 3);
  const Body = article.Body;

  return (
    <main id="main-content" className="flex-1">
      <ArticleStructuredData article={article} />
      <SiteHeader />

      {/* Hero */}
      <article className="container-wide pt-10 pb-16 lg:pt-16 lg:pb-20 max-w-3xl">
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
          <Link href="/resources" className="text-brand-purple hover:underline">Resources</Link>
          <span>·</span>
          {cat ? (
            <Link href={`/resources#cat-${cat.id}`} className="hover:text-white transition">
              {cat.label}
            </Link>
          ) : <span>{article.meta.category}</span>}
        </div>
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
          <div className="ml-auto flex items-center gap-3">
            <span>{fmtDate(article.meta.publishedAt)}</span>
            <span>·</span>
            <span>{article.meta.readingTime} min read</span>
          </div>
        </div>

        {/* Body */}
        <div className="article-body mt-10">
          <Body />
        </div>

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
                  key={r.meta.slug}
                  href={`/resources/${r.meta.slug}`}
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

      {/* Final CTA */}
      <section className="container-wide pb-24 max-w-5xl">
        <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Bring AI financial intelligence to your business.
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            See how Tweaxly turns your real financial activity into forecasts,
            business signals, and plain-English answers - in real time.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <a href="https://app.tweaxly.com/register" className="btn-brand text-base px-6 py-3">Start in early access</a>
            <Link href="/resources" className="btn-ghost text-base px-6 py-3">Browse all resources →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// Silence unused-import warning if ARTICLES were imported lazily.
void ARTICLES;
