import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "roas",
  title: "ROAS",
  excerpt:
    "ROAS: Return on Ad Spend. Revenue generated per dollar of advertising. The standard efficiency metric for paid media.",
  category: "business-glossary",
  tags: ["ROAS", "Marketing Metrics", "Advertising"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Return on Ad Spend.",
    "Formula: Revenue from ads ÷ Ad spend.",
    "Quoted as: A ratio (4:1) or multiple (4x).",
    "Don't confuse with: ROI (ROAS uses revenue; ROI uses profit).",
    "Healthy range: 3-5x for most businesses; varies by margin and category.",
  ],
  faq: [
    { q: "What does ROAS stand for?", a: "Return on Ad Spend. The revenue generated per dollar of advertising spend." },
    { q: "How is ROAS calculated?", a: "ROAS = Revenue from ads ÷ Ad spend. $100K of ad spend generating $400K of revenue = 4:1 ROAS (or 4x ROAS)." },
    { q: "What's the difference between ROAS and ROI?", a: "ROAS uses revenue; ROI uses profit. ROAS is easier to calculate but less honest about actual return. A 4x ROAS with 25% gross margin = $400K revenue, $100K gross profit, $0 net after the ad spend." },
    { q: "What's a good ROAS?", a: "Depends on margin. High-margin businesses (software, services) can be healthy at 3:1. Low-margin businesses (retail, e-commerce) often need 4-6:1 just to break even after all costs." },
    { q: "How do I calculate break-even ROAS?", a: "Break-even ROAS = 1 ÷ Gross Margin. A business with 25% gross margin breaks even at 4:1 ROAS. Anything below loses money on each ad dollar." },
    { q: "Should I optimize for ROAS or volume?", a: "Both, with trade-offs. High ROAS often comes from narrow targeting (limited volume). Aggressive volume often drops ROAS. The right balance maximizes total contribution margin." },
  ],
  seo: {
    title: "ROAS - Return on Ad Spend Definition | Tweaxly",
    description: "ROAS stands for Return on Ad Spend - revenue per dollar of advertising. Plain-English definition with break-even calculation.",
    keywords: ["ROAS", "return on ad spend", "what is ROAS", "ROAS formula", "ROAS vs ROI"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The most-watched advertising efficiency metric. ROAS tells
      you how much revenue each dollar of ad spend produced -
      easy to calculate, easy to compare across campaigns, easy
      to misinterpret if you don&apos;t know what it&apos;s really
      measuring.
    </Lead>

    <DefinitionBlock term="ROAS (Return on Ad Spend)">
      revenue generated per dollar of advertising spend. Quoted
      as a ratio (4:1) or multiple (4x). Measures advertising
      efficiency at the revenue level, not the profit level.
    </DefinitionBlock>

    <Formula formula={"ROAS = Revenue from ads ÷ Ad spend\n\nBreak-Even ROAS = 1 ÷ Gross Margin"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Campaign comparison</strong> - which channels and creatives produce more revenue per dollar</li>
      <li><strong>Bid management</strong> - target ROAS thresholds drive automated bidding strategies</li>
      <li><strong>Budget allocation</strong> - shifting spend toward higher-ROAS channels</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      ROAS isn&apos;t the same as profitable advertising. A 3x ROAS on a 25% gross margin business is break-even at best. Always check against your break-even ROAS (1 ÷ gross margin).
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/roi">ROI</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cac">CAC</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/conversion-rate">Conversion Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/aov">AOV (Average Order Value)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "ROAS = Revenue from ads ÷ Ad spend.",
      "Uses revenue, not profit (unlike ROI).",
      "Healthy ROAS depends on gross margin.",
      "Break-even ROAS = 1 ÷ Gross Margin.",
    ]} />
  </>
);
