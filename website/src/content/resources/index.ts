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
import * as readStatements from "./how-to-read-financial-statements";
import * as secondOpinion   from "./ai-second-opinion-financial-reports";

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

// Expense Management
import * as fixedVsVariable   from "./fixed-costs-vs-variable-costs";
import * as expenseCategories from "./business-expense-categories-explained";
import * as budgetBasics      from "./budget-planning-basics";
import * as costOptimization  from "./cost-optimization-strategies";
import * as hiddenCosts       from "./hidden-business-costs";

// Business Growth
import * as growthProfit      from "./growth-vs-profitability";
import * as sustainableGrowth from "./sustainable-growth-explained";
import * as whenToHire        from "./when-should-you-hire-your-next-employee";
import * as growthBottlenecks from "./common-growth-bottlenecks";
import * as scaleBusiness     from "./how-to-scale-a-small-business";

// Business Intelligence
import * as whatIsBI          from "./what-is-business-intelligence";
import * as dashboards        from "./business-dashboards-explained";
import * as leadingLagging    from "./leading-vs-lagging-indicators";

// Small Business Operations
import * as processes         from "./business-processes-explained";
import * as opsEfficiency     from "./operational-efficiency-basics";
import * as workflows         from "./workflow-optimization";
import * as teamProductivity  from "./team-productivity-metrics";
import * as delegation        from "./delegation-frameworks-for-business-owners";

// Business Glossary
import * as glossaryEbitda     from "./glossary-ebitda";
import * as glossaryArr        from "./glossary-arr";
import * as glossaryCac        from "./glossary-cac";
import * as glossaryBurnRate   from "./glossary-burn-rate";
import * as glossaryRunway     from "./glossary-runway";
import * as glossaryNetProfit  from "./glossary-net-profit";
import * as glossaryGrossProfit from "./glossary-gross-profit";
import * as glossaryMrr        from "./glossary-mrr";
import * as glossaryLtv        from "./glossary-ltv";
// Glossary batch 2
import * as glRevenue          from "./glossary-revenue";
import * as glNetRevenue       from "./glossary-net-revenue";
import * as glCashFlow         from "./glossary-cash-flow";
import * as glCogs             from "./glossary-cogs";
import * as glAr               from "./glossary-accounts-receivable";
import * as glAp               from "./glossary-accounts-payable";
import * as glOpex             from "./glossary-opex";
import * as glFixedCosts       from "./glossary-fixed-costs";
import * as glVariableCosts    from "./glossary-variable-costs";
import * as glRoi              from "./glossary-roi";
import * as glConversionRate   from "./glossary-conversion-rate";
import * as glBudget           from "./glossary-budget";
import * as glForecast         from "./glossary-forecast";
import * as glGrossMargin      from "./glossary-gross-margin";
import * as glNetMargin        from "./glossary-net-margin";
import * as glOperatingProfit  from "./glossary-operating-profit";
import * as glBreakEven        from "./glossary-break-even-point";
import * as glMom              from "./glossary-mom-growth";
import * as glYoy              from "./glossary-yoy-growth";
import * as glGrowthRate       from "./glossary-growth-rate";
import * as glChurnRate        from "./glossary-churn-rate";
import * as glRetentionRate    from "./glossary-retention-rate";
import * as glWorkingCapital   from "./glossary-working-capital";
import * as glCashReserve      from "./glossary-cash-reserve";
import * as glFcf              from "./glossary-free-cash-flow";
import * as glRoas             from "./glossary-roas";
import * as glPayback          from "./glossary-customer-payback-period";
import * as glAov              from "./glossary-aov";
import * as glCrc              from "./glossary-customer-retention-cost";
import * as glVariance         from "./glossary-variance";
import * as glScenario         from "./glossary-scenario-planning";
import * as glRevForecast      from "./glossary-revenue-forecast";
import * as glExpForecast      from "./glossary-expense-forecast";
import * as glCapex            from "./glossary-capex";
import * as glAging            from "./glossary-accounts-aging";
import * as glInventory        from "./glossary-inventory-turnover";
import * as glRunRate          from "./glossary-financial-run-rate";
import * as glDti              from "./glossary-debt-to-income-ratio";
import * as glLiquidity        from "./glossary-liquidity";
import * as glSolvency         from "./glossary-solvency";
import * as glProfRatio        from "./glossary-profitability-ratio";
// Glossary batch 3 - Financial Review feature terms
import * as glBalanceSheet     from "./glossary-balance-sheet";
import * as glPnl              from "./glossary-profit-and-loss-statement";
import * as glCashFlowStmt     from "./glossary-cash-flow-statement";
import * as glHealthScore      from "./glossary-business-health-score";
import * as glSecondOpinion    from "./glossary-financial-second-opinion";

import type { ArticleModule, CategoryId } from "./types";

