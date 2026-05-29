import {
  Lead, H2, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "gross-profit",
  title: "Gross Profit",
  excerpt:
    "Gross Profit: revenue minus the direct cost of what was sold. The first profit number on a P&L and the most direct measure of product-level profitability.",
  category: "business-glossary",
  tags: ["Gross Profit", "Gross Margin", "COGS"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  tldr: [
    "Definition: Revenue minus the direct cost of producing or delivering what was sold (Cost of Goods Sold).",
    "Calculated as: Revenue − COGS. Gross margin = Gross Profit ÷ Revenue × 100%.",
    "Tells you: Whether the product or service itself is fundamentally profitable.",
    "Most useful for: Pricing decisions, customer mix analysis, margin trend monitoring.",
    "Don't confuse with: Net profit (gross profit subtracts only direct costs; net subtracts everything).",
  ],
  faq: [
    { q: "What is gross profit in plain English?", a: "What's left of your revenue after subtracting the direct cost of producing or delivering whatever you sold - the raw materials, payment processing, direct labor on the product. NOT including rent, marketing, or general overhead." },
    { q: "What's the difference between gross profit and gross margin?", a: "Gross profit is a dollar amount. Gross margin is the same number expressed as a percentage of revenue. A business with $100K revenue and $40K gross profit has a 40% gross margin." },
    { q: "What costs are included in Cost of Goods Sold (COGS)?", a: "Costs directly required to make or deliver what was sold - raw materials, payment processing fees, freight in, direct labor on production. NOT included: rent, marketing, owner salary, software subscriptions, general overhead." },
    { q: "What's a good gross margin?", a: "Depends entirely on industry. Software businesses commonly run 70-85%. Service businesses 40-60%. Retailers 25-40%. Grocery stores under 25%. Compare to your industry, not absolute numbers." },
    { q: "Can gross profit be negative?", a: "Yes - it means you're selling each unit for less than it costs to produce. That's an existential problem; no amount of volume fixes it. Either prices have to rise or production costs have to fall." },
    { q: "Why does gross margin matter more than other profit numbers?", a: "Because it's the floor. Operating costs are relatively fixed in the short term - if gross profit doesn't cover them, the business can't be profitable no matter what." },
  ],
  seo: {
    title: "Gross Profit - Definition | Tweaxly Business Glossary",
    description:
      "Gross Profit is revenue minus the direct cost of what was sold. The first profit number on a P&L and the foundation of every other profit metric.",
    keywords: [
      "gross profit",
      "gross margin",
      "gross profit definition",
      "what is gross profit",
      "COGS",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The first profit number on a profit and loss statement and
      the most direct measure of whether the product or service
      itself is profitable. If gross profit doesn&apos;t cover
      operating costs, no amount of scale or cost discipline
      elsewhere can save the business.
    </Lead>

    <DefinitionBlock term="Gross Profit">
      revenue minus the direct cost of producing or delivering
      what was sold. Those direct costs are called Cost of
      Goods Sold (COGS), Cost of Revenue, or Cost of Sales.
    </DefinitionBlock>

    <Formula
      formula={"Gross Profit = Revenue − Cost of Goods Sold (COGS)\n\nGross Margin = Gross Profit ÷ Revenue × 100%"}
    />

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Pricing decisions</strong> - is the unit
        economically viable?
      </li>
      <li>
        <strong>Margin trend monitoring</strong> - gross
        margin compression is one of the earliest signs of
        structural trouble
      </li>
      <li>
        <strong>Customer mix analysis</strong> - which
        customers or products are most profitable
      </li>
      <li>
        <strong>Industry comparison</strong> - the standard
        metric for benchmarking economic efficiency
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Comparing gross margin from one company to net margin
      from another isn&apos;t meaningful. Always confirm both
      numbers refer to the same metric before drawing
      conclusions.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">
        Gross Profit Explained
      </ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/net-profit">
          Net Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ebitda">
          EBITDA
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
          Fixed Costs vs Variable Costs (article)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/expense-growth-warning-signs">
          Expense Growth Warning Signs (article)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "Gross Profit = Revenue − COGS (direct costs).",
      "Gross Margin (percent of revenue) is the standard way to compare across businesses and periods.",
      "Healthy gross margin varies dramatically by industry.",
      "If gross profit doesn't cover operating costs, the business can't be profitable.",
    ]} />
  </>
);
