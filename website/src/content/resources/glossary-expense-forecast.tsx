import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "expense-forecast",
  title: "Expense Forecast",
  excerpt:
    "Expense Forecast: a projection of future expenses, typically split between fixed costs (predictable) and variable costs (scaling with activity).",
  category: "business-glossary",
  tags: ["Expense Forecast", "Forecasting", "Budgeting"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: A projection of future expenses by category and period.",
    "Approach: Split fixed (predictable from current run rate) from variable (ratio of revenue).",
    "Lumpy expenses: Quarterly taxes, annual renewals - plan them in the right month, not averaged.",
    "Common miss: 5-10% of expenses are usually hidden (subscription creep, renewals).",
    "Updated: Monthly with actuals; ratios recalibrated quarterly.",
  ],
  faq: [
    { q: "What's an expense forecast?", a: "A projection of future expenses by category, accounting for fixed costs (rent, salaries), variable costs (scaling with revenue), and lumpy one-offs (taxes, renewals)." },
    { q: "How do I forecast fixed costs?", a: "Current monthly run rate + known changes (new hires, lease escalations, contract renewals). Most accurate part of the forecast." },
    { q: "How do I forecast variable costs?", a: "Express as percentage of revenue (35% COGS, 3% payment processing). Forecast revenue first, apply ratios. Recalibrate ratios quarterly." },
    { q: "What are lumpy expenses?", a: "Quarterly taxes, annual insurance, software renewals, equipment purchases - they hit in specific months, not averaged out. Easy to miss; meaningful when missed." },
    { q: "What's the most common forecasting mistake?", a: "Treating all expenses as fixed. Variable costs scale with revenue and need to be modeled as ratios, not flat amounts." },
    { q: "Should I include inflation?", a: "For multi-year forecasts, yes. Add 3-5% per year to the fixed cost base. Software, rent, insurance, salaries all drift up over time." },
  ],
  seo: {
    title: "Expense Forecast - Definition | Tweaxly Business Glossary",
    description: "Expense Forecast is a projection of future expenses. Plain-English definition with fixed vs variable cost approach.",
    keywords: ["expense forecast", "what is an expense forecast", "cost forecasting", "fixed vs variable forecast", "budget forecasting"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The often-undervalued half of the financial forecast. Most
      businesses build revenue forecasts carefully and expense
      forecasts sloppily - which is exactly why their cash
      projections miss.
    </Lead>

    <DefinitionBlock term="Expense Forecast">
      a projection of future expenses by category and period.
      Built by splitting expenses into fixed (predictable from
      current run rate) and variable (scaling with revenue),
      plus lumpy one-offs in their actual months.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Cash flow projection</strong> - expenses are half the cash forecast</li>
      <li><strong>Budget setting</strong> - the forecast informs the commitments</li>
      <li><strong>Margin planning</strong> - watching expense ratios as revenue scales</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Most expense forecasts miss 5-10% to hidden costs - subscription creep, annual renewals, payroll true-ups. Build a buffer or audit annually.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/forecast">Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variable-costs">Variable Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/budget">Budget</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Expense forecast = projection of future expenses by category.",
      "Split fixed (run rate + changes) from variable (% of revenue).",
      "Don't forget lumpy expenses - they hit in specific months.",
      "Add 3-5% inflation for multi-year forecasts.",
    ]} />
  </>
);
