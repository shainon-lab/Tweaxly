import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "break-even-point",
  title: "Break-Even Point",
  excerpt:
    "Break-Even Point: the level of revenue (or units sold) at which a business covers all its costs and starts generating profit.",
  category: "business-glossary",
  tags: ["Break-Even", "Cost Structure", "Planning"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: The revenue (or unit volume) at which total revenue equals total costs - zero profit, zero loss.",
    "Formula: Break-Even Revenue = Fixed Costs ÷ Contribution Margin (where contribution margin = 1 − variable cost ratio).",
    "Tells you: How much you must sell just to cover costs.",
    "Below it: Losing money. Above it: Each additional dollar contributes to profit.",
    "Most useful for: Pricing decisions, startup viability, downturn planning.",
  ],
  faq: [
    { q: "What's break-even?", a: "The point at which revenue exactly covers costs - the business neither makes nor loses money. Below it, you're losing money; above it, you're profitable." },
    { q: "How is break-even calculated?", a: "Break-Even Revenue = Fixed Costs ÷ (1 − Variable Cost Ratio). Example: $40K fixed costs, 35% variable cost ratio. Contribution margin = 65%. Break-even = $40K ÷ 0.65 = $61.5K revenue." },
    { q: "What's the difference between break-even revenue and break-even units?", a: "Same concept, different denominator. Break-Even Units = Fixed Costs ÷ (Price per Unit − Variable Cost per Unit). Useful when you sell discrete units at a known price." },
    { q: "What's contribution margin?", a: "Revenue minus variable costs, per unit (or as a percentage). Represents the contribution each sale makes toward covering fixed costs." },
    { q: "Why does break-even matter?", a: "It tells you the minimum scale required for the business to work. If your forecast doesn't get above break-even, the model needs to change - pricing, cost structure, or both." },
    { q: "How does break-even change with growth?", a: "Fixed costs usually grow with the business (more space, more staff). Break-even rises in step. The discipline of tracking it as fixed costs grow keeps the math honest." },
  ],
  seo: {
    title: "Break-Even Point - Definition | Tweaxly Business Glossary",
    description: "Break-Even Point is the revenue at which a business covers all costs. Plain-English definition with formula and examples.",
    keywords: ["break-even point", "what is break-even", "break-even formula", "contribution margin", "break-even analysis"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The most basic viability test of any business: how much do
      we need to sell just to cover our costs? Above break-even,
      every dollar of incremental revenue starts contributing to
      profit. Below it, you&apos;re losing money on every sale.
    </Lead>

    <DefinitionBlock term="Break-Even Point">
      the level of revenue (or unit volume) at which total
      revenue equals total costs - the business neither makes
      nor loses money. Below this point: a loss. Above:
      profit.
    </DefinitionBlock>

    <Formula formula={"Break-Even Revenue = Fixed Costs ÷ Contribution Margin\n\nWhere Contribution Margin = 1 − (Variable Cost ÷ Revenue)\n\nExample: $40K fixed costs, 65% contribution margin. Break-even = $40K ÷ 0.65 = $61.5K revenue."} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Pricing decisions</strong> - shows the impact of price changes on the required volume</li>
      <li><strong>Startup viability</strong> - is reaching break-even realistic with current assumptions?</li>
      <li><strong>Downturn planning</strong> - how far can revenue drop before you&apos;re losing money?</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Break-even doesn&apos;t account for cash timing. A business at break-even on the P&L can still have cash flow problems because of receivables and working capital.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variable-costs">Variable Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/operating-profit">Operating Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/scenario-planning">Scenario Planning</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Break-even = revenue where total revenue covers total costs.",
      "Formula: Fixed Costs ÷ Contribution Margin.",
      "Above break-even, every dollar contributes to profit.",
      "Doesn't account for cash timing - a P&L break-even can still have cash gaps.",
    ]} />
  </>
);
