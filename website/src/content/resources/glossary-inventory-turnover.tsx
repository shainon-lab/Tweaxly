import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "inventory-turnover",
  title: "Inventory Turnover",
  excerpt:
    "Inventory Turnover: how many times inventory sells through over a period. The standard efficiency metric for any business holding stock.",
  category: "business-glossary",
  tags: ["Inventory Turnover", "Inventory Management", "Efficiency"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: How many times inventory is sold and replaced over a period.",
    "Formula: Cost of Goods Sold ÷ Average Inventory.",
    "Tells you: How efficiently inventory is being managed.",
    "Higher = better: Less cash tied up in stock; more efficient operations.",
    "Industry varies: Grocery 12-24x/year, retail 4-8x, manufacturing 2-6x.",
  ],
  faq: [
    { q: "What's inventory turnover?", a: "The number of times your inventory is sold and replaced over a period. A turnover of 6 means you sell through inventory 6 times per year." },
    { q: "How is it calculated?", a: "Inventory Turnover = Cost of Goods Sold ÷ Average Inventory. Average inventory is typically (Beginning + Ending) ÷ 2." },
    { q: "What's a good turnover rate?", a: "Industry-dependent. Grocery 12-24x/year. General retail 4-8x. Specialty retail 2-4x. Manufacturing 2-6x. Compare to industry, not absolute." },
    { q: "What does \"days inventory outstanding\" mean?", a: "365 ÷ Inventory Turnover = Days Inventory Outstanding (DIO). The average days inventory sits before being sold. Higher turnover = lower DIO." },
    { q: "Why does turnover matter?", a: "Inventory ties up cash. Higher turnover means less working capital locked up, less risk of obsolescence, faster cash conversion cycle." },
    { q: "Can turnover be too high?", a: "Yes - very high turnover can mean understocking and missed sales. Watch turnover alongside stockouts." },
  ],
  seo: {
    title: "Inventory Turnover - Definition | Tweaxly Business Glossary",
    description: "Inventory Turnover is how many times inventory sells through over a period. The standard efficiency metric for businesses holding stock.",
    keywords: ["inventory turnover", "inventory turnover ratio", "what is inventory turnover", "days inventory outstanding", "DIO"],
  },
};

export const Body = () => (
  <>
    <Lead>
      For any business holding stock, the single most important
      efficiency metric. Inventory turnover tells you whether
      your inventory is selling fast enough to justify the cash
      tied up in it.
    </Lead>

    <DefinitionBlock term="Inventory Turnover">
      the number of times inventory is sold and replaced during
      a period, calculated as Cost of Goods Sold divided by
      average inventory.
    </DefinitionBlock>

    <Formula formula={"Inventory Turnover = COGS ÷ Average Inventory\n\nDays Inventory Outstanding (DIO) = 365 ÷ Inventory Turnover"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Working capital management</strong> - lower inventory = more cash freed up</li>
      <li><strong>Operational efficiency</strong> - higher turnover usually means better demand planning</li>
      <li><strong>Stockout risk</strong> - very high turnover may signal under-investment in inventory</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Slow-moving inventory ties up cash and often loses value over time (obsolescence, fashion changes, expiration). The bottom 20% of SKUs by velocity often represent 50%+ of locked-up cash.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cogs">COGS</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-aging">Accounts Aging</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Inventory Turnover = COGS ÷ Average Inventory.",
      "Higher = better (less cash tied up).",
      "Days Inventory Outstanding = 365 ÷ Turnover.",
      "Slow movers are usually 50%+ of locked-up cash.",
    ]} />
  </>
);
