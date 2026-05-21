import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { ARTICLES, CATEGORIES } from "@/content/resources";

const DESCRIPTION =
  "Modern financial intelligence insights for business owners. Forecasting, cash flow, business signals, AI financial advisory, and financial planning - in one resource hub.";

export const metadata: Metadata = {
  title: { absolute: "Resources - Your AI Business Pulse Hub | Tweaxly" },
  description: DESCRIPTION,
  keywords: [
    "AI financial intelligence",
    "financial forecasting",
    "cash flow forecasting",
    "AI financial advisor",
    "business signals",
    "financial planning",
  ],
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resources - Your AI Business Pulse Hub | Tweaxly",
    description: DESCRIPTION,
    url: "/resources",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources - Your AI Business Pulse Hub | Tweaxly",
    description: DESCRIPTION,
  },
};

// Date formatting kept consistent across cards. The articles publish
// dates as YYYY-MM-DD; we render them as "May 20, 2026" for the UI.
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function ResourcesIndexPage() {
  // Featured first (if any), then chronological. Two featured articles
  // are surfaced in the top hero; everything else falls into the grid.
  const featured = ARTICLES.filter((a) => a.meta.featured);
  const everythingElse = ARTICLES
    .filter((a) => !a.meta.featured)
    .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));

  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="container-wide pt-10 pb-16 lg:pt-16 lg:pb-20 max-w-5xl">
        <div className="eyebrow mb-4">Financial Intelligence Hub</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Modern financial intelligence,<br className="hidden sm:inline" />{" "}
          <span className="gradient-text">written for business owners</span>.
        </h1>
        <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl">
          Practical insights on AI financial advisory, forecasting, cash flow
          intelligence, business signals, and financial planning - the
          decision-grade material a senior CFO would walk you through, if you
          had one.
        </p>
      </section>

      {/* Featured strip */}
      {featured.length > 0 ? (
        <section className="container-wide pb-12 lg:pb-16">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-4">Featured</div>
          <div className="grid lg:grid-cols-2 gap-6">
            {featured.map((a) => (
              <FeaturedCard key={a.meta.slug} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Category chips */}
      <section className="container-wide pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mr-2">Categories</span>
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="inline-flex items-center rounded-full border border-line bg-ink-900/60 px-3 py-1 text-xs text-slate-300 hover:border-brand-purple/40 hover:text-white transition"
            >
              {c.label}
            </a>
          ))}
        </div>
      </section>

      {/* Latest insights grid */}
      <section className="container-wide pb-12 lg:pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Latest Insights</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {everythingElse.map((a) => (
            <ArticleCard key={a.meta.slug} article={a} />
          ))}
        </div>
      </section>

      {/* Category sections - render every category with its articles
          listed underneath. Improves internal linking + crawl depth. */}
      {CATEGORIES.map((cat) => {
        const inCat = ARTICLES.filter((a) => a.meta.category === cat.id);
        if (inCat.length === 0) return null;
        return (
          <section key={cat.id} id={`cat-${cat.id}`} className="container-wide py-10 border-t border-line/40 scroll-mt-20">
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
              <div className="lg:col-span-1">
                <div className="eyebrow mb-3">{cat.label}</div>
                <p className="text-slate-400 text-sm leading-relaxed">{cat.blurb}</p>
              </div>
              <div className="lg:col-span-2">
                <ul className="space-y-3">
                  {inCat.map((a) => (
                    <li key={a.meta.slug} className="card hover:border-brand-purple/40 transition">
                      <Link href={`/resources/${a.meta.slug}`} className="block">
                        <div className="text-base font-semibold text-white">{a.meta.title}</div>
                        <div className="text-sm text-slate-400 mt-1 leading-relaxed">{a.meta.excerpt}</div>
                        <div className="mt-3 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-3">
                          <span>{fmtDate(a.meta.publishedAt)}</span>
                          <span>·</span>
                          <span>{a.meta.readingTime} min read</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* Newsletter CTA */}
      <section className="container-wide py-16">
        <div className="rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Get new insights as they publish
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Practical, no-fluff financial intelligence for business owners.
            New articles every other week. No noise.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact" className="btn-brand text-base px-6 py-3">Subscribe via contact form</Link>
            <a href="https://app.tweaxly.com/register" className="btn-ghost text-base px-6 py-3">Start Free</a>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeaturedCard({ article }: { article: { meta: typeof ARTICLES[number]["meta"] } }) {
  const cat = CATEGORIES.find((c) => c.id === article.meta.category);
  return (
    <Link
      href={`/resources/${article.meta.slug}`}
      className="block group relative overflow-hidden rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-6 sm:p-8 transition hover:border-brand-purple/60"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-3">{cat?.label ?? article.meta.category}</div>
      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
        {article.meta.title}
      </h3>
      <p className="mt-3 text-sm text-slate-300 leading-relaxed">
        {article.meta.excerpt}
      </p>
      <div className="mt-5 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-3">
        <span>{fmtDate(article.meta.publishedAt)}</span>
        <span>·</span>
        <span>{article.meta.readingTime} min read</span>
        <span className="ml-auto text-brand-purple group-hover:translate-x-0.5 transition">Read →</span>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: { meta: typeof ARTICLES[number]["meta"] } }) {
  const cat = CATEGORIES.find((c) => c.id === article.meta.category);
  return (
    <Link
      href={`/resources/${article.meta.slug}`}
      className="block group card hover:border-brand-purple/40 transition"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-2">{cat?.label ?? article.meta.category}</div>
      <h3 className="text-base font-semibold text-white leading-snug">{article.meta.title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">{article.meta.excerpt}</p>
      <div className="mt-4 text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-3">
        <span>{fmtDate(article.meta.publishedAt)}</span>
        <span>·</span>
        <span>{article.meta.readingTime} min</span>
        <span className="ml-auto text-brand-purple group-hover:translate-x-0.5 transition">Read →</span>
      </div>
    </Link>
  );
}
