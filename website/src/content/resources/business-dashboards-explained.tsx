import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "business-dashboards-explained",
  title: "Business Dashboards Explained",
  excerpt:
    "A dashboard is a single view of the metrics that drive your business. Built well, it focuses attention. Built badly, it's wallpaper nobody opens twice.",
  category: "business-intelligence",
  tags: ["Dashboards", "KPI Tracking", "Reporting"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "A good dashboard shows 5-10 numbers, fits on one screen, mixes leading and lagging indicators, and gets read regularly.",
    "Bad dashboards show 30+ metrics, become cluttered, and stop being opened after the first week.",
    "Every dashboard should have an owner who reviews it on a defined cadence (weekly, monthly).",
    "Dashboards aren't replacements for analysis - they surface signals; investigation answers \"why.\"",
    "Build the dashboard to support a specific decision-making routine. No routine = no dashboard.",
  ],
  faq: [
    { q: "How many metrics should be on my dashboard?", a: "5-10 for an operational dashboard, 10-15 for an executive monthly. More than that and the dashboard stops being scannable." },
    { q: "What's the difference between a dashboard and a report?", a: "A dashboard is a recurring snapshot of key metrics you watch regularly. A report is a deeper analysis on a specific topic at a specific time. Both are useful; they serve different purposes." },
    { q: "Should dashboards be real-time?", a: "Rarely. Daily refresh is enough for most operational dashboards; weekly for management; monthly for strategic. Real-time creates noise and addiction to short-term swings." },
    { q: "Who should design the dashboard?", a: "The person who'll use it. Dashboards built by IT or designers without the user often end up displaying what's easy to display, not what's needed." },
    { q: "What's a vanity metric?", a: "A metric that makes you feel good but doesn't drive decisions. Total signups, social media followers, page views. They're not useless but they shouldn't dominate dashboards." },
    { q: "How often should I change the dashboard?", a: "Rarely. The whole point is comparison over time. Dashboard changes break that comparison. Add new metrics sparingly and remove old ones only when truly unused." },
  ],
  seo: {
    title: "Business Dashboards Explained | Tweaxly",
    description:
      "A dashboard is a single view of the metrics that drive your business. A plain-English guide to building one that gets used and produces decisions.",
    keywords: [
      "business dashboard",
      "dashboard design",
      "KPI dashboard",
      "business metrics dashboard",
      "what is a dashboard",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Most business dashboards die quietly. Built with enthusiasm,
      opened daily for a week, then forgotten. The difference
      between dashboards that work and dashboards that don&apos;t
      is mostly about scope and habit - which metrics are on
      them, and what review cadence they support.
    </Lead>

    <H2 id="anatomy">Anatomy of a good dashboard</H2>

    <ul>
      <li>
        <strong>One screen.</strong> If it scrolls, it&apos;s too
        long.
      </li>
      <li>
        <strong>5-10 metrics.</strong> More than that and you
        can&apos;t scan it.
      </li>
      <li>
        <strong>Mix leading and lagging indicators.</strong>{" "}
        Lagging confirms (revenue, profit); leading warns
        (pipeline, signups).
      </li>
      <li>
        <strong>Show trend, not just current value.</strong>{" "}
        Numbers without context are noise.
      </li>
      <li>
        <strong>Highlight changes.</strong> The eye should land
        on what&apos;s different.
      </li>
      <li>
        <strong>Read in 2 minutes.</strong> If it takes longer,
        nobody reads it.
      </li>
    </ul>

    <H2 id="tiers">Different dashboards for different audiences</H2>

    <p>
      One universal dashboard rarely works. Most businesses
      benefit from tiers:
    </p>

    <ul>
      <li>
        <strong>Daily operational dashboard</strong> - 5 metrics,
        operational pace (sales today, pipeline, support tickets,
        cash)
      </li>
      <li>
        <strong>Weekly management dashboard</strong> - 8-10
        metrics, what changed this week vs last
      </li>
      <li>
        <strong>Monthly executive dashboard</strong> - 10-15
        metrics, headline numbers + variance vs forecast
      </li>
      <li>
        <strong>Quarterly board / strategic dashboard</strong> -
        strategic metrics, market context, longer-term trends
      </li>
    </ul>

    <p>
      Same business, different views. The metric that matters
      most to operations isn&apos;t the metric that matters most
      to the board.
    </p>

    <H2 id="ownership">Every dashboard needs an owner and a routine</H2>

    <p>
      A dashboard without a review routine is wallpaper. Build
      the routine first:
    </p>

    <ul>
      <li>
        Who reviews this dashboard?
      </li>
      <li>
        When (specific day and time)?
      </li>
      <li>
        What questions does it answer?
      </li>
      <li>
        What actions does a signal trigger?
      </li>
    </ul>

    <p>
      Without those answers, the dashboard won&apos;t survive
      the first month.
    </p>

    <Callout variant="info" title="The two-minute rule">
      If your dashboard takes more than two minutes to read,
      something is wrong. Either too many metrics, too much
      visual noise, or insufficient hierarchy. Cut.
    </Callout>

    <H2 id="standard-content">What to put on a small business operational dashboard</H2>

    <p>
      A reasonable starter set for most small businesses:
    </p>

    <ul>
      <li>
        <strong>Revenue this month</strong> + trend vs prior 3
        months
      </li>
      <li>
        <strong>Gross margin</strong> + 12-month trend
      </li>
      <li>
        <strong>Cash position</strong> + 13-week projection
      </li>
      <li>
        <strong>Pipeline coverage</strong> (B2B) or new customer
        count (B2C)
      </li>
      <li>
        <strong>Customer churn or retention</strong>
      </li>
      <li>
        <strong>Top expense categories</strong> vs budget
      </li>
      <li>
        <strong>One operational driver</strong> specific to your
        business (utilization, conversion rate, units shipped)
      </li>
    </ul>

    <p>
      Adapt to your business model. Subscription businesses lean
      heavier on retention and MRR. Inventory businesses lean
      heavier on turn rate and stockouts.
    </p>

    <H2 id="common-mistakes">Common dashboard mistakes</H2>

    <H3>1. Too many metrics</H3>

    <p>
      A 30-metric dashboard isn&apos;t a dashboard - it&apos;s a
      list. Pick the 5-10 that drive decisions.
    </p>

    <H3>2. Vanity metrics</H3>

    <p>
      Total signups, followers, page views. Looks impressive,
      drives nothing. Reserve dashboard space for metrics that
      change decisions.
    </p>

    <H3>3. No comparison context</H3>

    <p>
      A number without context is noise. Always show vs prior
      period, vs forecast, or vs target.
    </p>

    <H3>4. Changing the dashboard constantly</H3>

    <p>
      The value comes from comparison over time. Frequent changes
      break that comparison.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-intelligence/what-is-business-intelligence">
          What Is Business Intelligence
        </ArticleLink>{" "}
        - the broader practice.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/leading-vs-lagging-indicators">
          Leading vs Lagging Indicators
        </ArticleLink>{" "}
        - the metric distinction good dashboards mix.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - the standard time comparisons on dashboards.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/detecting-business-trends-before-they-become-problems">
          Detecting Business Trends Before They Become Problems
        </ArticleLink>{" "}
        - what dashboards exist to surface.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/spreadsheets-not-enough">
          Why Spreadsheets Are No Longer Enough for Financial Planning
        </ArticleLink>{" "}
        - when dashboards need real tools.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Good dashboards: one screen, 5-10 metrics, scannable in 2 minutes, mix leading and lagging.",
      "Build different dashboards for different audiences - operational, management, executive, strategic.",
      "Every dashboard needs an owner and a defined review cadence.",
      "Vanity metrics don't belong on dashboards. Save space for decision-driving numbers.",
      "Show trend, not just current value. A number without context is noise.",
      "Change dashboards rarely - the value comes from comparison over time.",
    ]} />
  </>
);
