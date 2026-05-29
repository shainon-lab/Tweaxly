// Central registry of every published article. The /resources index
// imports this to render the grid; the /resources/[category]/[slug]
// route uses it for static-params + per-article rendering; the
// /resources/[category] route uses it to list each category's
// articles.

// Existing (pre-Learning-Center) articles, migrated into the new IA.
import * as advisor   from "./ai-financial-advisor";
import * as cashFlow  from "./cash-flow-early-warning";
import * as forecast  from "./financial-forecasting-small-business-guide";
import * as signals   from "./business-signals-founders-monitor";
import * as sheets    from "./spreadsheets-not-enough";

// Financial Fundamentals
import * as revenueProfit from "./revenue-vs-profit";
import * as grossProfit   from "./gross-profit-explained";
import * as netProfit     from "./net-profit-explained";
import * as ebitda        from "./ebitda-explained";
import * as cashVsProfit  from "./cash-flow-vs-profit";

// Business Metrics & KPIs
import * as cac           from "./what-is-customer-acquisition-cost-cac";
import * as ltv           from "./what-is-customer-lifetime-value-ltv";
import * as mrr           from "./what-is-monthly-recurring-revenue-mrr";
import * as arr           from "./what-is-annual-recurring-revenue-arr";
import * as momYoy        from "./mom-vs-yoy-growth";

// Cash Flow Management
import * as whatIsCf      from "./what-is-cash-flow";
import * as improveCf     from "./how-to-improve-cash-flow";
import * as cfForecast    from "./cash-flow-forecasting";
import * as profitableNoCash from "./why-profitable-businesses-run-out-of-cash";
import * as cashReserve   from "./how-much-cash-reserve";

// Business Forecasting
import * as whatIsForecasting from "./what-is-financial-forecasting";
import * as revForecast       from "./revenue-forecasting-methods";
import * as expForecast       from "./expense-forecasting";
import * as scenarioPlanning  from "./scenario-planning-explained";
import * as forecastAccuracy  from "./how-accurate-should-a-forecast-be";

// Business Signals
import * as revenueSlowing    from "./early-signs-revenue-growth-is-slowing";
import * as expenseWarnings   from "./expense-growth-warning-signs";
import * as detectTrends      from "./detecting-business-trends-before-they-become-problems";
import * as redFlags          from "./financial-red-flags-every-owner-should-know";

import type { ArticleModule, CategoryId } from "./types";

// Order matters here - it controls the default sort on the index page.
// Featured articles bubble to the top via `meta.featured` regardless.
export const ARTICLES: ArticleModule[] = [
  { meta: advisor.meta,  Body: advisor.Body  },
  { meta: cashFlow.meta, Body: cashFlow.Body },
  { meta: forecast.meta, Body: forecast.Body },
  { meta: signals.meta,  Body: signals.Body  },
  { meta: sheets.meta,   Body: sheets.Body   },
  { meta: revenueProfit.meta, Body: revenueProfit.Body },
  { meta: grossProfit.meta,   Body: grossProfit.Body   },
  { meta: netProfit.meta,     Body: netProfit.Body     },
  { meta: ebitda.meta,        Body: ebitda.Body        },
  { meta: cashVsProfit.meta,  Body: cashVsProfit.Body  },
  { meta: cac.meta,           Body: cac.Body           },
  { meta: ltv.meta,           Body: ltv.Body           },
  { meta: mrr.meta,           Body: mrr.Body           },
  { meta: arr.meta,           Body: arr.Body           },
  { meta: momYoy.meta,        Body: momYoy.Body        },
  { meta: whatIsCf.meta,      Body: whatIsCf.Body      },
  { meta: improveCf.meta,     Body: improveCf.Body     },
  { meta: cfForecast.meta,    Body: cfForecast.Body    },
  { meta: profitableNoCash.meta, Body: profitableNoCash.Body },
  { meta: cashReserve.meta,   Body: cashReserve.Body   },
  { meta: whatIsForecasting.meta, Body: whatIsForecasting.Body },
  { meta: revForecast.meta,       Body: revForecast.Body       },
  { meta: expForecast.meta,       Body: expForecast.Body       },
  { meta: scenarioPlanning.meta,  Body: scenarioPlanning.Body  },
  { meta: forecastAccuracy.meta,  Body: forecastAccuracy.Body  },
  { meta: revenueSlowing.meta,    Body: revenueSlowing.Body    },
  { meta: expenseWarnings.meta,   Body: expenseWarnings.Body   },
  { meta: detectTrends.meta,      Body: detectTrends.Body      },
  { meta: redFlags.meta,          Body: redFlags.Body          },
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
