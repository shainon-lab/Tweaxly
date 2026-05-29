// Central registry of every published article. The /resources index
// imports this to render the grid; the /resources/[category]/[slug]
// route uses it for static-params + per-article rendering; the
// /resources/[category] route uses it to list each category's
// articles.

import * as advisor   from "./ai-financial-advisor";
import * as cashFlow  from "./cash-flow-early-warning";
import * as forecast  from "./financial-forecasting-small-business-guide";
import * as signals   from "./business-signals-founders-monitor";
import * as sheets    from "./spreadsheets-not-enough";
import type { ArticleModule, CategoryId } from "./types";

// Order matters here - it controls the default sort on the index page.
// Featured articles bubble to the top via `meta.featured` regardless.
export const ARTICLES: ArticleModule[] = [
  { meta: advisor.meta,  Body: advisor.Body  },
  { meta: cashFlow.meta, Body: cashFlow.Body },
  { meta: forecast.meta, Body: forecast.Body },
  { meta: signals.meta,  Body: signals.Body  },
  { meta: sheets.meta,   Body: sheets.Body   },
];

export function getArticle(category: CategoryId, slug: string): ArticleModule | null {
  return ARTICLES.find(
    (a) => a.meta.slug === slug && a.meta.category === category,
  ) ?? null;
}

export function articlesByCategory(category: CategoryId): ArticleModule[] {
  return ARTICLES.filter((a) => a.meta.category === category);
}

// Used by /resources/[category]/[slug]/page.tsx generateStaticParams.
export function allArticleParams(): { category: string; slug: string }[] {
  return ARTICLES.map((a) => ({ category: a.meta.category, slug: a.meta.slug }));
}

// Used by /resources/[category]/page.tsx generateStaticParams.
export { CATEGORIES, getCategory, articleHref, categoryHref } from "./types";
export type { CategoryId, CategoryMeta, ArticleMeta, ArticleModule, FAQItem } from "./types";

// Related articles: same category first, then most-recent across the
// rest. Used by the bottom-of-article "Continue reading" rail.
export function relatedArticles(currentCategory: CategoryId, currentSlug: string, n = 3): ArticleModule[] {
  const sameCat = ARTICLES.filter(
    (a) => !(a.meta.slug === currentSlug && a.meta.category === currentCategory)
        && a.meta.category === currentCategory,
  );
  const others = ARTICLES
    .filter((a) => a.meta.category !== currentCategory)
    .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));
  return [...sameCat, ...others].slice(0, n);
}
