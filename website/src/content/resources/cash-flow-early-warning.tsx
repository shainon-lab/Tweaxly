import {
  Lead, H2, H3, Callout, PullQuote, ProductCta, ArticleLink,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-flow-problems-early-warning",
  title: "How to Detect Cash Flow Problems Before They Happen",
  excerpt:
    "Cash flow rarely fails overnight. It fails in slow, recognisable patterns. Here's how to read the warning signs months before they become a crisis.",
  category: "cash-flow-management",
  tags: ["Cash Flow Forecasting", "Financial Forecasting", "Business Signals"],
  author: { name: "Tweaxly Team", role: "Financial Intelligence" },
  publishedAt: "2026-05-20",
  readingTime: 8,
  featured: true,
  tldr: [
    "Cash flow problems rarely show up overnight - they build over months through small, recognizable patterns.",
    "The five most reliable early warnings: receivables aging out, revenue softening month over month, expenses growing faster than revenue, customer concentration drifting, and seasonal dips with no matching expense cuts.",
    "A 13-week rolling cash flow forecast catches most cash crunches with enough warning to act.",
    "Profitability on the profit & loss statement is not the same as cash in the bank - profitable businesses can still run out.",
    "The fix is operational, not financial: tighter receivables discipline, leaner fixed costs, and clearer monthly visibility.",
  ],
  faq: [
    { q: "How early can I really catch a cash flow problem?", a: "Most cash crunches telegraph themselves 60-90 days in advance through one or more of: slowing receivables, softening revenue, expense creep, or customer concentration. Weekly review of those four metrics catches almost everything in time to act." },
    { q: "Why do profitable businesses run out of cash?", a: "Timing. Profit is recognized when revenue is earned; cash arrives when customers pay. A business growing 50% can be profitable on paper but cash-strapped because every new dollar of revenue requires more working capital before the cash actually arrives." },
    { q: "What's the difference between cash flow forecasting and a budget?", a: "A budget is what you plan to spend. A cash flow forecast is what you expect to actually have in the bank, week by week or month by month. Budgets are commitments; forecasts are predictions." },
    { q: "How much cash reserve should a small business hold?", a: "A common rule of thumb is 3-6 months of fixed operating expenses. The exact number depends on revenue volatility, customer concentration, and seasonality. Highly cyclical or concentrated businesses should sit at the higher end." },
    { q: "What's the single most useful cash flow report?", a: "A 13-week rolling forecast - short enough to be accurate, long enough to give you room to act. Most cash crunches are visible at the 8-10 week mark on this report." },
  ],
  seo: {
    title: "Detect Cash Flow Problems Before They Happen | Tweaxly",
    description:
      "Spot cash flow problems months before they become a crisis. A practical guide to early warning signs, forecasting models, and modern financial visibility for SMBs.",
    keywords: [
      "cash flow forecasting",
      "cash flow analysis",
      "financial forecasting",
      "business signals",
      "early warning financial signals",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The businesses that fail on cash flow rarely fail because of a single
      bad month. They fail because three or four small patterns drifted
      together for a quarter, and nobody assembled them into one picture
      until the bank statement made it impossible to ignore.
    </Lead>

    <p>
      Cash flow forecasting isn&apos;t about predicting the future
      perfectly. It&apos;s about catching the small drifts early enough
      that the choices are still cheap. A 4% vendor cost creep noticed in
      March is a renegotiation conversation. The same creep noticed in
      September is a layoff conversation.
    </p>

    <H2 id="signs">The early warning signs that actually matter</H2>

    <p>
      Most cash crises announce themselves in advance through some
      combination of the patterns below. None of them is fatal on its own.
      Two or three together, sustained for a quarter, almost always are.
    </p>

    <H3 id="vendor-spikes">1. Vendor cost spikes</H3>

    <p>
      The classic version: a single supplier quietly raises rates 8-11%
      over six months and the line item never gets re-examined because
      it&apos;s been there forever. Real-time business signals catch this
      because they compare every recurring vendor to its own trailing
      mean, not to a budget that was set a year ago.
    </p>

    <H3 id="revenue-deceleration">2. Revenue deceleration, not revenue drop</H3>

    <p>
      A drop is easy to spot. Deceleration - revenue still growing, but
      growing 1.5% month-over-month instead of 4% - is invisible if
      you&apos;re only looking at totals. The right read is the trailing
      growth slope, not the absolute number.
    </p>

    <H3 id="expense-growth">3. Expense growth faster than revenue growth</H3>

    <p>
      If revenue is growing 3% MoM and expenses are growing 5% MoM, the
      business is heading toward a cash inflection in 4-6 months even
      though every individual month still looks fine. The ratio matters
      more than either number alone.
    </p>

    <Callout variant="warn">
      Expense growth outpacing revenue growth for three consecutive
      months is the most reliable single signal of a cash flow crisis
      forming in the next two quarters. Watch this number.
    </Callout>

    <H3 id="payroll-ratio">4. Payroll-to-revenue ratio creep</H3>

    <p>
      A healthy SMB sits in a 30-50% payroll-to-revenue band depending on
      the industry. Above 60% is risky. The danger isn&apos;t crossing
      60% in any one month - it&apos;s drifting up two percentage points
      a quarter for a year. By the time the ratio is uncomfortable, three
      to five hires are baked in and reversing the trend means letting
      people go.
    </p>

    <H3 id="missing-income">5. Missing expected income</H3>

    <p>
      If your business has predictable recurring income - retainers,
      subscriptions, scheduled invoices - the absence of an expected
      deposit is a signal. Modern cash flow analysis flags the missing
      amount the day it doesn&apos;t arrive, not at the next monthly
      reconciliation.
    </p>

    <H2 id="models">Cash flow forecasting models that actually work for SMBs</H2>

    <p>
      Enterprise FP&amp;A teams use detailed three-statement models. For
      a 5-50 person business, that complexity is a trap. The signal in
      the data isn&apos;t in the granularity - it&apos;s in three layers
      sitting on top of one another:
    </p>

    <ul>
      <li>
        <strong>Trailing baseline.</strong> The last 6-12 complete months
        of revenue, expenses, payroll, and net cash, projected forward
        with a confidence band. This is the &quot;business as-is&quot;
        line.
      </li>
      <li>
        <strong>Recurring layer.</strong> Known recurring items - rent,
        salaries, insurance, software, retainers - projected forward
        independently. These move slowly and predictably.
      </li>
      <li>
        <strong>Scenario layer.</strong> Hires, marketing changes,
        contracts, price changes, one-time costs - stacked on top of
        the baseline so you can see the consequence of each decision.
      </li>
    </ul>

    <p>
      All three are explainable. None of them are predictions in the
      lottery-ticket sense - they&apos;re structured statements of
      &quot;if nothing changes, here&apos;s where you land&quot; followed
      by &quot;and if you do X, here&apos;s the difference.&quot;
    </p>

    <PullQuote attribution="The honest framing">
      A cash flow forecast doesn&apos;t predict the future. It tells you
      which decisions still have headroom and which ones don&apos;t.
    </PullQuote>

    <H2 id="visibility">Visibility is the actual product</H2>

    <p>
      Once a month, on a closing day, isn&apos;t fast enough anymore. By
      the time a bookkeeper closes May and a meeting is scheduled to
      review it, you&apos;re halfway through June. That&apos;s six weeks
      of decisions made without current data.
    </p>

    <p>
      Modern financial intelligence platforms run the math continuously.
      The dashboard you opened this morning reflects yesterday&apos;s
      deposits, last night&apos;s card transactions, and this week&apos;s
      payroll. The forecast updates the moment a vendor invoice lands.
      Signals fire the moment a category crosses its threshold.
    </p>

    <H2 id="prevention">Preventing financial surprises</H2>

    <p>
      The pattern that works for SMB owners who never get blindsided by
      cash flow:
    </p>

    <ol>
      <li>
        <strong>One number to anchor every Monday.</strong> Cash position
        plus projected 90-day net. If the projection deteriorates two
        weeks in a row, something changed worth investigating.
      </li>
      <li>
        <strong>Three categories to watch.</strong> Top three expense
        categories by absolute size. Eighty percent of cash drift hides
        in five percent of categories.
      </li>
      <li>
        <strong>One signal feed.</strong> Real-time alerts when a vendor
        crosses its trailing average by more than 15%, when an expected
        deposit doesn&apos;t arrive, when payroll ratio creeps past a
        threshold.
      </li>
      <li>
        <strong>One forecast you trust.</strong> Updated continuously,
        with a confidence band and a list of recurring items it&apos;s
        projecting forward. Not a spreadsheet you re-open quarterly.
      </li>
    </ol>

    <ProductCta
      title="Catch cash flow risks before they catch you"
      body="Tweaxly's signals fire the moment vendor costs creep, expected income misses, or your payroll ratio drifts - on top of an always-on cash flow forecast you can drill into."
      href="https://app.tweaxly.com/register"
      cta="See your cash flow live"
    />

    <p>
      Related reading:{" "}
      <ArticleLink href="/resources/business-signals/business-signals-founders-monitor">
        Business Signals Every Founder Should Monitor
      </ArticleLink>{" "}
      and{" "}
      <ArticleLink href="/resources/business-forecasting/financial-forecasting-small-business-guide">
        Financial Forecasting for Small Businesses
      </ArticleLink>
      .
    </p>
  </>
);
