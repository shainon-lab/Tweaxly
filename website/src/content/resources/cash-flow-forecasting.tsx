import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-flow-forecasting",
  title: "Cash Flow Forecasting for Small Businesses",
  excerpt:
    "A cash flow forecast projects what your bank balance will look like over the coming weeks and months. Here's how to build one that actually catches problems in time.",
  category: "cash-flow-management",
  tags: ["Cash Flow Forecasting", "Cash Planning", "Working Capital"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 7,
  tldr: [
    "A cash flow forecast projects expected cash in and out, week by week, for the next 13 weeks (or longer for longer-cycle businesses).",
    "Most cash crunches are visible 6-10 weeks before they happen on a properly-built forecast.",
    "Forecast cash in (from receivables aging + expected new sales) separately from cash out (recurring bills + scheduled payments + one-offs).",
    "Update weekly with actuals. The accuracy of the forecast comes from the discipline of revisiting, not from initial precision.",
    "Pair the forecast with a clear plan for what you'll do if cash dips below a threshold - the forecast is only useful if it triggers action.",
  ],
  faq: [
    { q: "How far out should I forecast cash?", a: "13 weeks (about 3 months) is the standard for most businesses - short enough to be accurate, long enough to give you room to react. Longer-cycle businesses extend to 26 or 52 weeks." },
    { q: "Should I forecast in weeks or months?", a: "Weekly for the first 13 weeks. The bills don't average out within a month; lumpy expenses landing in the same week cause cash crunches that monthly forecasts hide." },
    { q: "How accurate should the forecast be?", a: "Within ±10% on operating cash flow at 4-6 weeks out is realistic. Beyond 8 weeks, ±20% is normal. Accuracy comes from updating weekly with actuals, not from initial precision." },
    { q: "What's the biggest source of forecast error?", a: "Receivables timing. Customers paying later than expected is the most common gap. Build your forecast on historical pay patterns, not on invoice terms." },
    { q: "Do I need software for cash flow forecasting?", a: "No. A spreadsheet works fine for most small businesses. Dedicated tools earn their cost when you have many revenue streams, multiple entities, or need scenario modeling." },
    { q: "What should trigger action on the forecast?", a: "Set a threshold: \"if cash dips below $X at any week in the forecast, I act.\" Pre-decide what action you'll take (collect receivables aggressively, defer non-critical expenses, draw on credit). The forecast is only useful if it triggers something." },
  ],
  seo: {
    title: "Cash Flow Forecasting for Small Businesses | Tweaxly",
    description:
      "A cash flow forecast projects expected cash in and out over coming weeks. Plain-English guide to building one, updating it, and using it to catch problems early.",
    keywords: [
      "cash flow forecasting",
      "cash flow forecast",
      "13 week cash flow",
      "rolling cash flow forecast",
      "cash flow planning",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most useful financial discipline a small business
      can adopt is a 13-week rolling cash flow forecast, updated
      weekly. Done well, it catches most cash crunches with weeks of
      warning, makes timing decisions visible before they hit, and
      replaces gut-feel cash management with something you can
      actually plan against.
    </Lead>

    <DefinitionBlock term="Cash flow forecast">
      a projection of expected cash inflows and outflows over a
      future period - week by week or month by month - that
      produces a running projected bank balance over time.
    </DefinitionBlock>

    <H2 id="why-13-weeks">Why 13 weeks</H2>

    <p>
      Three months is the sweet spot for most businesses. Shorter
      and you can&apos;t see far enough to act on the warning;
      longer and the forecast accuracy degrades to the point where
      it&apos;s no longer trustworthy.
    </p>

    <p>
      Businesses with longer cycles (construction projects,
      seasonal manufacturers) extend to 26 or 52 weeks at the cost
      of less accuracy at the far end. Businesses with short cycles
      (restaurants, fast-turn retail) sometimes shorten to 8 weeks.
      The principle is the same: forecast as far out as you can
      with usable accuracy.
    </p>

    <H2 id="what-goes-in">What goes into a forecast</H2>

    <p>
      A useful forecast separates cash in from cash out, with
      enough line-item detail to identify what&apos;s driving each
      week.
    </p>

    <H3>Cash in</H3>

    <ul>
      <li>
        <strong>Receivables collections</strong> - existing
        invoices, scheduled by expected pay date (use historical pay
        patterns, not invoice terms)
      </li>
      <li>
        <strong>Expected new sales</strong> - forecasted revenue
        that will become receivables, with realistic conversion
        timing
      </li>
      <li>
        <strong>Recurring receipts</strong> - subscription revenue,
        contracts on retainer
      </li>
      <li>
        <strong>Financing / other</strong> - planned loan draws,
        investor money, asset sales, tax refunds
      </li>
    </ul>

    <H3>Cash out</H3>

    <ul>
      <li>
        <strong>Payroll</strong> - by pay date, including payroll
        taxes
      </li>
      <li>
        <strong>Recurring expenses</strong> - rent, utilities,
        software subscriptions, insurance
      </li>
      <li>
        <strong>Vendor payables</strong> - by scheduled pay date
      </li>
      <li>
        <strong>Debt service</strong> - loan principal + interest
      </li>
      <li>
        <strong>Taxes</strong> - quarterly estimates, payroll
        taxes, sales taxes
      </li>
      <li>
        <strong>Capital expenditures</strong> - scheduled equipment
        and asset purchases
      </li>
      <li>
        <strong>Owner distributions</strong> - planned draws or
        dividends
      </li>
    </ul>

    <H3>Running balance</H3>

    <p>
      Starting cash + Cash in − Cash out = Ending cash. The next
      week starts from that ending balance.
    </p>

    <Formula
      formula={"Week N ending cash = Week N starting cash + Week N expected cash in − Week N expected cash out\n\nWeek N+1 starting cash = Week N ending cash"}
    />

    <H2 id="receivables-timing">The receivables-timing problem</H2>

    <p>
      The single biggest source of forecast error is when customers
      will actually pay. Most owners forecast by invoice terms
      (&quot;net-30 means they&apos;ll pay in 30 days&quot;).
      Reality is messier - actual pay patterns vary by customer,
      industry, and economic environment.
    </p>

    <p>
      Build your forecast from historical pay patterns:
    </p>

    <ul>
      <li>
        For each customer (or customer segment), calculate average
        days from invoice to payment over the last 6-12 months.
      </li>
      <li>
        Use that historical average for forecasting, not the
        invoice terms.
      </li>
      <li>
        For your largest customers, build a per-customer pay schedule -
        they affect the forecast disproportionately.
      </li>
    </ul>

    <p>
      A useful sanity check: total receivables ÷ average daily
      revenue ≈ Days Sales Outstanding. If your forecast assumes
      faster collection than your historical DSO, it&apos;s
      optimistic.
    </p>

    <H2 id="rolling-update">Make it rolling and update weekly</H2>

    <p>
      The forecast is alive, not a one-time exercise. Each week:
    </p>

    <ol>
      <li>
        <strong>Drop last week</strong> from the front.
      </li>
      <li>
        <strong>Add a new week</strong> at the back (so you always
        have 13 weeks ahead).
      </li>
      <li>
        <strong>Update actuals</strong> for what actually happened
        last week.
      </li>
      <li>
        <strong>Revise assumptions</strong> on anything you got
        materially wrong.
      </li>
      <li>
        <strong>Add new items</strong> that came in (a big invoice
        sent, a new contract signed, an unexpected bill).
      </li>
    </ol>

    <p>
      The discipline of weekly update is what makes the forecast
      accurate over time. A perfectly-built forecast that gets
      revisited monthly is worse than a sloppy one revisited
      weekly.
    </p>

    <Callout variant="info" title="The 15-minute habit">
      Once you have the template built, the weekly update is
      usually 15-20 minutes. That tiny weekly investment is the
      most leveraged financial habit a small business owner can
      build.
    </Callout>

    <H2 id="thresholds-actions">Set thresholds and pre-decide actions</H2>

    <p>
      A forecast without a plan is just a number on a screen. For
      every forecast, set a clear threshold: &quot;if my projected
      cash dips below $X at any point in the next 13 weeks, I
      act.&quot;
    </p>

    <p>
      Pre-decide your actions in priority order:
    </p>

    <ol>
      <li>Aggressive receivables follow-up on anything past due</li>
      <li>Defer non-critical expenses (new hires, new equipment)</li>
      <li>Stretch payables to maximum without damaging relationships</li>
      <li>Draw on a credit line if one exists</li>
      <li>Have the financing-options conversation early, not late</li>
    </ol>

    <p>
      Pre-deciding removes the &quot;what do I do now?&quot;
      paralysis that hits when cash dips suddenly. The forecast
      tells you when; the playbook tells you what.
    </p>

    <H2 id="common-mistakes">Common forecasting mistakes</H2>

    <H3>1. Building it once, never updating it</H3>

    <p>
      The most common failure mode. A four-month-old forecast is
      mostly fiction.
    </p>

    <H3>2. Forecasting receivables by invoice terms</H3>

    <p>
      Customers pay on their schedule, not yours. Use historical
      pay patterns.
    </p>

    <H3>3. Aggregating to monthly</H3>

    <p>
      Hides week-to-week pinch points. Payroll lands in specific
      weeks; quarterly taxes land in specific weeks. Monthly
      forecasts average them out invisibly.
    </p>

    <H3>4. Optimism on conversion timing</H3>

    <p>
      Deals signed today turn into receivables next month, not
      this week. Be honest about the lag.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/cash-flow-management/what-is-cash-flow">
          What Is Cash Flow
        </ArticleLink>{" "}
        - foundational definitions.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/how-to-improve-cash-flow">
          How to Improve Cash Flow
        </ArticleLink>{" "}
        - the levers to pull when the forecast flashes red.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - what a forecast protects against.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/what-is-financial-forecasting">
          What Is Financial Forecasting
        </ArticleLink>{" "}
        - the broader practice cash flow forecasting sits inside.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-problems-early-warning">
          How to Detect Cash Flow Problems Before They Happen
        </ArticleLink>{" "}
        - the early warning signs visible on the forecast.
      </li>
    </ul>

    <KeyTakeaways items={[
      "13-week rolling cash forecast is the standard for most small businesses.",
      "Forecast cash in (receivables + new sales) separately from cash out (bills + scheduled payments).",
      "Use historical pay patterns, not invoice terms, for receivables timing.",
      "Update weekly with actuals - that's where accuracy comes from.",
      "Set thresholds and pre-decide actions: \"if cash drops below $X, I do Y.\"",
      "The 15-minute weekly update is one of the most leveraged habits a small business can build.",
    ]} />
  </>
);
