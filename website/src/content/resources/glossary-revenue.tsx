import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "revenue",
  title: "Revenue",
  excerpt:
    "Revenue is the total money a business takes in from selling its products or services before any costs are subtracted. Also called the \"top line.\"",
  category: "business-glossary",
  tags: ["Revenue", "Sales", "Top Line"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: Total money a business takes in from sales before any costs are subtracted.",
    "Also called: Sales, gross sales, or the \"top line.\"",
    "Recognized: When the sale happens (invoice sent), not when cash is collected.",
    "Don't confuse with: Profit (revenue minus costs) or cash (what's actually in the bank).",
    "It tells you: How big the business is, not how healthy it is.",
  ],
  faq: [
    { q: "What's the simplest definition of revenue?", a: "Total money your business takes in from selling its products or services, before any costs are subtracted." },
    { q: "Is revenue the same as sales?", a: "In most small businesses, yes - they're used interchangeably. Larger businesses sometimes separate operating revenue from non-operating revenue (interest, asset sales)." },
    { q: "Is revenue the same as cash?", a: "No. Revenue is recognized when a sale happens; cash arrives when the customer pays. A business can have $100K of revenue this month but only $40K of cash if customers haven't paid yet." },
    { q: "Why is revenue called the \"top line\"?", a: "Because it's the first line at the top of a profit and loss statement. \"Top line growth\" means revenue is growing, regardless of profit." },
    { q: "Should I focus on revenue or profit?", a: "Both. Revenue tells you how big the business is. Profit tells you how healthy it is. Growing revenue without growing profit is just expensive activity." },
    { q: "What about returns and refunds?", a: "They're subtracted to get to \"net revenue\" - the actual revenue retained after refunds, discounts, and allowances." },
  ],
  seo: {
    title: "Revenue - Definition | Tweaxly Business Glossary",
    description: "Revenue is the total money a business takes in from sales before costs. Also called sales or the top line. Plain-English definition.",
    keywords: ["revenue", "what is revenue", "sales revenue", "top line", "revenue definition"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The first number on a profit and loss statement, and the one
      that gets quoted most often. Revenue tells you the size of
      the business - it doesn&apos;t tell you anything about its
      health.
    </Lead>

    <DefinitionBlock term="Revenue">
      the total amount of money a business takes in from selling
      its products or services over a period, before any costs
      are subtracted. Sometimes called sales, gross sales, or the
      &quot;top line.&quot;
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Business size</strong> - the headline number used to compare businesses</li>
      <li><strong>Growth rate</strong> - revenue growth year-over-year is the most-tracked growth metric</li>
      <li><strong>Margin calculations</strong> - gross margin, net margin, and most ratios use revenue as the denominator</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      High revenue with no profit is common. A restaurant grossing $2M can still close because food, rent, payroll and utilities ate every dollar. Revenue without profit is just expensive activity.
    </p>
    <p>
      For the full distinction, see{" "}
      <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">Revenue vs Profit</ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/net-revenue">Net Revenue</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-profit">Net Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Revenue = total money in from sales, before costs.",
      "Also called sales or the top line.",
      "Recognized when sale happens, not when cash is collected.",
      "Revenue measures size, not health. Profit measures health.",
    ]} />
  </>
);
