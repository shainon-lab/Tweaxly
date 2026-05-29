import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "variance",
  title: "Variance",
  excerpt:
    "Variance: the difference between budgeted (or forecasted) numbers and actuals. The starting point of management decision-making.",
  category: "business-glossary",
  tags: ["Variance", "Variance Analysis", "Reporting"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: The difference between expected (budget or forecast) and actual results.",
    "Two flavors: Favorable variance (better than expected) and unfavorable variance (worse).",
    "Reviewed: Monthly as part of budget review.",
    "Purpose: Diagnose which assumptions were wrong, decide what to adjust.",
    "Tip: Quantify, decompose, identify the assumption, update forward.",
  ],
  faq: [
    { q: "What's variance?", a: "The difference between what you expected (in budget or forecast) and what actually happened." },
    { q: "What's favorable vs unfavorable variance?", a: "Favorable: actuals better than budget (revenue higher, expenses lower). Unfavorable: actuals worse than budget. \"Better\" depends on the metric and direction." },
    { q: "What's variance analysis?", a: "The discipline of comparing actuals to budget, explaining the difference, and updating assumptions for forward periods. Done monthly during budget review." },
    { q: "Why does variance matter?", a: "It's where budget discipline pays back. A budget without variance review is theater; with it, you diagnose what's working, what's not, and which assumptions to revise." },
    { q: "How do I decompose variance?", a: "Was it volume (how much sold)? Price (per unit)? Mix (which products)? Timing (right amount, wrong period)? Each cause has different implications." },
    { q: "What if variance is consistent?", a: "Consistent variance in one direction means the budget assumption is structurally wrong - recalibrate, don't just absorb." },
  ],
  seo: {
    title: "Variance - Definition | Tweaxly Business Glossary",
    description: "Variance is the difference between expected and actual results. The starting point of management decision-making.",
    keywords: ["variance", "variance analysis", "what is variance", "budget variance", "favorable variance"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The starting point of every meaningful management
      conversation about results. Variance answers two
      questions at once: what was the gap between expectation
      and reality, and which assumption was wrong?
    </Lead>

    <DefinitionBlock term="Variance">
      the difference between expected results (budget or
      forecast) and actual results. Favorable variance means
      actuals beat expectations; unfavorable means actuals
      missed.
    </DefinitionBlock>

    <Formula formula={"Variance ($) = Actual − Budget\nVariance (%) = (Actual − Budget) ÷ Budget × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Monthly review</strong> - the structured conversation about what hit and what missed</li>
      <li><strong>Assumption recalibration</strong> - which inputs need updating?</li>
      <li><strong>Owner accountability</strong> - the basis for ownership conversations</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Single-month variance is often noise. Two months of variance in the same direction is signal. Three months means assumption recalibration.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/budget">Budget</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/forecast">Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/expense-forecast">Expense Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/scenario-planning">Scenario Planning</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Variance = Actual − Budget (or Forecast).",
      "Favorable = better than expected. Unfavorable = worse.",
      "Reviewed monthly to recalibrate assumptions.",
      "Single-month variance is usually noise; trends are signal.",
    ]} />
  </>
);
