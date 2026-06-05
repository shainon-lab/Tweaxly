import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-flow-statement",
  title: "Cash Flow Statement",
  excerpt:
    "Cash Flow Statement: the report that shows where cash actually moved over a period, across operations, investing and financing.",
  category: "business-glossary",
  tags: ["Cash Flow Statement", "Financial Statements", "Cash Flow", "Liquidity"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-06-05",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: shows where cash actually moved over a period.",
    "Three sections: operating, investing, and financing activities.",
    "It reconciles profit to cash - starting from net profit and adjusting for timing.",
    "It is the statement owners skip and regret skipping.",
    "Explains how a profitable business can still run out of money.",
  ],
  faq: [
    { q: "What is a cash flow statement?", a: "A financial statement that shows where cash actually moved over a period - cash in and cash out - grouped into operating, investing and financing activities. It is the statement that tells you whether profit turned into real money." },
    { q: "What are the three sections of a cash flow statement?", a: "Operating activities (cash from the day-to-day business), investing activities (buying or selling assets), and financing activities (loans, repayments, owner contributions and dividends). Together they explain the change in the cash balance." },
    { q: "Why does the cash flow statement matter if I have a P&L?", a: "Because profit is earned on paper when you invoice, but cash arrives only when the customer pays. The cash flow statement reconciles the two and reveals timing problems the P&L hides - slow receivables, inventory, big one-off payments." },
    { q: "How can a profitable business have negative cash flow?", a: "If money is tied up in unpaid invoices, inventory, or a large one-time payment, the business can show a profit while cash leaves the account. Positive profit with negative free cash flow is a classic warning sign." },
    { q: "What is the difference between cash flow and free cash flow?", a: "Cash flow is the broad movement of money across all activities. Free cash flow is the cash left after the business pays for the investments needed to keep running - the cash genuinely available to owners or for growth." },
  ],
  seo: {
    title: "Cash Flow Statement - Definition | Tweaxly Business Glossary",
    description: "The Cash Flow Statement shows where cash actually moved across operating, investing and financing activities. Plain English with why profit is not cash.",
    keywords: ["cash flow statement", "what is a cash flow statement", "operating investing financing", "cash flow statement explained", "profit vs cash"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The statement owners skip and later regret skipping. Profit is earned
      the moment you invoice; cash arrives only when the customer pays. The
      cash flow statement is where that gap becomes visible.
    </Lead>

    <DefinitionBlock term="Cash Flow Statement">
      a financial statement that reports the actual movement of cash into
      and out of a business over a period, grouped into operating,
      investing and financing activities.
    </DefinitionBlock>

    <Formula formula={"Net Change in Cash =\n   Operating Cash Flow\n + Investing Cash Flow\n + Financing Cash Flow"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Reality check</strong> - did the period&apos;s profit turn into cash</li>
      <li><strong>Liquidity</strong> - is the operating business self-funding</li>
      <li><strong>Runway</strong> - how fast cash is being consumed or generated</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Positive profit with negative{" "}
      <ArticleLink href="/resources/business-glossary/free-cash-flow">free cash flow</ArticleLink>{" "}
      is the classic trap: the business looks healthy on the{" "}
      <ArticleLink href="/resources/business-glossary/profit-and-loss-statement">profit and loss statement</ArticleLink>{" "}
      while the bank balance falls. Something is tying up cash, usually slow
      receivables or inventory.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/free-cash-flow">Free Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/balance-sheet">Balance Sheet</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
    </ul>

    <p>
      See why this gap sinks profitable businesses in{" "}
      <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">Why Profitable Businesses Run Out of Cash</ArticleLink>{" "}
      and browse{" "}
      <ArticleLink href="/resources/cash-flow-management">Cash Flow Management</ArticleLink>.
    </p>

    <KeyTakeaways items={[
      "Shows where cash actually moved, not paper profit.",
      "Three sections: operating, investing, financing.",
      "Reconciles net profit to the change in cash.",
      "Negative free cash flow with positive profit is a red flag.",
    ]} />
  </>
);
