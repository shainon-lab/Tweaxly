import {
  Lead, H2, H3, Callout, ArticleLink,
  ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "how-accurate-should-a-forecast-be",
  title: "How Accurate Should a Forecast Be?",
  excerpt:
    "Forecast accuracy degrades fast with distance. Here are realistic accuracy targets by horizon, and what \"accurate enough to act on\" really means.",
  category: "business-forecasting",
  tags: ["Forecast Accuracy", "Forecasting", "Planning"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "Accuracy targets by horizon: 1 month: ±5%, 3 months: ±10%, 6 months: ±15%, 12 months: ±20-25%, 24+ months: directional only.",
    "Forecasts get less accurate with distance - the goal isn't precision at 18 months, it's understanding the shape.",
    "Accuracy comes from updating monthly with actuals, not from initial precision.",
    "A forecast that's 90% accurate but never updated is worse than one that's 70% accurate and revised weekly.",
    "Diagnose misses by component (which assumption was wrong?), not just by total variance.",
  ],
  faq: [
    { q: "Is ±10% accurate enough?", a: "For a 3-month forecast, yes - it's the realistic standard for most small businesses. For 12+ months, ±15-25% is normal and acceptable. Beyond 24 months, treat forecasts as directional rather than precise." },
    { q: "How do I improve forecast accuracy?", a: "Update monthly with actuals. State assumptions explicitly so you can diagnose misses. Track which forecast components are most error-prone. Most accuracy improvement comes from revising assumptions, not from better initial math." },
    { q: "Should the forecast match the budget?", a: "No. The forecast is your honest prediction; the budget is your commitment. They'll usually disagree slightly. Manage to the budget; track against the forecast for early signals." },
    { q: "What's variance analysis?", a: "Comparing actual results to forecast (or budget) and explaining the difference. Done well, it identifies which assumption was wrong - and that's where forecasting improvement comes from." },
    { q: "Should I publish my forecast?", a: "Internal yes - the team plans better when they understand the projection. External (investors, lenders) depends on accuracy track record. Bad forecasts shared externally hurt credibility." },
    { q: "When is a forecast too pessimistic vs too optimistic?", a: "Look at the historical hit rate. If you've missed forecast in the same direction for 3+ months running, the systematic bias needs correcting - not the forecast." },
  ],
  seo: {
    title: "How Accurate Should a Forecast Be? | Tweaxly",
    description:
      "Realistic forecast accuracy targets by horizon. ±10% at 3 months, ±20% at 12 months. How to use forecasts when they're not perfectly accurate.",
    keywords: [
      "forecast accuracy",
      "forecast variance",
      "how accurate should a forecast be",
      "variance analysis",
      "forecasting precision",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Owners often abandon forecasting after one bad miss. The
      fundamental misunderstanding: a forecast doesn&apos;t need to
      be precise to be useful - it needs to be calibrated. Knowing
      what accuracy is realistic at each horizon turns forecasting
      from a frustrating exercise into a reliable planning tool.
    </Lead>

    <H2 id="accuracy-targets">Realistic accuracy targets by horizon</H2>

    <ComparisonTable
      caption="Forecast accuracy targets for small business revenue"
      columns={["Realistic accuracy", "What to use it for"]}
      rows={[
        { label: "1 month out", cells: ["±5%", "Cash management, operational decisions"] },
        { label: "3 months out", cells: ["±10%", "Hiring decisions, marketing budget"] },
        { label: "6 months out", cells: ["±15%", "Strategic planning, capacity decisions"] },
        { label: "12 months out", cells: ["±20-25%", "Annual planning, board updates"] },
        { label: "24+ months out", cells: ["Directional only", "Vision, fundraising, long-term capital"] },
      ]}
    />

    <p>
      These are revenue accuracy targets - some line items (recurring
      revenue, contracted) are easier to predict; some (one-off
      deals, marketing-driven sales) are harder. Set tighter targets
      for predictable line items, looser for the volatile ones.
    </p>

    <H2 id="why-accuracy-degrades">Why accuracy degrades with distance</H2>

    <p>
      Three reasons forecasts get fuzzier the farther out you go:
    </p>

    <ul>
      <li>
        <strong>Compounding uncertainty.</strong> A 5% miss at month
        1 compounds with another 5% miss at month 2. By month 6, the
        ranges spread significantly.
      </li>
      <li>
        <strong>Decision freedom.</strong> Six months from now, you
        might have made decisions (a new hire, a price change, a
        new market) that your current forecast doesn&apos;t reflect.
      </li>
      <li>
        <strong>Market drift.</strong> Customer behavior, competitor
        actions, and economic conditions all change over time, and
        each one&apos;s direction is hard to predict.
      </li>
    </ul>

    <p>
      You can&apos;t outwork these forces with better models. The
      right response is to forecast tighter at short horizons and
      treat long horizons as directional.
    </p>

    <H2 id="accuracy-comes-from-updating">Accuracy comes from updating</H2>

    <p>
      The biggest misconception about forecast accuracy: that it
      comes from building a better initial model. It doesn&apos;t.
      It comes from revising assumptions as new information arrives.
    </p>

    <p>
      A forecast built once and not updated becomes increasingly
      wrong every month. A forecast revised monthly with actuals
      stays approximately right because the assumptions that were
      wrong get corrected.
    </p>

    <Callout variant="info" title="The discipline rule">
      Update the forecast monthly with actuals, even if you don&apos;t
      revise the assumptions. The act of slotting in actuals
      surfaces the misses that need investigation.
    </Callout>

    <H2 id="variance-analysis">Variance analysis: diagnosing misses</H2>

    <p>
      When the forecast misses, the question isn&apos;t whether
      it was wrong - it&apos;s which assumption was wrong. That&apos;s
      what variance analysis answers.
    </p>

    <p>
      For each material variance:
    </p>

    <ul>
      <li>
        <strong>Quantify</strong> - dollar amount and percentage
      </li>
      <li>
        <strong>Decompose</strong> - was it volume? Price? Timing?
        Mix?
      </li>
      <li>
        <strong>Identify the assumption</strong> - what specifically
        did we assume that turned out wrong?
      </li>
      <li>
        <strong>Update going forward</strong> - revise the forecast
        for the corrected assumption
      </li>
    </ul>

    <p>
      Done monthly, variance analysis turns the forecast into a
      learning loop. Each month&apos;s actuals improve next
      month&apos;s assumptions.
    </p>

    <H2 id="systematic-bias">Watch for systematic bias</H2>

    <p>
      A forecast that misses in the same direction repeatedly has a
      structural problem, not a precision problem.
    </p>

    <ul>
      <li>
        <strong>Consistently too optimistic on revenue</strong> -
        the input forecast is biased. Tighten the assumption.
      </li>
      <li>
        <strong>Consistently too low on expenses</strong> - the
        expense base has hidden items. Audit and adjust.
      </li>
      <li>
        <strong>Consistently late on timing</strong> - sales cycle
        is longer than forecast. Lengthen the build.
      </li>
    </ul>

    <p>
      Three consecutive misses in the same direction is a signal
      to recalibrate, not just to revise.
    </p>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Treating accuracy as the goal</H3>

    <p>
      The goal of forecasting is better decisions, not precise
      predictions. A 90% accurate forecast that doesn&apos;t change
      any decisions is less valuable than a 70% accurate one that
      catches a cash problem early.
    </p>

    <H3>2. Adding precision where it doesn&apos;t exist</H3>

    <p>
      Forecasting revenue at $1,234,567 implies false precision.
      Round to meaningful figures. &quot;$1.2M ± 15%&quot; is more
      honest and more useful.
    </p>

    <H3>3. Hiding misses</H3>

    <p>
      Optimistic owners often revise the forecast downward to
      match underperformance, masking the original miss. The
      original miss is the signal worth investigating.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-forecasting/what-is-financial-forecasting">
          What Is Financial Forecasting
        </ArticleLink>{" "}
        - the foundational concept.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/revenue-forecasting-methods">
          Revenue Forecasting Methods
        </ArticleLink>{" "}
        - the methods that affect achievable accuracy.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/scenario-planning-explained">
          Scenario Planning Explained
        </ArticleLink>{" "}
        - using ranges instead of single numbers.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/leading-vs-lagging-indicators">
          Leading vs Lagging Indicators
        </ArticleLink>{" "}
        - what to watch to catch forecast misses early.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/financial-forecasting-small-business-guide">
          Financial Forecasting for Small Businesses
        </ArticleLink>{" "}
        - the broader guide.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Realistic accuracy degrades with distance: ±5% at 1 month, ±10% at 3, ±20-25% at 12, directional beyond 24.",
      "Accuracy comes from monthly updates, not from better initial math.",
      "Variance analysis (diagnosing misses by component) is where forecasting improvement comes from.",
      "Watch for systematic bias - missing in the same direction repeatedly means assumptions need recalibration.",
      "Forecast precision shouldn't exceed reality. Round to meaningful figures.",
      "The goal is better decisions, not perfect predictions.",
    ]} />
  </>
);
