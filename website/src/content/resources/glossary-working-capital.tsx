import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "working-capital",
  title: "Working Capital",
  excerpt:
    "Working Capital: current assets minus current liabilities. The short-term liquidity buffer a business operates within.",
  category: "business-glossary",
  tags: ["Working Capital", "Liquidity", "Balance Sheet"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Current Assets minus Current Liabilities.",
    "Components: AR + Inventory + Cash − AP − Short-term debt − Accrued expenses.",
    "Tells you: Short-term liquidity position.",
    "Growing business: Usually consumes working capital before generating it.",
    "Cash Conversion Cycle: Days Inventory + Days Sales Outstanding − Days Payable Outstanding.",
  ],
  faq: [
    { q: "What's working capital?", a: "Current assets minus current liabilities - the money tied up in day-to-day operations of the business. Positive working capital means short-term assets exceed short-term obligations." },
    { q: "What's positive vs negative working capital?", a: "Positive: more current assets than liabilities (a cushion). Negative: more current liabilities than assets - can be concerning (cash strain) or strategic (using vendor credit aggressively)." },
    { q: "Why does fast growth consume working capital?", a: "Every new dollar of revenue requires inventory, payroll, and other working capital before the cash arrives. Growth ties up cash before generating it." },
    { q: "What's the cash conversion cycle?", a: "Days Inventory + Days Sales Outstanding − Days Payable Outstanding. The total days cash is tied up in operations. Shorter = better." },
    { q: "How can I improve working capital?", a: "Collect faster (lower DSO), pay slower (higher DPO), hold less inventory (lower DIO). Each shortens the cash conversion cycle." },
    { q: "Is more working capital always better?", a: "No. Excessive working capital often means inefficient cash management - too much cash in AR, inventory, or low-yield accounts. Optimal = enough buffer, no more." },
  ],
  seo: {
    title: "Working Capital - Definition | Tweaxly Business Glossary",
    description: "Working Capital is current assets minus current liabilities - the short-term liquidity buffer. Plain English with cash conversion cycle.",
    keywords: ["working capital", "what is working capital", "cash conversion cycle", "current assets", "DSO DPO DIO"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The cash and short-term assets tied up in running the
      business day-to-day. Working capital is the buffer between
      revenue earned and cash collected, between expenses incurred
      and payments due.
    </Lead>

    <DefinitionBlock term="Working Capital">
      current assets minus current liabilities. The capital tied
      up in the day-to-day operations of the business -
      receivables, inventory, and cash, less payables and
      short-term debt.
    </DefinitionBlock>

    <Formula formula={"Working Capital = Current Assets − Current Liabilities\n\nCash Conversion Cycle = Days Inventory Outstanding + Days Sales Outstanding − Days Payable Outstanding"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Liquidity assessment</strong> - can the business meet short-term obligations?</li>
      <li><strong>Growth planning</strong> - how much working capital will growth require?</li>
      <li><strong>Cash management</strong> - identifying where cash is tied up</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Working capital needs grow with the business. A business doubling revenue typically needs to roughly double its working capital - which has to come from operations, debt, or equity.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-receivable">Accounts Receivable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-payable">Accounts Payable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-reserve">Cash Reserve</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Working Capital = Current Assets − Current Liabilities.",
      "Cash tied up in day-to-day operations.",
      "Growth consumes working capital before generating it.",
      "Cash conversion cycle: shorter = more efficient.",
    ]} />
  </>
);
