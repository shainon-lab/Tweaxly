import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "aov",
  title: "AOV",
  excerpt:
    "AOV: Average Order Value. The average revenue per transaction. A foundational metric for any business with discrete purchases.",
  category: "business-glossary",
  tags: ["AOV", "E-commerce Metrics", "Revenue per Order"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Average Order Value.",
    "Formula: Total Revenue ÷ Number of Orders.",
    "Tells you: How much a typical customer spends per transaction.",
    "Levers: Pricing, upsell, cross-sell, bundling, minimum orders.",
    "Pairs with: Conversion rate, frequency, gross margin for full unit economics.",
  ],
  faq: [
    { q: "What's AOV?", a: "Average Order Value - the average revenue per transaction. $100K revenue from 1,000 orders = $100 AOV." },
    { q: "Why does AOV matter?", a: "It's one of three levers for revenue (visitors × conversion × AOV). Improving AOV often has higher ROI than driving more traffic because it lifts revenue without increasing CAC." },
    { q: "How can I improve AOV?", a: "Upsells, cross-sells, bundles, minimum order thresholds (free shipping over $X), product recommendations, loyalty rewards on larger orders." },
    { q: "Does higher AOV always mean more profit?", a: "Not necessarily. Discounted bundles can raise AOV while lowering margin. Always watch AOV alongside gross margin." },
    { q: "What's a good AOV?", a: "Industry-dependent. Compare to your own historical trend. A rising AOV with stable conversion is a strong signal; a rising AOV with falling conversion means you're losing price-sensitive customers." },
    { q: "How does AOV relate to LTV?", a: "AOV × purchase frequency × customer lifetime = revenue-based LTV. Multiply by gross margin to get the honest gross-profit-based LTV." },
  ],
  seo: {
    title: "AOV - Average Order Value Definition | Tweaxly",
    description: "AOV stands for Average Order Value - revenue per transaction. Plain-English definition with formula and improvement levers.",
    keywords: ["AOV", "average order value", "what is AOV", "average transaction value", "AOV formula"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The third lever of revenue growth, alongside traffic and
      conversion. AOV improvements often have better ROI than
      driving more traffic because they lift revenue without
      proportionally raising CAC.
    </Lead>

    <DefinitionBlock term="AOV (Average Order Value)">
      the average revenue per transaction, calculated as total
      revenue divided by number of orders during a period.
    </DefinitionBlock>

    <Formula formula={"AOV = Total Revenue ÷ Number of Orders"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>E-commerce optimization</strong> - the standard target for cart-level improvements</li>
      <li><strong>Pricing analysis</strong> - shows the impact of pricing changes on transaction size</li>
      <li><strong>Channel comparison</strong> - different channels often produce different AOVs</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Discount-driven AOV improvements often hurt margin. A bundle that raises AOV from $50 to $80 but drops gross margin from 50% to 35% can lower gross profit per order.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/conversion-rate">Conversion Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cac">CAC</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue">Revenue</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "AOV = Total Revenue ÷ Number of Orders.",
      "One of three revenue levers (traffic × conversion × AOV).",
      "Improvements via upsell, cross-sell, bundling, thresholds.",
      "Watch alongside gross margin - discount-driven AOV gains can hurt profit.",
    ]} />
  </>
);
