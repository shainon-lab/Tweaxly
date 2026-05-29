import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "budget",
  title: "Budget",
  excerpt:
    "Budget: a planned commitment to spend specific amounts in each category over a defined period. Distinct from a forecast.",
  category: "business-glossary",
  tags: ["Budget", "Planning", "Financial Discipline"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: A planned commitment to spend specific amounts in each category over a defined period.",
    "Distinct from: A forecast (prediction). A budget is a commitment; a forecast is a prediction.",
    "Built: Annually, usually category by category with explicit assumptions.",
    "Reviewed: Monthly against actuals (variance analysis).",
    "Owners: Every category should have a single named owner.",
  ],
  faq: [
    { q: "What's a budget vs a forecast?", a: "A budget is what you decide to spend - a commitment. A forecast is what you predict will happen - a projection. Most businesses need both." },
    { q: "How often should I update the budget?", a: "Re-baseline annually. Revise mid-year only when something material changes (new line of business, major customer change). Constant tweaking defeats the discipline." },
    { q: "Who should own each budget category?", a: "Single owner per category - the person responsible for the spend. Shared ownership produces shared responsibility, which produces no responsibility." },
    { q: "How granular should the budget be?", a: "By category and by month at minimum. By line item within categories only where decisions get made at that level." },
    { q: "What's variance?", a: "The difference between budget and actuals. Variance analysis identifies which assumption was wrong - that's where budget discipline pays back." },
    { q: "What if I miss the budget?", a: "Diagnose, don't just absorb. Was the assumption wrong (revise budget)? Was discipline weak (tighten execution)? Was something unexpected (one-off or pattern)?" },
  ],
  seo: {
    title: "Budget - Definition | Tweaxly Business Glossary",
    description: "A budget is a planned commitment to spend specific amounts by category over a period. Distinct from a forecast. Plain English.",
    keywords: ["budget", "what is a budget", "budget vs forecast", "annual budget", "business budget"],
  },
};

export const Body = () => (
  <>
    <Lead>
      A budget done well disciplines spending and surfaces
      variance for review. A budget done badly is spreadsheet
      wallpaper - set once, never revisited, ignored after month
      three.
    </Lead>

    <DefinitionBlock term="Budget">
      a planned commitment to spend a specific amount in each
      category over a defined period (usually a year), used to
      discipline spending decisions and surface variance for
      monthly review.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Spending discipline</strong> - the constraint that prevents drift</li>
      <li><strong>Resource allocation</strong> - clarifies what gets funded vs deferred</li>
      <li><strong>Variance review</strong> - monthly comparison surfaces what's working vs not</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A budget without monthly review provides no value beyond the initial planning exercise. Discipline comes from revisiting, not from setting.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/forecast">Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variance">Variance</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/scenario-planning">Scenario Planning</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/expense-forecast">Expense Forecast</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Budget = commitment to spend. Distinct from a forecast.",
      "Built annually with explicit assumptions per category.",
      "Reviewed monthly against actuals (variance analysis).",
      "Single owner per category. Discipline comes from monthly review.",
    ]} />
  </>
);
