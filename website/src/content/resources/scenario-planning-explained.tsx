import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "scenario-planning-explained",
  title: "Scenario Planning Explained",
  excerpt:
    "A scenario is a forecast under specific assumptions. Three scenarios bracket the range of outcomes - and force you to plan for more than the obvious case.",
  category: "business-forecasting",
  tags: ["Scenario Planning", "Forecasting", "Risk Management"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "A scenario is a forecast under one specific set of assumptions. Scenario planning means running 2-3 to see the range of outcomes.",
    "The standard three: base case (what you expect), downside (what could go wrong), upside (what could go better than planned).",
    "The value isn't in any single forecast - it's in seeing how the business behaves across the range.",
    "Pre-decide actions for each scenario so when one starts unfolding, you don't waste time deciding what to do.",
    "Scenarios are most useful when they vary the assumptions you're most uncertain about - not just revenue, but timing, mix, and key drivers.",
  ],
  faq: [
    { q: "What's the simplest scenario planning approach?", a: "Build three forecasts under three sets of assumptions: base case (most likely), downside (revenue 20% below plan, key churn event), upside (revenue 20% above plan, big new client). Look at cash flow and runway across all three." },
    { q: "How is a scenario different from a forecast?", a: "A forecast is your single best estimate. A scenario is a forecast under specific named assumptions. Scenarios let you see the range of outcomes; a single forecast hides it." },
    { q: "How many scenarios should I build?", a: "Three is the standard. Two is too binary; four or more gets unwieldy. Base, downside, upside captures most of what you need." },
    { q: "Which variables should I vary across scenarios?", a: "Vary the things you're most uncertain about. Usually: revenue growth rate, customer concentration risk, expense trajectory, timing of major events (hires, product launches, market shifts)." },
    { q: "Should I share scenarios with the team?", a: "Yes - especially the downside. Teams plan better when they understand the range of outcomes the business is operating against, not just the optimistic case." },
    { q: "How often should I update scenarios?", a: "Quarterly is the right cadence for most businesses. More often when conditions are changing fast (market shifts, major customer movements). Less often when the business is stable." },
  ],
  seo: {
    title: "Scenario Planning Explained | Tweaxly",
    description:
      "Scenario planning means running multiple forecasts under different assumptions to bracket the range of outcomes. A plain-English guide with examples.",
    keywords: [
      "scenario planning",
      "what is scenario planning",
      "scenario analysis",
      "downside scenario",
      "base case forecast",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      A single forecast pretends the future is knowable. Scenarios
      admit it isn&apos;t and plan accordingly. The discipline is
      simple - build two or three versions of the same forecast under
      different assumptions, look at how the business behaves across
      the range, and pre-decide what to do if each scenario unfolds.
    </Lead>

    <DefinitionBlock term="Scenario planning">
      the practice of building 2-3 versions of a financial forecast,
      each under a different set of assumptions, to understand the
      range of likely outcomes and pre-plan responses.
    </DefinitionBlock>

    <H2 id="three-scenarios">The standard three</H2>

    <ComparisonTable
      caption="A base, downside, and upside scenario together"
      columns={["What it assumes", "What it tells you"]}
      rows={[
        {
          label: "Base case",
          cells: [
            "Most likely outcome: current growth rate, expected hiring, no major surprises",
            "Where you should expect to land if the business performs to plan",
          ],
        },
        {
          label: "Downside",
          cells: [
            "Revenue 20% below plan, key customer churn, slower hiring, expense growth ahead of revenue",
            "Whether you survive a tough year; how low cash gets; what would need to change",
          ],
        },
        {
          label: "Upside",
          cells: [
            "Revenue 20% above plan, faster customer growth, ability to invest more",
            "What growth could look like; whether you can fund the upside; what bottlenecks would appear",
          ],
        },
      ]}
    />

    <p>
      Three is the standard because two (good vs bad) is too binary
      and four or more becomes unwieldy. Base, downside, upside
      brackets the realistic range without overwhelming.
    </p>

    <H2 id="what-to-vary">Vary what you&apos;re uncertain about</H2>

    <p>
      A common mistake: scenarios that only vary revenue. Most
      businesses have several uncertain inputs, and the most
      informative scenarios vary the ones the future actually
      depends on:
    </p>

    <ul>
      <li>
        <strong>Revenue growth rate</strong> - the obvious one
      </li>
      <li>
        <strong>Customer concentration</strong> - what if your top
        client leaves?
      </li>
      <li>
        <strong>Pricing</strong> - what if a competitor forces
        discounting?
      </li>
      <li>
        <strong>Timing of major events</strong> - hire delayed by
        2 months, product launch slipped a quarter
      </li>
      <li>
        <strong>Expense trajectory</strong> - what if a key cost
        rises significantly?
      </li>
      <li>
        <strong>Conversion rates</strong> - paid acquisition
        getting more expensive
      </li>
    </ul>

    <p>
      Pick the 2-3 variables that drive the most uncertainty and
      vary them together in your scenarios.
    </p>

    <H2 id="bracket-outcomes">The point: bracketing outcomes</H2>

    <p>
      The value of scenario planning isn&apos;t in any single
      forecast being right - it&apos;s in seeing how the business
      behaves across the range. Specifically:
    </p>

    <ul>
      <li>
        <strong>Cash runway</strong> in each scenario. Does the
        downside have enough cash to survive? How long can the
        upside fund itself?
      </li>
      <li>
        <strong>Profitability</strong> in each scenario. Does the
        downside still break even? At what revenue level do you
        start losing money?
      </li>
      <li>
        <strong>Key decisions</strong> across scenarios. Does
        hiring still make sense in the downside? Which expenses
        could you cut?
      </li>
    </ul>

    <p>
      Comparing the three side by side surfaces decisions that
      would otherwise be invisible - like which decisions are
      robust (they make sense in every scenario) versus fragile
      (they only make sense in one).
    </p>

    <H2 id="pre-decide-actions">Pre-decide actions per scenario</H2>

    <p>
      A scenario without a planned response is a number on a
      screen. For each scenario, pre-decide:
    </p>

    <ul>
      <li>
        <strong>Trigger</strong> - what observation would tell you
        this scenario is unfolding?
      </li>
      <li>
        <strong>Actions</strong> - what would you do specifically?
        Defer hires? Cut marketing? Talk to the bank?
      </li>
      <li>
        <strong>Sequence</strong> - which actions first, which only
        if needed?
      </li>
    </ul>

    <p>
      Pre-deciding removes the worst-case dynamic of business
      management: scrambling to figure out what to do while the bad
      scenario is already unfolding. The scenario tells you the
      shape; the playbook tells you the response.
    </p>

    <Callout variant="info" title="When the downside triggers">
      The downside isn&apos;t for waiting until it&apos;s clearly
      happening. The triggers should be early - a 30% drop in
      pipeline coverage, a 10% miss against base case for two
      months running. Act on the leading signal, not the lagging.
    </Callout>

    <H2 id="common-mistakes">Common mistakes with scenarios</H2>

    <H3>1. Three different revenue numbers, same expenses</H3>

    <p>
      The most common error. Real scenarios vary both sides
      coherently - a downside revenue scenario usually has
      different hiring, different marketing spend, different
      decisions.
    </p>

    <H3>2. Downside that&apos;s actually base case</H3>

    <p>
      Optimistic owners often build a &quot;downside&quot; that
      isn&apos;t actually bad - it&apos;s the realistic case
      dressed up as conservative. The downside should make you
      genuinely uncomfortable.
    </p>

    <H3>3. Upside without bottlenecks</H3>

    <p>
      Sudden growth has its own constraints - hiring lag, cash
      tied up in working capital, operations breaking. A realistic
      upside includes the friction.
    </p>

    <H3>4. Building scenarios, never revisiting</H3>

    <p>
      Like all forecasting, scenarios drift out of relevance
      without updates. Revisit quarterly.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-forecasting/what-is-financial-forecasting">
          What Is Financial Forecasting
        </ArticleLink>{" "}
        - scenarios are forecasting tiers.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/revenue-forecasting-methods">
          Revenue Forecasting Methods
        </ArticleLink>{" "}
        - the input to each scenario&apos;s revenue line.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/expense-forecasting">
          Expense Forecasting
        </ArticleLink>{" "}
        - the expense side of each scenario.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/how-much-cash-reserve">
          How Much Cash Reserve Should a Business Have
        </ArticleLink>{" "}
        - the reserve size that supports the downside.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/financial-red-flags-every-owner-should-know">
          Financial Red Flags Every Owner Should Know
        </ArticleLink>{" "}
        - the triggers that tell you a scenario is unfolding.
      </li>
    </ul>

    <KeyTakeaways items={[
      "A scenario is a forecast under specific named assumptions. Build 2-3.",
      "Standard three: base case, downside, upside.",
      "Vary the variables you're most uncertain about - not just revenue.",
      "The point is bracketing outcomes - cash runway, profitability, decisions - across the range.",
      "Pre-decide triggers and actions for each scenario. Don't wait until reality forces them.",
      "Update quarterly. Scenarios drift out of relevance quickly.",
    ]} />
  </>
);
