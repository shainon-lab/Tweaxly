import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "net-revenue",
  title: "Net Revenue",
  excerpt:
    "Net Revenue: gross revenue minus refunds, returns, discounts, and allowances. The honest top-line number.",
  category: "business-glossary",
  tags: ["Net Revenue", "Sales", "Revenue"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Gross revenue minus returns, refunds, discounts, and allowances.",
    "Calculated as: Gross Revenue − Returns − Refunds − Discounts.",
    "Tells you: The revenue you actually keep after customer-facing adjustments.",
    "Common in: Retail, e-commerce, and any business with material returns or promotional discounts.",
    "Most useful for: Comparing performance fairly across periods with different discount levels.",
  ],
  faq: [
    { q: "What's the difference between gross and net revenue?", a: "Gross revenue is the total billed before adjustments. Net revenue subtracts returns, refunds, discounts, and allowances - the revenue you actually retain." },
    { q: "Do I need to report net revenue?", a: "For internal management, net revenue is more honest. For external reporting, both numbers may appear - and the gap between them is itself informative." },
    { q: "Are discounts subtracted from net revenue?", a: "Yes - sales discounts (early-pay, promotional, volume) reduce gross to get net. Trade discounts negotiated at sale generally never show as gross revenue at all." },
    { q: "What about chargebacks and fraud?", a: "Treated as revenue adjustments and subtracted from gross to get net. Fraud-driven chargebacks often appear as a separate line for tracking." },
    { q: "How does net revenue relate to gross profit?", a: "Net revenue is the starting line for gross profit. Gross profit = Net revenue − Cost of Goods Sold." },
  ],
  seo: {
    title: "Net Revenue - Definition | Tweaxly Business Glossary",
    description: "Net Revenue is gross revenue minus returns, refunds, discounts, and allowances. The honest top-line number for management decisions.",
    keywords: ["net revenue", "net sales", "what is net revenue", "gross vs net revenue", "revenue adjustments"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The more honest version of revenue. While gross revenue
      counts every sale at sticker price, net revenue accounts for
      everything that came back as refunds, discounts, or
      allowances - the revenue you actually keep.
    </Lead>

    <DefinitionBlock term="Net Revenue">
      gross revenue minus returns, refunds, discounts, allowances,
      and similar customer-facing adjustments. The revenue
      genuinely retained by the business.
    </DefinitionBlock>

    <Formula formula={"Net Revenue = Gross Revenue − Returns − Refunds − Discounts − Allowances"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Honest period comparison</strong> - lets you compare a discount-heavy month to a regular one fairly</li>
      <li><strong>Starting point for gross profit</strong> - gross profit = net revenue − COGS</li>
      <li><strong>External reporting</strong> - public companies report both gross and net</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A widening gap between gross and net revenue signals rising discount levels or rising returns - either way, worth understanding.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/revenue">Revenue</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cogs">Cost of Goods Sold (COGS)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/aov">Average Order Value (AOV)</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Net Revenue = Gross Revenue − Returns, Refunds, Discounts, Allowances.",
      "More honest than gross revenue for internal decision-making.",
      "Starting point for gross profit calculation.",
      "A widening gross-to-net gap is a signal worth investigating.",
    ]} />
  </>
);
