import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "mom-vs-yoy-growth",
  title: "Month-over-Month vs Year-over-Year Growth",
  excerpt:
    "Month-over-month (MoM) and year-over-year (YoY) growth measure the same business at different time scales. Each catches things the other misses.",
  category: "business-metrics-kpis",
  tags: ["MoM Growth", "YoY Growth", "Growth Rate", "Trend Analysis"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Month-over-month (MoM) growth compares this month to last month. Sensitive to short-term changes; noisy.",
    "Year-over-year (YoY) growth compares this month to the same month last year. Cancels out seasonality; slower to react.",
    "Use MoM for early signals and operational pace; use YoY for the underlying trend.",
    "Both can mislead. A rising MoM can hide YoY contraction; a strong YoY can hide MoM stagnation.",
    "Look at both alongside compound monthly growth rate (CMGR) for fast-growing businesses.",
  ],
  faq: [
    { q: "What does MoM growth measure?", a: "Month-over-month growth measures the change from one month to the next. (This month − Last month) ÷ Last month × 100%." },
    { q: "What does YoY growth measure?", a: "Year-over-year growth measures the change from the same month a year ago. (This month − Same month last year) ÷ Same month last year × 100%. It cancels out seasonality." },
    { q: "Which is more important?", a: "Depends on the question. MoM tells you operational pace right now. YoY tells you whether the business is genuinely growing or just bouncing. Most businesses watch both." },
    { q: "Why does MoM growth bounce around so much?", a: "Most businesses have month-to-month variation from weekends, holidays, seasonality, big deals timing, and one-off events. A single month's MoM is rarely meaningful in isolation - the trend matters." },
    { q: "What's compound monthly growth rate (CMGR)?", a: "The constant monthly growth rate that would produce the observed change over a longer period. Useful for fast-growing businesses where simple averages mislead. CMGR over 12 months ≈ (Ending value ÷ Starting value)^(1/12) − 1." },
    { q: "When does YoY mislead?", a: "When the comparison base is unusual - a one-off spike, a closed business unit, a regulatory effect. Always sanity-check the comparison period." },
  ],
  seo: {
    title: "MoM vs YoY Growth: When to Use Each | Tweaxly",
    description:
      "Month-over-month and year-over-year growth measure the same business at different scales. A plain-English guide to when each is useful and where each misleads.",
    keywords: [
      "month over month growth",
      "year over year growth",
      "MoM vs YoY",
      "growth rate",
      "compound monthly growth rate",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Two of the most-used growth measures in business, and the two
      most commonly applied to the wrong question. Month-over-month
      and year-over-year aren&apos;t competing metrics - they answer
      different questions about the same business. Knowing when to
      use each is one of the small habits that compounds into
      better decisions over time.
    </Lead>

    <DefinitionBlock term="Month-over-month (MoM) growth">
      the percentage change from one month to the immediately
      preceding month. (This month − Last month) ÷ Last month × 100%.
      Reflects short-term momentum.
    </DefinitionBlock>

    <DefinitionBlock term="Year-over-year (YoY) growth">
      the percentage change from one month to the same month a year
      ago. (This month − Same month last year) ÷ Same month last
      year × 100%. Reflects long-term trajectory and cancels out
      seasonality.
    </DefinitionBlock>

    <Formula
      formula={"MoM Growth = (This month − Last month) ÷ Last month × 100%\n\nYoY Growth = (This month − Same month last year) ÷ Same month last year × 100%"}
      example={
        <>
          A business does $100K in May, $108K in June, and did $90K
          last June. June MoM growth ={" "}
          <strong>($108K − $100K) ÷ $100K = 8%</strong>. June YoY
          growth = <strong>($108K − $90K) ÷ $90K = 20%</strong>.
          Same month, two different stories.
        </>
      }
    />

    <H2 id="when-to-use-each">When to use each</H2>

    <ComparisonTable
      caption="MoM vs YoY - choose by the question"
      columns={["MoM", "YoY"]}
      rows={[
        {
          label: "What it shows",
          cells: ["Short-term momentum", "Underlying trend (seasonality cancelled out)"],
        },
        {
          label: "Noise level",
          cells: ["High - sensitive to one-offs", "Low - smooths random monthly variation"],
        },
        {
          label: "Reaction time",
          cells: ["Fast - shows changes immediately", "Slow - takes months to reflect a new trend"],
        },
        {
          label: "Best for",
          cells: ["Operational pace, early signals, weekly reviews", "Strategic direction, board updates, valuation"],
        },
        {
          label: "Misleads when",
          cells: ["One unusual month skews the read", "Last year was an anomaly (good or bad)"],
        },
      ]}
    />

    <H2 id="combine-them">The two together tell a fuller story</H2>

    <p>
      Each measure on its own can be misleading. The combination
      catches what either misses.
    </p>

    <ul>
      <li>
        <strong>MoM positive + YoY positive:</strong> Healthy growth
        - the standard good case.
      </li>
      <li>
        <strong>MoM negative + YoY positive:</strong> A bad month
        inside a generally growing business. Could be a one-off;
        worth checking but not panic.
      </li>
      <li>
        <strong>MoM positive + YoY negative:</strong> A bounce inside
        a longer-term decline. The most dangerous case - looks
        encouraging but the underlying trend is wrong.
      </li>
      <li>
        <strong>MoM negative + YoY negative:</strong> Compounding
        problem. Investigate quickly.
      </li>
    </ul>

    <H2 id="seasonality">Why YoY beats MoM for seasonal businesses</H2>

    <p>
      A retailer who does 40% of annual revenue in November-December
      will show wild MoM growth in November and wild MoM contraction
      in January - neither reflects the underlying business. YoY
      strips that effect out: November this year vs November last
      year is a fair comparison.
    </p>

    <p>
      The same logic applies to any business with predictable
      seasonal patterns: tax accountants in April, ski resorts in
      winter, gardening businesses in spring, ecommerce in Q4. MoM
      is misleading; YoY is necessary.
    </p>

    <H2 id="compound-growth">Compound Monthly Growth Rate (CMGR)</H2>

    <p>
      For fast-growing businesses, simple averaged growth rates
      understate the trajectory. The compound monthly growth rate
      tells you the constant monthly rate that would explain the
      observed start-to-end growth.
    </p>

    <Formula
      formula={"CMGR = (Ending value ÷ Starting value)^(1 ÷ number of months) − 1"}
      example={
        <>
          A business went from $50K MRR in January to $200K MRR in
          December. CMGR ={" "}
          <strong>($200K ÷ $50K)^(1÷11) − 1 ≈ 13.4%/month</strong>.
          That&apos;s 13.4% compound monthly growth.
        </>
      }
    />

    <p>
      CMGR is the right metric for pitching to investors who care
      about high-growth trajectory and for measuring whether a fast
      growth pace is being sustained.
    </p>

    <H2 id="common-mistakes">Common mistakes with growth rates</H2>

    <H3>1. Quoting one number without context</H3>

    <p>
      &quot;We grew 30%&quot; means very different things depending
      on whether it&apos;s MoM (impressive for a year, alarming for
      a quarter), YoY (healthy at most stages), or all-time
      (irrelevant).
    </p>

    <H3>2. Comparing against a small base</H3>

    <p>
      Going from $1K to $2K is 100% growth; going from $1M to $2M
      is the same percentage but a much bigger story. Always quote
      growth alongside absolute numbers.
    </p>

    <H3>3. Ignoring the calendar</H3>

    <p>
      February has fewer days than January. A 5% MoM revenue drop
      from January to February might just be the calendar. Use
      &quot;daily revenue&quot; for fair comparisons when day count
      matters.
    </p>

    <H3>4. Using YoY when the base period was abnormal</H3>

    <p>
      A YoY comparison against a record month a year ago will look
      bad even when the current business is healthy. Always sanity
      check the base period.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
          Monthly Recurring Revenue (MRR)
        </ArticleLink>{" "}
        - MRR is most useful viewed as a growth rate.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-annual-recurring-revenue-arr">
          Annual Recurring Revenue (ARR)
        </ArticleLink>{" "}
        - ARR growth is almost always quoted YoY.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing
        </ArticleLink>{" "}
        - the cases where MoM and YoY tell you something is changing.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/leading-vs-lagging-indicators">
          Leading vs Lagging Indicators
        </ArticleLink>{" "}
        - MoM is more leading; YoY is more lagging.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/what-is-financial-forecasting">
          What Is Financial Forecasting
        </ArticleLink>{" "}
        - growth rates are the main input to forward projection.
      </li>
    </ul>

    <KeyTakeaways items={[
      "MoM = (this month − last month) ÷ last month. Fast, noisy, reflects momentum.",
      "YoY = (this month − same month last year) ÷ same month last year. Slow, smooth, reflects trend.",
      "Use MoM for operational reviews, YoY for strategy and board updates.",
      "MoM positive + YoY negative is the most dangerous combination - looks encouraging but trend is wrong.",
      "For seasonal businesses, YoY is essential. MoM by itself misleads.",
      "For fast-growing businesses, compound monthly growth rate (CMGR) captures the trajectory better.",
    ]} />
  </>
);
