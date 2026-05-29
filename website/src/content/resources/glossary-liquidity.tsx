import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "liquidity",
  title: "Liquidity",
  excerpt:
    "Liquidity: the ability of a business to meet short-term obligations with cash or near-cash assets. A measure of short-term financial health.",
  category: "business-glossary",
  tags: ["Liquidity", "Cash", "Short-term Health"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "advanced",
  tldr: [
    "Definition: A business's ability to meet short-term obligations with cash or near-cash assets.",
    "Standard metrics: Current Ratio (Current Assets ÷ Current Liabilities), Quick Ratio (excludes inventory).",
    "Healthy ranges: Current Ratio > 1.5, Quick Ratio > 1.0.",
    "Different from: Solvency (long-term debt capacity).",
    "Why it matters: Liquidity crises kill businesses much faster than profitability crises.",
  ],
  faq: [
    { q: "What's liquidity in plain English?", a: "Whether the business has enough cash (or things easily turned into cash) to pay its short-term bills." },
    { q: "What's the current ratio?", a: "Current Assets ÷ Current Liabilities. Above 1.0 means assets exceed obligations; below 1.0 signals potential liquidity stress." },
    { q: "What's the quick ratio?", a: "(Current Assets − Inventory) ÷ Current Liabilities. Excludes inventory because it can't always be quickly converted to cash. Stricter measure than current ratio." },
    { q: "What's liquidity vs solvency?", a: "Liquidity is short-term: can you pay this month's bills? Solvency is long-term: are your total assets enough to cover all liabilities? A business can be solvent but illiquid (and vice versa)." },
    { q: "Why does liquidity matter?", a: "Because liquidity crises kill businesses fast. A profitable but illiquid business runs out of cash before it has time to convert profit to cash." },
    { q: "How can I improve liquidity?", a: "Collect receivables faster, hold less inventory, negotiate longer vendor terms, build cash reserves, secure a credit line as a backup." },
  ],
  seo: {
    title: "Liquidity - Definition | Tweaxly Business Glossary",
    description: "Liquidity is a business's ability to meet short-term obligations. Plain-English definition with current ratio, quick ratio.",
    keywords: ["liquidity", "what is liquidity", "current ratio", "quick ratio", "liquidity vs solvency"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The financial property that determines whether a business
      can survive the short term. Liquidity is what happens when
      profitability meets the calendar - whether the cash will
      be there when bills come due.
    </Lead>

    <DefinitionBlock term="Liquidity">
      a business&apos;s ability to meet short-term obligations
      with cash or assets that can be quickly converted to cash.
      Measured via the current ratio and quick ratio.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Short-term health assessment</strong> - can the business survive the next 3-6 months?</li>
      <li><strong>Lender evaluation</strong> - banks scrutinize liquidity ratios for credit decisions</li>
      <li><strong>Operational risk management</strong> - liquidity buffers prevent forced bad decisions</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A profitable business with poor liquidity is more fragile than an unprofitable business with strong liquidity. Profit determines long-term survival; liquidity determines short-term survival.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/solvency">Solvency</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-reserve">Cash Reserve</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-receivable">Accounts Receivable</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Liquidity = ability to meet short-term obligations.",
      "Measured by current ratio and quick ratio.",
      "Different from solvency (long-term).",
      "Liquidity crises kill businesses much faster than profitability crises.",
    ]} />
  </>
);
