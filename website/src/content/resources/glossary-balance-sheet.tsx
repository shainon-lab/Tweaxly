import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "balance-sheet",
  title: "Balance Sheet",
  excerpt:
    "Balance Sheet: a snapshot on a single day of what a business owns and owes. Assets always equal liabilities plus equity.",
  category: "business-glossary",
  tags: ["Balance Sheet", "Financial Statements", "Assets", "Liabilities"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-06-05",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: a snapshot of assets, liabilities and equity on one date.",
    "The rule: Assets = Liabilities + Equity. The two sides always balance.",
    "Assets: what you own (cash, receivables, inventory, equipment).",
    "Liabilities: what you owe (suppliers, loans, tax, credit cards).",
    "Equity: what is left for the owners after subtracting liabilities from assets.",
  ],
  faq: [
    { q: "What is a balance sheet?", a: "A financial statement that shows what a business owns (assets), what it owes (liabilities), and the owners' stake (equity) on a single date. Unlike the profit and loss statement, which covers a period, the balance sheet is a photograph of one moment." },
    { q: "Why does a balance sheet always balance?", a: "Because every asset is funded either by money owed to others (liabilities) or by the owners (equity). Assets = Liabilities + Equity is an accounting identity, so the two sides are always equal by construction." },
    { q: "What should an owner look at first on a balance sheet?", a: "How much of the assets is actually cash versus tied up, how much is owed in the short term, and whether equity is growing year over year. A strong business with almost no cash on the balance sheet is worth watching closely." },
    { q: "What is the difference between a balance sheet and a P&L?", a: "The profit and loss statement shows whether you made money over a period. The balance sheet shows what you own and owe at one point in time. You need both: one is the movie, the other is the still frame." },
    { q: "What are current vs non-current items?", a: "Current assets and liabilities are due to turn into or out of cash within a year (receivables, inventory, payables). Non-current items are longer term (equipment, long-term loans). The split tells you about short-term liquidity." },
  ],
  seo: {
    title: "Balance Sheet - Definition | Tweaxly Business Glossary",
    description: "Balance Sheet is a single-day snapshot of assets, liabilities and equity. Plain English with the Assets = Liabilities + Equity rule.",
    keywords: ["balance sheet", "what is a balance sheet", "assets liabilities equity", "balance sheet explained", "financial statements"],
  },
};

export const Body = () => (
  <>
    <Lead>
      A photograph of the business taken on the last day of a period. The
      balance sheet lists everything the business owns and everything it
      owes, and the two sides always equal each other.
    </Lead>

    <DefinitionBlock term="Balance Sheet">
      a financial statement that reports a business&apos;s assets,
      liabilities and equity at a single point in time. It answers the
      question &quot;what does the business own and owe right now?&quot;
    </DefinitionBlock>

    <Formula formula={"Assets = Liabilities + Equity\n\nEquity = Assets − Liabilities"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Liquidity check</strong> - how much of the assets is cash versus tied up</li>
      <li><strong>Solvency check</strong> - can the business cover what it owes</li>
      <li><strong>Net worth</strong> - whether equity is growing year over year</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A healthy profit and loss statement can sit next to a fragile balance
      sheet. Strong profit with almost no cash, a pile of slow{" "}
      <ArticleLink href="/resources/business-glossary/accounts-receivable">accounts receivable</ArticleLink>, or heavy short-term debt are all things the
      profit line will not show you - which is exactly why a second read
      matters.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/profit-and-loss-statement">Profit and Loss Statement</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow-statement">Cash Flow Statement</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-payable">Accounts Payable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
    </ul>

    <p>
      For the full walkthrough, read{" "}
      <ArticleLink href="/resources/financial-fundamentals/how-to-read-financial-statements">How to Read Your Financial Statements</ArticleLink>{" "}
      and browse{" "}
      <ArticleLink href="/resources/financial-fundamentals">Financial Fundamentals</ArticleLink>.
    </p>

    <KeyTakeaways items={[
      "Assets = Liabilities + Equity, always.",
      "A snapshot on one date, not a period.",
      "Read it for cash, short-term debt, and equity trend.",
      "Pairs with the P&L and the cash flow statement.",
    ]} />
  </>
);
