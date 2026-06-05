import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "profit-and-loss-statement",
  title: "Profit and Loss Statement (P&L)",
  excerpt:
    "Profit and Loss Statement: the report that shows whether a business made money over a period. Also called the income statement.",
  category: "business-glossary",
  tags: ["Profit and Loss", "Income Statement", "Financial Statements", "Net Profit"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-06-05",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: shows revenue, costs and profit over a period (month, quarter, year).",
    "Also called: the income statement.",
    "It reads top to bottom: revenue down to net profit, subtracting a kind of cost at each step.",
    "Key lines: gross profit (core model) and net profit (the bottom line you keep).",
    "It is earned-on-paper, not cash - profit and cash are not the same thing.",
  ],
  faq: [
    { q: "What is a profit and loss statement?", a: "A financial statement that summarises revenue, costs and profit over a period of time. It answers the question 'did the business make money?' and is also known as the income statement or P&L." },
    { q: "What is the difference between a P&L and an income statement?", a: "Nothing - they are two names for the same report. 'Profit and loss statement', 'P&L', and 'income statement' all refer to the statement that shows revenue minus costs equals profit over a period." },
    { q: "How do you read a P&L?", a: "Top to bottom. Start with revenue, subtract cost of goods sold to get gross profit, subtract operating costs to get operating profit, then subtract interest and tax to reach net profit - the bottom line." },
    { q: "What are the two most important lines on a P&L?", a: "Gross profit, which tells you whether the core model works, and net profit, which tells you what is actually left after every cost. If gross profit is thin, nothing downstream can fix it." },
    { q: "Does the P&L show how much cash I have?", a: "No. Profit is earned the moment you invoice; cash arrives when the customer pays. A profitable P&L can sit next to an empty bank account, which is why you also read the cash flow statement." },
  ],
  seo: {
    title: "Profit and Loss Statement (P&L) - Definition | Tweaxly Business Glossary",
    description: "The Profit and Loss Statement (income statement) shows revenue, costs and profit over a period. Plain English with the revenue-to-net-profit waterfall.",
    keywords: ["profit and loss statement", "P&L statement", "income statement", "what is a P&L", "profit and loss explained"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The report that answers the simplest and most important question:
      did the business make money over the period? It reads from the top
      down, subtracting a kind of cost at every step until you reach what
      you keep.
    </Lead>

    <DefinitionBlock term="Profit and Loss Statement (P&amp;L)">
      a financial statement that reports revenue, costs and profit over a
      period of time (a month, quarter or year). Also called the income
      statement.
    </DefinitionBlock>

    <Formula formula={"Revenue\n − Cost of Goods Sold = Gross Profit\n − Operating Costs   = Operating Profit\n − Interest and Tax  = Net Profit"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Profitability</strong> - is the business making money, and is the margin improving</li>
      <li><strong>Cost control</strong> - are costs growing faster than revenue</li>
      <li><strong>Trend</strong> - comparing this period against the last</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A profitable P&amp;L is not the same as money in the bank. Profit is
      earned on paper when you invoice; cash arrives only when the customer
      pays. Always read it next to the{" "}
      <ArticleLink href="/resources/business-glossary/cash-flow-statement">cash flow statement</ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/operating-profit">Operating Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-profit">Net Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/balance-sheet">Balance Sheet</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow-statement">Cash Flow Statement</ArticleLink></li>
    </ul>

    <p>
      Learn to read all three together in{" "}
      <ArticleLink href="/resources/financial-fundamentals/how-to-read-financial-statements">How to Read Your Financial Statements</ArticleLink>{" "}
      and explore{" "}
      <ArticleLink href="/resources/financial-fundamentals">Financial Fundamentals</ArticleLink>.
    </p>

    <KeyTakeaways items={[
      "Shows profit over a period; also called the income statement.",
      "Reads top to bottom: revenue down to net profit.",
      "Gross profit and net profit are the two lines that matter most.",
      "Profit is not cash - pair it with the cash flow statement.",
    ]} />
  </>
);
