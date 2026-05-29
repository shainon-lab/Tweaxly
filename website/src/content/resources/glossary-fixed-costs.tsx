import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "fixed-costs",
  title: "Fixed Costs",
  excerpt:
    "Fixed Costs: expenses that stay roughly the same regardless of how much business you do. Rent, salaries, software subscriptions, insurance.",
  category: "business-glossary",
  tags: ["Fixed Costs", "Cost Structure", "Overhead"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: Costs that stay roughly the same regardless of revenue or activity level.",
    "Examples: Rent, salaries, software subscriptions, insurance, debt service.",
    "Behavior: Don't scale up with growth; don't scale down with slowdowns.",
    "Risk: High fixed costs in a downturn are painful - bills don't shrink with revenue.",
    "Opposite of: Variable costs (which scale with activity).",
  ],
  faq: [
    { q: "What's a fixed cost?", a: "An expense that stays roughly the same regardless of how much business you do. Rent doesn't change whether you sell 100 or 1,000 units." },
    { q: "Are salaries fixed?", a: "Salaried employees are fixed. Hourly employees who scale with hours worked are variable. Most businesses have a mix." },
    { q: "Why does fixed vs variable matter?", a: "Because they behave differently when revenue changes. High-fixed-cost businesses have high operating leverage - they make more on the way up and lose more on the way down." },
    { q: "Are fixed costs really unchangeable?", a: "No. Most fixed costs are negotiable - just on a slower timeline. Rent at renewal. Software at renewal. Salaries via restructuring. The label \"fixed\" describes short-term behavior, not permanence." },
    { q: "How do I reduce fixed costs?", a: "At renewal: renegotiate. At contract end: switch vendors. Through restructuring: downsize office, consolidate roles. Plan reductions in quarters, not weeks." },
    { q: "Why do fixed costs matter in a downturn?", a: "Because they don't self-correct. Variable costs drop when revenue drops; fixed costs keep running. A downturn response that addresses only variable costs leaves the fixed base untouched." },
  ],
  seo: {
    title: "Fixed Costs - Definition | Tweaxly Business Glossary",
    description: "Fixed Costs are expenses that stay roughly the same regardless of revenue or activity. Rent, salaries, software, insurance - plain English.",
    keywords: ["fixed costs", "what are fixed costs", "fixed vs variable", "operating leverage", "overhead"],
  },
};

export const Body = () => (
  <>
    <Lead>
      One of the two cost categories every business has, alongside
      variable costs. Fixed costs are the bills that keep coming
      regardless of how busy you are - the floor your business
      has to cover before it earns anything.
    </Lead>

    <DefinitionBlock term="Fixed Costs">
      expenses that stay roughly the same regardless of revenue
      or activity level. Rent, salaries, software subscriptions,
      insurance, debt service, contracted services.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Break-even analysis</strong> - the revenue needed to cover fixed costs is the break-even point</li>
      <li><strong>Operating leverage</strong> - high fixed cost businesses amplify revenue swings into bigger profit swings</li>
      <li><strong>Cash reserve sizing</strong> - reserves typically target 3-6 months of fixed operating expenses</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Owners often treat &quot;fixed&quot; as &quot;unchangeable.&quot; It isn&apos;t. Most fixed costs are negotiable - just slower to change. Renegotiate at renewals; restructure during downturns.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/variable-costs">Variable Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/opex">Operating Expenses (OPEX)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/break-even-point">Break-Even Point</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-reserve">Cash Reserve</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cogs">Cost of Goods Sold (COGS)</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Fixed costs stay the same regardless of activity.",
      "Examples: rent, salaries, software, insurance.",
      "High fixed costs amplify both upside and downside.",
      "\"Fixed\" describes short-term behavior, not permanence - most are renegotiable.",
    ]} />
  </>
);
