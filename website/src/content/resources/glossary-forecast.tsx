import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "forecast",
  title: "Forecast",
  excerpt:
    "Forecast: a projection of future business performance based on current data and stated assumptions. Different from a budget.",
  category: "business-glossary",
  tags: ["Forecast", "Forecasting", "Planning"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: A projection of what future revenue, expenses, profit, or cash will look like.",
    "Distinct from: A budget (forecast is a prediction; budget is a commitment).",
    "Horizons: Short-term (1-3 months), medium (3-12), long-term (1-3 years).",
    "Accuracy targets: ±10% at 3 months, ±20% at 12 months, directional beyond 24.",
    "Updated: Monthly with actuals. The discipline matters more than initial precision.",
  ],
  faq: [
    { q: "What's a forecast?", a: "A projection of future business performance based on current data, history, and stated assumptions. Predicts what will happen, not what you commit to." },
    { q: "What's the difference between a forecast and a budget?", a: "Budget = commitment to spend. Forecast = prediction of what will happen. Most businesses need both - the budget enforces discipline, the forecast tracks reality." },
    { q: "How far out should I forecast?", a: "Maintain three: short-term (1-3 months) at weekly resolution for operations, medium (3-12 months) for tactical decisions, long-term (1-3 years) for strategic planning." },
    { q: "How accurate should the forecast be?", a: "±5-10% at 1-3 months. ±15-20% at 6-12 months. Beyond 12 months, treat as directional rather than precise." },
    { q: "How often should I update the forecast?", a: "Monthly. After actuals close, plug them in, revise assumptions, re-project forward. The discipline of updating beats initial precision." },
    { q: "Should I forecast just revenue?", a: "No. Complete forecasts cover revenue, expenses, profit, AND cash flow. Revenue-only forecasts miss the most important constraint - cash." },
  ],
  seo: {
    title: "Forecast - Definition | Tweaxly Business Glossary",
    description: "A forecast projects future business performance based on current data and assumptions. Distinct from a budget. Plain English.",
    keywords: ["forecast", "what is a forecast", "forecast vs budget", "business forecast", "financial forecasting"],
  },
};

export const Body = () => (
  <>
    <Lead>
      Every meaningful business decision rests on some kind of
      forecast - what revenue will look like, what expenses will
      grow to, how cash will track. Forecasts that are revised
      monthly are useful; the ones that aren&apos;t are fairy
      tales.
    </Lead>

    <DefinitionBlock term="Forecast">
      a projection of future business performance (revenue,
      expenses, profit, cash) based on current data, historical
      patterns, and explicit assumptions about what will change.
      A prediction, not a commitment.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Decision support</strong> - can we afford this hire, this investment, this expansion?</li>
      <li><strong>Cash flow planning</strong> - 13-week rolling forecast catches cash crunches early</li>
      <li><strong>Scenario analysis</strong> - building multiple forecasts under different assumptions</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A forecast without explicit assumptions is just numbers. When reality differs, the diagnosis is &quot;which assumption was wrong&quot; - and that&apos;s only answerable if assumptions were stated.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/budget">Budget</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/expense-forecast">Expense Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/scenario-planning">Scenario Planning</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variance">Variance</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Forecast = prediction of future performance.",
      "Distinct from a budget (commitment to spend).",
      "Three horizons: 1-3 months, 3-12 months, 1-3 years.",
      "Update monthly. Discipline matters more than initial precision.",
    ]} />
  </>
);
