import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "variable-costs",
  title: "Variable Costs",
  excerpt:
    "Variable Costs: expenses that scale up or down with activity. Cost of goods, payment processing, contractor work, shipping.",
  category: "business-glossary",
  tags: ["Variable Costs", "Cost Structure"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: Costs that scale with revenue or activity.",
    "Examples: Cost of goods, payment processing, contractor work, shipping, sales commissions.",
    "Behavior: Self-correct - they shrink when revenue shrinks, grow when revenue grows.",
    "Forecasting: Usually expressed as a percentage of revenue.",
    "Opposite of: Fixed costs (which stay the same regardless).",
  ],
  faq: [
    { q: "What's a variable cost?", a: "An expense that scales with revenue or activity. The more you sell, the more you spend on it (in roughly proportional amounts)." },
    { q: "How are variable costs forecasted?", a: "Usually as a percentage of revenue. Cost of goods at 35% of revenue. Payment processing at 3%. Revisit ratios quarterly." },
    { q: "Are variable costs always proportional to revenue?", a: "Roughly. There may be small fixed elements (a minimum monthly payment processing fee) or step-changes (a new vendor pricing tier). But the dominant behavior is proportional." },
    { q: "What's a semi-variable cost?", a: "A cost with both fixed and variable components - a base service fee plus usage-based charges. Utilities, tiered software, and some payroll have this structure." },
    { q: "Do variable costs help in a downturn?", a: "Yes - they self-correct. As revenue drops, so do variable costs. Fixed costs don't, which is why downturns are harder for fixed-cost-heavy businesses." },
    { q: "Should I prefer variable over fixed costs?", a: "Depends on stage. Higher variable costs mean lower operating leverage - you give up some upside in exchange for downside protection. Mature businesses often shift toward fixed costs as they scale." },
  ],
  seo: {
    title: "Variable Costs - Definition | Tweaxly Business Glossary",
    description: "Variable Costs scale with activity - cost of goods, payment processing, contractor work. Plain-English definition with examples.",
    keywords: ["variable costs", "what are variable costs", "fixed vs variable", "cost behavior", "scaling costs"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The cost category that breathes with the business. Variable
      costs grow when you grow and shrink when you shrink - which
      makes them easier to forecast and a natural shock absorber
      in downturns.
    </Lead>

    <DefinitionBlock term="Variable Costs">
      expenses that scale up or down with revenue or activity
      level. Cost of goods, payment processing fees, contractor
      work, shipping, hourly labor, sales commissions.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Forecasting</strong> - expressed as a percentage of revenue and projected as revenue grows</li>
      <li><strong>Contribution margin</strong> - revenue minus variable costs = contribution margin per unit</li>
      <li><strong>Pricing analysis</strong> - knowing variable cost per unit informs minimum viable pricing</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A drifting variable cost ratio (cost of goods rising from 35% to 38% of revenue, for example) is one of the most reliable early warnings of margin compression.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cogs">Cost of Goods Sold (COGS)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/break-even-point">Break-Even Point</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/opex">Operating Expenses (OPEX)</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Variable costs scale with activity.",
      "Examples: cost of goods, payment processing, contractor work.",
      "Forecasted as a percentage of revenue.",
      "Self-correct in downturns; expand in growth.",
    ]} />
  </>
);