// Order matters here - it controls the default sort on the index page.
// Featured articles bubble to the top via `meta.featured` regardless.
export const ARTICLES: ArticleModule[] = [
  { meta: advisor.meta,  Body: advisor.Body  },
  { meta: cashFlow.meta, Body: cashFlow.Body },
  { meta: forecast.meta, Body: forecast.Body },
  { meta: signals.meta,  Body: signals.Body  },
  { meta: sheets.meta,   Body: sheets.Body   },
  { meta: readStatements.meta, Body: readStatements.Body },
  { meta: secondOpinion.meta,  Body: secondOpinion.Body  },
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
  { meta: fixedVsVariable.meta,   Body: fixedVsVariable.Body   },
  { meta: expenseCategories.meta, Body: expenseCategories.Body },
  { meta: budgetBasics.meta,      Body: budgetBasics.Body      },
  { meta: costOptimization.meta,  Body: costOptimization.Body  },
  { meta: hiddenCosts.meta,       Body: hiddenCosts.Body       },
  { meta: growthProfit.meta,      Body: growthProfit.Body      },
  { meta: sustainableGrowth.meta, Body: sustainableGrowth.Body },
  { meta: whenToHire.meta,        Body: whenToHire.Body        },
  { meta: growthBottlenecks.meta, Body: growthBottlenecks.Body },
  { meta: scaleBusiness.meta,     Body: scaleBusiness.Body     },
  { meta: whatIsBI.meta,          Body: whatIsBI.Body          },
  { meta: dashboards.meta,        Body: dashboards.Body        },
  { meta: leadingLagging.meta,    Body: leadingLagging.Body    },
  { meta: processes.meta,         Body: processes.Body         },
  { meta: opsEfficiency.meta,     Body: opsEfficiency.Body     },
  { meta: workflows.meta,         Body: workflows.Body         },
  { meta: teamProductivity.meta,  Body: teamProductivity.Body  },
  { meta: delegation.meta,        Body: delegation.Body        },
  { meta: glossaryEbitda.meta,      Body: glossaryEbitda.Body      },
  { meta: glossaryArr.meta,         Body: glossaryArr.Body         },
  { meta: glossaryCac.meta,         Body: glossaryCac.Body         },
  { meta: glossaryBurnRate.meta,    Body: glossaryBurnRate.Body    },
  { meta: glossaryRunway.meta,      Body: glossaryRunway.Body      },
  { meta: glossaryNetProfit.meta,   Body: glossaryNetProfit.Body   },
  { meta: glossaryGrossProfit.meta, Body: glossaryGrossProfit.Body },
  { meta: glossaryMrr.meta,         Body: glossaryMrr.Body         },
  { meta: glossaryLtv.meta,         Body: glossaryLtv.Body         },
  { meta: glRevenue.meta,           Body: glRevenue.Body           },
  { meta: glNetRevenue.meta,        Body: glNetRevenue.Body        },
  { meta: glCashFlow.meta,          Body: glCashFlow.Body          },
  { meta: glCogs.meta,              Body: glCogs.Body              },
  { meta: glAr.meta,                Body: glAr.Body                },
  { meta: glAp.meta,                Body: glAp.Body                },
  { meta: glOpex.meta,              Body: glOpex.Body              },
  { meta: glFixedCosts.meta,        Body: glFixedCosts.Body        },
  { meta: glVariableCosts.meta,     Body: glVariableCosts.Body     },
  { meta: glRoi.meta,               Body: glRoi.Body               },
  { meta: glConversionRate.meta,    Body: glConversionRate.Body    },
  { meta: glBudget.meta,            Body: glBudget.Body            },
  { meta: glForecast.meta,          Body: glForecast.Body          },
  { meta: glGrossMargin.meta,       Body: glGrossMargin.Body       },
  { meta: glNetMargin.meta,         Body: glNetMargin.Body         },
  { meta: glOperatingProfit.meta,   Body: glOperatingProfit.Body   },
  { meta: glBreakEven.meta,         Body: glBreakEven.Body         },
  { meta: glMom.meta,               Body: glMom.Body               },
  { meta: glYoy.meta,               Body: glYoy.Body               },
  { meta: glGrowthRate.meta,        Body: glGrowthRate.Body        },
  { meta: glChurnRate.meta,         Body: glChurnRate.Body         },
  { meta: glRetentionRate.meta,     Body: glRetentionRate.Body     },
  { meta: glWorkingCapital.meta,    Body: glWorkingCapital.Body    },
  { meta: glCashReserve.meta,       Body: glCashReserve.Body       },
  { meta: glFcf.meta,               Body: glFcf.Body               },
  { meta: glRoas.meta,              Body: glRoas.Body              },
  { meta: glPayback.meta,           Body: glPayback.Body           },
  { meta: glAov.meta,               Body: glAov.Body               },
  { meta: glCrc.meta,               Body: glCrc.Body               },
  { meta: glVariance.meta,          Body: glVariance.Body          },
  { meta: glScenario.meta,          Body: glScenario.Body          },
  { meta: glRevForecast.meta,       Body: glRevForecast.Body       },
  { meta: glExpForecast.meta,       Body: glExpForecast.Body       },
  { meta: glCapex.meta,             Body: glCapex.Body             },
  { meta: glAging.meta,             Body: glAging.Body             },
  { meta: glInventory.meta,         Body: glInventory.Body         },
  { meta: glRunRate.meta,           Body: glRunRate.Body           },
  { meta: glDti.meta,               Body: glDti.Body               },
  { meta: glLiquidity.meta,         Body: glLiquidity.Body         },
  { meta: glSolvency.meta,          Body: glSolvency.Body          },
  { meta: glProfRatio.meta,         Body: glProfRatio.Body         },
  { meta: glBalanceSheet.meta,      Body: glBalanceSheet.Body      },
  { meta: glPnl.meta,               Body: glPnl.Body               },
  { meta: glCashFlowStmt.meta,      Body: glCashFlowStmt.Body      },
  { meta: glHealthScore.meta,       Body: glHealthScore.Body       },
  { meta: glSecondOpinion.meta,     Body: glSecondOpinion.Body     },
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
