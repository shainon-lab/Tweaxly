import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-financial-forecasting",
  title: "What Is Financial Forecasting?",
  excerpt:
    "Financial forecasting projects what your business numbers will look like in the future. The right horizon, methods, and accuracy expectations for small businesses.",
  category: "business-forecasting",
  tags: ["Financial Forecasting", "Planning", "Budgets"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 7,
  tldr: [
    "Financial forecasting projects your future revenue, expenses, profit, and cash based on what you know today.",
    "Three horizons matter: short-term (1-3 months, operational), medium-term (3-12 months, tactical), long-term (1-3 years, strategic).",
    "Forecasts get less accurate with distance. Aim for ±10% at 3 months, ±20% at 6-12 months, and treat 2+ year projections as directional.",
    "The discipline of updating monthly matters more than the precision of any single forecast.",
    "Forecasts are NOT budgets. A budget is what you commit to spending; a forecast is what you predict will happen.",
  ],
  faq: [
    { q: "What's the difference between a forecast and a budget?", a: "A budget is a commitment (what you intend to spend). A forecast is a prediction (what you expect will happen). Most businesses need both - the budget anchors decisions, the forecast tracks reality." },
    { q: "How far out should I forecast?", a: "Short-term (1-3 months) at weekly resolution for operations. Medium-term (3-12 months) at monthly resolution for tactical decisions. Long-term (1-3 years) at quarterly resolution for strategic planning." },
    { q: "Do I need fancy software?", a: "No. A clear spreadsheet with explicit assumptions outperforms expensive software with hidden ones. Discipline beats tooling." },
    { q: "How accurate should the forecast be?", a: "For 3 months out, ±10% on revenue is realistic for most small businesses. At 6-12 months, ±15-20% is normal. Beyond 12 months, treat the forecast as directional - it tells you the shape of the future, not the exact numbers." },
    { q: "How often should I update the forecast?", a: "Monthly is the right cadence for most businesses. After actuals close, plug them in, revise assumptions, and re-project forward." },
    { q: "What should I forecast besides revenue?", a: "Always pair revenue with expenses (especially variable ones), cash flow (timing matters), and at least one operational driver (headcount, units, customers) so the forecast reflects the actual business." },
  ],
  seo: {
    title: "What Is Financial Forecasting? | Tweaxly",
    description:
      "Financial forecasting projects your future revenue, expenses, profit and cash. A plain-English guide to methods, horizons, and accuracy for small businesses.",
    keywords: [
      "financial forecasting",
      "what is financial forecasting",
      "business forecast",
      "financial projections",
      "forecasting methods",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Every decision about hiring, pricing, marketing, or investment
      starts with the same question: what do the numbers look like
      under this assumption? Financial forecasting is the discipline
      of answering that question well enough to actually use - not
      perfectly, but reliably enough to make better decisions.
    </Lead>

    <DefinitionBlock term="Financial forecasting">
      the practice of projecting your business&apos;s future revenue,
      expenses, profit, and cash position based on current data,
      historical patterns, and explicit assumptions about what will
      change.
    </DefinitionBlock>

    <H2 id="three-horizons">Three horizons, three purposes</H2>

    <p>
      Different decisions need different forecasts. A small business
      typically maintains three.
    </p>

    <H3>Short-term (1-3 months)</H3>

    <p>
      Weekly resolution. Operational planning. The cash flow
      forecast lives here. Used for &quot;can we cover payroll next
      Friday?&quot; and &quot;should we accept these payment
      terms?&quot; Accuracy target: ±5-10%.
    </p>

    <H3>Medium-term (3-12 months)</H3>

    <p>
      Monthly resolution. Tactical planning. Used for &quot;can we
      afford this hire?&quot;, &quot;will we hit the year-end
      target?&quot;, and &quot;should we invest in this campaign?&quot;
      Accuracy target: ±15-20%.
    </p>

    <H3>Long-term (1-3 years)</H3>

    <p>
      Quarterly resolution. Strategic planning. Used for major
      capital decisions, hiring roadmaps, and investor or lender
      conversations. Accuracy degrades fast at this horizon -
      treat it as directional rather than precise.
    </p>

    <H2 id="forecast-vs-budget">Forecast vs budget</H2>

    <p>
      Two related but distinct concepts often confused:
    </p>

    <ul>
      <li>
        <strong>Budget</strong> - what you commit to spending. A
        plan. Anchored at the start of the period and updated
        sparingly. Used to enforce discipline.
      </li>
      <li>
        <strong>Forecast</strong> - what you expect will happen.
        A prediction. Updated continuously as new information
        arrives. Used to anticipate.
      </li>
    </ul>

    <p>
      Both have a place. A business that operates without a budget
      drifts; a business that updates only its budget and not its
      forecast operates blind to changes mid-year.
    </p>

    <H2 id="forecasting-methods">Common forecasting methods</H2>

    <H3>Top-down</H3>

    <p>
      Start with a market or growth-rate assumption, work down.
      &quot;The market is $X billion, we want 0.5% share by year
      3, that&apos;s $Y of revenue.&quot; Useful for new ventures
      and strategic planning; usually too aggressive for operational
      use.
    </p>

    <H3>Bottom-up</H3>

    <p>
      Start with current activity, build up by category. &quot;We
      had 200 customers last month, 5% monthly churn, 15 new
      customers expected, at $X average revenue.&quot; More
      accurate for short and medium horizons because it grounds in
      actual data.
    </p>

    <H3>Driver-based</H3>

    <p>
      Identify the 2-3 metrics that actually drive revenue
      (customers × revenue per customer; visitors × conversion ×
      average order), forecast each driver, multiply. The most
      diagnostic method - when reality differs, you can identify
      which driver was off.
    </p>

    <H3>Trend extrapolation</H3>

    <p>
      Take the growth rate from the last 6-12 months, project
      forward. Simple, often good enough for stable businesses,
      misleading for businesses with changing dynamics.
    </p>

    <H2 id="what-to-forecast">What to forecast (always)</H2>

    <p>
      A complete forecast covers four things, not just revenue.
    </p>

    <ul>
      <li>
        <strong>Revenue</strong> - by major segment or product line
        if material
      </li>
      <li>
        <strong>Expenses</strong> - split between fixed (rent,
        salaries, software) and variable (cost of goods, payment
        processing, contractor costs)
      </li>
      <li>
        <strong>Profit</strong> - gross, operating, net (see{" "}
        <ArticleLink href="/resources/financial-fundamentals/net-profit-explained">
          Net Profit Explained
        </ArticleLink>
        )
      </li>
      <li>
        <strong>Cash flow</strong> - the timing of receivables and
        payables, which can differ significantly from profit
      </li>
    </ul>

    <p>
      Revenue-only forecasts are the most common mistake. The
      number that tells you whether the business will work is rarely
      revenue alone.
    </p>

    <H2 id="assumptions">Assumptions matter more than the numbers</H2>

    <p>
      Every forecast rests on explicit assumptions. The discipline
      of writing them down is what separates a useful forecast from
      a number on a screen.
    </p>

    <Callout variant="info" title="The assumption rule">
      Every line in your forecast should have an assumption you can
      defend. If you can&apos;t articulate why the number is what
      it is, the forecast doesn&apos;t belong in your decision-making.
    </Callout>

    <p>
      When reality differs from forecast, the diagnosis is usually
      &quot;which assumption was wrong?&quot; - and that&apos;s
      only answerable if the assumptions were stated upfront.
    </p>

    <H2 id="common-mistakes">Common forecasting mistakes</H2>

    <H3>1. Overestimating the near term</H3>

    <p>
      Almost every business overestimates how fast the next quarter
      will move. Things take longer than you think; deals close
      slower; hires ramp later. Build in slack.
    </p>

    <H3>2. Forecasting in straight lines</H3>

    <p>
      Real businesses have seasonality, lumpy deals, calendar
      effects. A forecast that grows 5% every month for 12 months
      will always be wrong somewhere.
    </p>

    <H3>3. Treating the forecast as the goal</H3>

    <p>
      A forecast is a prediction, not a target. Confusing the two
      leads to incentives where people massage the forecast to
      match performance instead of using it to plan.
    </p>

    <H3>4. Never revisiting</H3>

    <p>
      A forecast built once and never updated is a fairy tale.
      Update monthly with actuals.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-forecasting/revenue-forecasting-methods">
          Revenue Forecasting Methods
        </ArticleLink>{" "}
        - the deeper dive on revenue specifically.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/expense-forecasting">
          Expense Forecasting
        </ArticleLink>{" "}
        - the expense-side companion.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/scenario-planning-explained">
          Scenario Planning Explained
        </ArticleLink>{" "}
        - building multiple forecast versions for different
        assumptions.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>{" "}
        - the short-term cash variant of forecasting.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/financial-forecasting-small-business-guide">
          Financial Forecasting for Small Businesses
        </ArticleLink>{" "}
        - a longer guide to the discipline.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Forecasting = projecting future numbers from current data + explicit assumptions.",
      "Maintain three horizons: short-term (1-3 months, operational), medium (3-12 months, tactical), long-term (1-3 years, strategic).",
      "Forecasts are NOT budgets. Budget = commitment. Forecast = prediction.",
      "Always forecast revenue, expenses, profit, AND cash flow - not just revenue.",
      "Every line should have a stated assumption. That's where the diagnosis comes from when reality differs.",
      "Update monthly. The discipline of revisiting beats initial precision.",
    ]} />
  </>
);
