import {
  Lead, H2, H3, Callout, PullQuote, ProductCta, ArticleLink,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "how-to-read-financial-statements",
  title: "How to Read Your Financial Statements (Without an Accounting Degree)",
  excerpt:
    "A plain-English guide to the three financial statements your accountant gives you - the profit & loss, the balance sheet, and the cash flow statement - and how to read them in ten minutes.",
  category: "financial-fundamentals",
  tags: ["Financial Statements", "Balance Sheet", "Profit and Loss", "Cash Flow Statement"],
  author: { name: "Tweaxly Team", role: "Financial Intelligence" },
  publishedAt: "2026-06-05",
  readingTime: 10,
  featured: true,
  tldr: [
    "Your accountant gives you three statements: the profit & loss (did you make money?), the balance sheet (what you own and owe), and the cash flow statement (where the cash actually went).",
    "The profit & loss runs top to bottom: revenue, minus cost of goods sold equals gross profit, minus operating costs equals operating profit, minus interest and tax equals net profit.",
    "The balance sheet is a snapshot on one day: assets on one side, liabilities and equity on the other, and the two always balance.",
    "A business can be profitable on the profit & loss and still run out of cash - which is why the cash flow statement matters as much as the other two.",
    "You don't need to read every line. Five numbers and three ratios tell you most of what you need to know in about ten minutes.",
  ],
  faq: [
    { q: "What are the three main financial statements?", a: "The profit & loss statement (also called the income statement), the balance sheet, and the cash flow statement. The profit & loss shows whether you made money over a period; the balance sheet shows what you own and owe on a single day; the cash flow statement shows where the cash actually moved." },
    { q: "Which financial statement should I look at first?", a: "Start with the profit & loss to see if the business is profitable, then the cash flow statement to confirm the profit turned into cash, then the balance sheet to check what you own and owe. Most problems show up in the gap between profit and cash." },
    { q: "What is the difference between gross profit and net profit?", a: "Gross profit is revenue minus the direct cost of delivering your product or service. Net profit is what's left after every other cost - operating expenses, interest and tax. Gross profit tells you if the core model works; net profit tells you what you actually keep." },
    { q: "Can a profitable business run out of cash?", a: "Yes, easily. Profit is earned on paper when you invoice; cash arrives when the customer pays. If receivables are slow, inventory ties up money, or a big tax bill lands, a profitable business can still be short on cash in any given month." },
    { q: "Do I need an accountant if I can read these statements myself?", a: "Yes. Reading the statements helps you run the business and ask better questions; an accountant prepares them correctly, handles tax and compliance, and gives professional advice. The two are complementary, not a substitute for each other." },
  ],
  seo: {
    title: "How to Read Your Financial Statements | Tweaxly",
    description:
      "A plain-English guide to reading the profit & loss, balance sheet, and cash flow statement your accountant gives you - and the five numbers that matter most.",
    keywords: [
      "how to read financial statements",
      "understand financial statements",
      "balance sheet explained",
      "profit and loss statement",
      "cash flow statement explained",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Once a year, your accountant hands you a tidy PDF and a polite nod. Inside
      are three statements that describe your entire business in numbers - and
      almost none of it is written for the person who has to make decisions from
      it. Here is how to read all three in about ten minutes, without an
      accounting degree.
    </Lead>

    <p>
      Every set of financial statements contains the same three documents. Each
      answers a different question, and you need all three because no single one
      tells the whole story.
    </p>

    <ul>
      <li><strong>The profit &amp; loss statement</strong> - did the business make money over the period?</li>
      <li><strong>The balance sheet</strong> - what does the business own and owe right now?</li>
      <li><strong>The cash flow statement</strong> - where did the cash actually go?</li>
    </ul>

    <H2 id="profit-and-loss">The profit &amp; loss statement</H2>

    <p>
      The profit &amp; loss statement (also called the income statement) reads
      top to bottom, and each line subtracts a kind of cost until you reach what
      you keep. Start at the top with{" "}
      <ArticleLink href="/resources/business-glossary/cash-flow">revenue</ArticleLink>
      {" "}- the money you earned - and work down:
    </p>

    <ul>
      <li>
        Revenue minus the direct cost of delivering your product (
        <ArticleLink href="/resources/business-glossary/cogs">cost of goods sold</ArticleLink>
        ) equals{" "}
        <ArticleLink href="/resources/business-glossary/gross-profit">gross profit</ArticleLink>.
      </li>
      <li>
        Gross profit minus your operating costs (rent, payroll, software,
        marketing) equals{" "}
        <ArticleLink href="/resources/business-glossary/operating-profit">operating profit</ArticleLink>.
      </li>
      <li>
        Operating profit minus interest and tax equals{" "}
        <ArticleLink href="/resources/business-glossary/net-profit">net profit</ArticleLink>
        {" "}- the bottom line you actually keep.
      </li>
    </ul>

    <p>
      Two numbers matter most here. Gross profit tells you whether the core model
      works; if it is thin, nothing downstream can save you. Net profit tells you
      what is left after everything. For a deeper look at why these are not the
      same as the cash in your account, read{" "}
      <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">Revenue vs Profit</ArticleLink>
      {" "}and{" "}
      <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">Gross Profit Explained</ArticleLink>.
    </p>

    <Callout variant="info">
      You may also see{" "}
      <ArticleLink href="/resources/business-glossary/ebitda">EBITDA</ArticleLink>{" "}
      - earnings before interest, tax, depreciation and amortization. In plain
      English it is roughly operating profit before the accounting adjustments.
      It is useful for comparing businesses, but it is not cash, so don&apos;t
      treat it as money in the bank.
    </Callout>

    <H2 id="balance-sheet">The balance sheet</H2>

    <p>
      The balance sheet is a photograph taken on the last day of the period. It
      has two sides, and they always equal each other:
    </p>

    <ul>
      <li><strong>Assets</strong> - what the business owns: cash, money customers owe you, equipment, inventory, investments.</li>
      <li><strong>Liabilities</strong> - what the business owes: suppliers, loans, tax, credit cards.</li>
      <li><strong>Equity</strong> - what is left for the owners after subtracting liabilities from assets.</li>
    </ul>

    <p>
      The relationship is simple: assets equal liabilities plus equity. When you
      read a balance sheet, look at three things: how much of your assets is
      actually cash versus tied up elsewhere, how much you owe in the short term,
      and whether equity is growing year over year. A business with strong{" "}
      <ArticleLink href="/resources/business-glossary/gross-margin">gross margin</ArticleLink>{" "}
      but almost no cash on the balance sheet is a business to watch closely.
    </p>

    <H2 id="cash-flow">The cash flow statement</H2>

    <p>
      The cash flow statement is the one owners skip and regret skipping. Profit
      is earned on paper the moment you invoice; cash arrives only when the
      customer pays. The cash flow statement reconciles the two - it starts from
      net profit and adjusts for the timing differences to show where money
      actually moved across operations, investing and financing.
    </p>

    <p>
      This is why a profitable business can still run out of money. If your{" "}
      <ArticleLink href="/resources/business-glossary/free-cash-flow">free cash flow</ArticleLink>{" "}
      is negative while your profit is positive, something is tying up cash -
      slow receivables, inventory, or a large one-off payment. We cover this gap
      in detail in{" "}
      <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">Cash Flow vs Profit</ArticleLink>{" "}
      and{" "}
      <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">Why Profitable Businesses Run Out of Cash</ArticleLink>.
    </p>

    <H2 id="ten-minutes">How to read all three in ten minutes</H2>

    <p>
      You do not need to read every line. Pull five numbers and three quick
      checks:
    </p>

    <H3>The five numbers</H3>
    <ul>
      <li>Revenue, and whether it grew or shrank versus last year.</li>
      <li>Gross profit and net profit, and the margins they imply.</li>
      <li>Cash on the balance sheet.</li>
      <li>Short-term liabilities (what is due soon).</li>
      <li>Equity, and whether it moved up or down.</li>
    </ul>

    <H3>The three checks</H3>
    <ul>
      <li>Did profit turn into cash, or is the cash flow statement telling a different story?</li>
      <li>How much of your assets is liquid versus locked up?</li>
      <li>Are costs growing faster than revenue?</li>
    </ul>

    <PullQuote attribution="The honest version">
      You don&apos;t need to become an accountant. You need to read three pages
      well enough to know which two questions to ask the one you already have.
    </PullQuote>

    <ProductCta
      title="Turn your accountant's report into a plain-English review"
      body="Upload your financial statements and Tweaxly's Financial Review gives you a business health score, a second opinion, the questions to ask your CPA, and an action plan - in under two minutes."
      href="https://app.tweaxly.com/register"
      cta="Try Financial Review"
    />

    <p>
      Once you can read the statements, the next step is getting a structured
      second read on them - see{" "}
      <ArticleLink href="/resources/business-intelligence/ai-second-opinion-financial-reports">How to Get a Second Opinion on Your Financial Reports</ArticleLink>{" "}
      and the{" "}
      <ArticleLink href="/features/financial-review">Financial Review feature</ArticleLink>.
      For the underlying vocabulary, browse{" "}
      <ArticleLink href="/resources/financial-fundamentals">Financial Fundamentals</ArticleLink>{" "}
      and{" "}
      <ArticleLink href="/resources/cash-flow-management">Cash Flow Management</ArticleLink>.
    </p>
  </>
);
