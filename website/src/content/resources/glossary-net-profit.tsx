import {
  Lead, H2, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "net-profit",
  title: "Net Profit",
  excerpt:
    "Net Profit: the bottom-line number after every cost is subtracted from revenue. The single number that answers \"is this business actually making money?\"",
  category: "business-glossary",
  tags: ["Net Profit", "Bottom Line", "Profitability"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  tldr: [
    "Definition: Revenue minus every cost - direct costs, operating expenses, interest, and taxes.",
    "Also called: \"Bottom line,\" net income, or net earnings.",
    "Calculated as: Revenue − COGS − Operating expenses − Interest − Taxes.",
    "Most useful for: Owner takeaway, reinvestment decisions, dividends, business valuation.",
    "Don't confuse with: Cash flow (net profit is paper earnings; cash is what's in the bank).",
  ],
  faq: [
    { q: "What's the simplest definition of net profit?", a: "The money left over after the business has paid for everything required to earn its revenue - direct costs, operating costs, interest, and taxes. The bottom line on a profit and loss statement." },
    { q: "How is net profit different from gross profit?", a: "Gross profit subtracts only direct production costs. Net profit subtracts everything - operating expenses, interest, and taxes. Net profit is always smaller than gross profit (unless you have non-operating gains)." },
    { q: "What's a good net margin?", a: "Depends on industry. Software businesses often run 15-25%. Service businesses 10-20%. Retailers 2-6%. Restaurants 3-5%. Compare to industry, not to absolute numbers." },
    { q: "Is net profit the same as cash?", a: "No. Profit is what you earned on paper; cash is what's actually in your bank account. They can differ significantly because of timing (invoices outstanding), non-cash expenses (depreciation), and balance-sheet movements (inventory, debt principal)." },
    { q: "Why is net profit called the \"bottom line\"?", a: "Because it's the last line on a profit and loss statement, after every cost has been subtracted. \"The bottom line\" became shorthand for \"the final answer.\"" },
    { q: "Can a business have positive net profit and still go bankrupt?", a: "Yes - one of the most common failure modes. Profitable on paper, broke in the bank account. Profit doesn't pay payroll; cash does." },
  ],
  seo: {
    title: "Net Profit - Definition | Tweaxly Business Glossary",
    description:
      "Net Profit is the bottom-line number after every cost is subtracted from revenue. The single number that answers whether the business makes money.",
    keywords: [
      "net profit",
      "net income",
      "bottom line",
      "net profit definition",
      "what is net profit",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most-watched profit number. Net profit is what
      a business actually kept from everything it sold, after
      every cost is paid. The final answer on whether the business
      is making money.
    </Lead>

    <DefinitionBlock term="Net Profit">
      revenue minus every cost, including direct production
      costs, operating expenses, interest payments, and taxes.
      The bottom line on a profit and loss statement (P&L).
    </DefinitionBlock>

    <Formula
      formula={"Net Profit = Revenue − COGS − Operating expenses − Interest − Taxes\n\nNet margin = Net Profit ÷ Revenue × 100%"}
    />

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Owner reinvestment</strong> - what funds growth,
        debt repayment, savings, or distributions
      </li>
      <li>
        <strong>Business valuation</strong> - sale prices are
        often quoted as a multiple of net profit (or a normalized
        version)
      </li>
      <li>
        <strong>Tax filings</strong> - the basis for income tax
      </li>
      <li>
        <strong>Lender conversations</strong> - banks evaluate
        creditworthiness against net profit trend
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Net profit is NOT cash. A business can report strong net
      profit and still run out of cash because of timing,
      working capital, and non-cash expenses. Always reconcile
      profit to cash before spending against it.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/financial-fundamentals/net-profit-explained">
        Net Profit Explained
      </ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/gross-profit">
          Gross Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ebitda">
          EBITDA
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/burn-rate">
          Burn Rate
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/runway">
          Runway
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "Net Profit = revenue minus every cost (direct, operating, interest, taxes).",
      "Also called the bottom line, net income, or net earnings.",
      "Small business net margins typically run 5-20% depending on industry.",
      "Net profit is not cash - always reconcile before spending.",
    ]} />
  </>
);
