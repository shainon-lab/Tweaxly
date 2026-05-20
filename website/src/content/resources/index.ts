// Central registry of every published article. The /resources index
// imports this to render the grid; the /resources/[slug] route uses
// it for static-params + per-article rendering.

import * as advisor   from "./ai-financial-advisor";
import * as cashFlow  from "./cash-flow-early-warning";
import * as forecast  from "./financial-forecasting-small-business-guide";
import * as signals   from "./business-signals-founders-monitor";
import * as sheets    from "./spreadsheets-not-enough";
import type { ArticleModule } from "./types";

// Order matters here - it controls the default sort on the index page.
// Featured articles bubble to the top via `meta.featured` regardless.
export const ARTICLES: ArticleModule[] = [
  { meta: advisor.meta,  Body: advisor.Body  },
  { meta: cashFlow.meta, Body: cashFlow.Body },
  { meta: forecast.meta, Body: forecast.Body },
  { meta: signals.meta,  Body: signals.Body  },
  { meta: sheets.meta,   Body: sheets.Body   },
];

export function getArticle(slug: string): ArticleModule | null {
  return ARTICLES.find((a) => a.meta.slug === slug) ?? null;
}

export function articleSlugs(): string[] {
  return ARTICLES.map((a) => a.meta.slug);
}

export function relatedArticles(currentSlug: string, n = 3): ArticleModule[] {
  // Same-category first, fill the rest with most-recent by date.
  const current = getArticle(currentSlug);
  if (!current) return ARTICLES.slice(0, n);
  const sameCat = ARTICLES.filter(
    (a) => a.meta.slug !== currentSlug && a.meta.category === current.meta.category,
  );
  const others = ARTICLES
    .filter((a) => a.meta.slug !== currentSlug && a.meta.category !== current.meta.category)
    .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));
  return [...sameCat, ...others].slice(0, n);
}

export { CATEGORIES } from "./types";
export type { CategoryId, ArticleMeta, ArticleModule } from "./types";
