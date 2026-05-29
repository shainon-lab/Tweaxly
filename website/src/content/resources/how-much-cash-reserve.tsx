import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "how-much-cash-reserve",
  title: "How Much Cash Reserve Should a Business Have?",
  excerpt:
    "How big a cash safety buffer your business should hold depends on revenue volatility, customer concentration, and seasonality. Here's how to size yours.",
  category: "cash-flow-management",
  tags: ["Cash Reserve", "Runway", "Risk Management"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "The conventional rule of thumb: 3-6 months of fixed operating expenses in reserve.",
    "Three factors push the right number higher: revenue volatility, customer concentration, and seasonality.",
    "The right reserve isn't a fixed number - it scales with the business and changes with risk profile.",
    "Reserve should be liquid (savings, money market, short-term treasuries), not invested in anything that could lose value when you need it.",
    "Separate the reserve from your operating account. If it's not separate, it's just operating cash with a different name.",
  ],
  faq: [
    { q: "What's the standard cash reserve rule?", a: "3-6 months of fixed operating expenses. \"Fixed\" means costs that don't go away if revenue drops - rent, payroll, software, insurance. Highly volatile or concentrated businesses should target the higher end or beyond." },
    { q: "Should I count variable costs in the reserve calculation?", a: "Usually no - variable costs scale down if revenue drops, so they self-correct. The reserve protects against fixed costs that keep running regardless." },
    { q: "What if I can't afford a 6-month reserve?", a: "Most growing small businesses can't initially. Start with 1 month, then 2, then 3. Building reserve is a long-term discipline, not a one-time event. Plan it into your budget." },
    { q: "Where should I keep cash reserve?", a: "Liquid, safe accounts - business savings, money market funds, short-term treasury bills. The goal is access on demand, not return. Don't put reserve in anything that could lose value when you need it." },
    { q: "Should the reserve be in a separate account?", a: "Yes. If it's mixed with operating cash, it'll get used. A separate account creates the psychological wall that protects it for real emergencies." },
    { q: "What counts as \"using\" the reserve?", a: "Genuine emergencies - a major customer leaves, an unexpected expense, an economic downturn. Not normal business volatility, not a delayed receivable, not a growth investment. If you're using reserve regularly, your operating buffer is too thin." },
  ],
  seo: {
    title: "How Much Cash Reserve Should a Business Have? | Tweaxly",
    description:
      "Conventional rule is 3-6 months of fixed expenses. A plain-English guide to sizing your reserve based on volatility, concentration, and seasonality.",
    keywords: [
      "cash reserve",
      "business cash reserve",
      "how much cash should a business have",
      "emergency fund business",
      "runway",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most-asked question about small business cash:
      how much should I have set aside? The conventional answer
      (3-6 months) is a starting point. The right answer depends
      on what could go wrong in your specific business, and how
      fast you could react if it did.
    </Lead>

    <H2 id="starting-point">The starting point: 3-6 months of fixed expenses</H2>

    <p>
      The standard recommendation for small businesses is to hold
      3-6 months of fixed operating expenses in reserve.
      &quot;Fixed&quot; meaning costs that don&apos;t go away if
      revenue stops - rent, payroll, debt service, software,
      insurance.
    </p>

    <Formula
      formula={"Cash reserve target = Monthly fixed operating expenses × Target months\n\nTypical range: 3-6 months\nVolatile / concentrated / seasonal: 6-12 months"}
      example={
        <>
          A business with $40K of monthly fixed expenses (rent
          $4K, payroll $28K, software $3K, insurance $1K, debt
          service $4K) targeting a 4-month reserve should hold{" "}
          <strong>$160K in reserve</strong> separate from
          operating cash.
        </>
      }
    />

    <H2 id="adjustments">Three factors that push the number higher</H2>

    <H3>1. Revenue volatility</H3>

    <p>
      A business with steady recurring revenue can survive on a
      thinner buffer than one with lumpy project-based revenue.
      Look at your monthly revenue over the last 12-24 months. If
      the standard deviation is more than 25-30% of average,
      you&apos;re in volatile territory and should target 6+
      months.
    </p>

    <H3>2. Customer concentration</H3>

    <p>
      If your top customer is more than 25% of revenue, losing
      them would be existential. Multiply your reserve target
      accordingly. A business with one customer at 50% should hold
      enough cash to cover the time it would take to either
      replace them or scale operations down - typically 6-9
      months.
    </p>

    <H3>3. Seasonality</H3>

    <p>
      Seasonal businesses need enough cash to cover the off-season,
      not the average month. A landscaping business that earns
      80% of revenue between April-September needs reserves to
      cover October-March - even if the average year is profitable.
    </p>

    <Callout variant="info" title="The combined rule">
      Compound these factors. A business with high volatility AND
      concentrated customers AND clear seasonality might
      legitimately need 9-12 months of reserve - well above the
      conventional 3-6 month rule.
    </Callout>

    <H2 id="building-reserve">How to build the reserve when you don&apos;t have it</H2>

    <p>
      Most small businesses don&apos;t start with a healthy
      reserve. Building one takes discipline over months or years.
      A simple approach:
    </p>

    <ol>
      <li>
        <strong>Calculate your target.</strong> Be honest about
        which adjustments apply to you.
      </li>
      <li>
        <strong>Set a monthly contribution.</strong> Even 1-2% of
        revenue, automated, accumulates real money over time.
      </li>
      <li>
        <strong>Use windfalls.</strong> Tax refunds, one-time
        gains, oversized profitable months - the natural source
        of reserve building.
      </li>
      <li>
        <strong>Don&apos;t reach for the reserve while building
        it.</strong> The discipline matters as much as the
        balance.
      </li>
    </ol>

    <p>
      A useful checkpoint: most small businesses can build a
      3-month reserve in 18-24 months of consistent contribution.
      Faster if you have growth or windfall opportunities.
    </p>

    <H2 id="where-to-hold">Where to hold reserve</H2>

    <p>
      Reserve cash should be liquid and safe. The principle:
      access on demand, no risk of loss. Reasonable choices:
    </p>

    <ul>
      <li>
        <strong>Business savings account</strong> - the standard
        and easiest. Lower yield but immediately accessible.
      </li>
      <li>
        <strong>Money market account</strong> - similar
        accessibility, often slightly higher yield.
      </li>
      <li>
        <strong>Short-term treasury bills (1-3 months)</strong> -
        safe, liquid, often best yield for the risk level. Slight
        friction to access.
      </li>
    </ul>

    <p>
      Not reasonable for reserve: stocks, long-term bonds, real
      estate, the business&apos;s own equipment, anything that
      requires selling at potentially-bad timing. The point of
      reserve is access when things are going wrong - which is
      exactly when those assets are hardest to liquidate at fair
      value.
    </p>

    <H2 id="separate-account">Always separate it</H2>

    <p>
      The single most important rule: reserve must be in a
      separate account from operating cash. If it&apos;s mixed,
      it gets used.
    </p>

    <p>
      Owners often start with &quot;I&apos;ll just maintain a
      higher balance in the main account.&quot; This never works.
      The discipline of moving money to a separate account, and
      treating that account as not-for-touching, is what makes
      reserve actually function.
    </p>

    <H2 id="when-to-use">When to use the reserve</H2>

    <p>
      Reserve is for genuine emergencies, not normal business
      variability:
    </p>

    <ul>
      <li>A major customer leaves unexpectedly</li>
      <li>An economic downturn affects revenue materially</li>
      <li>An unexpected lump-sum expense (legal, regulatory, major equipment failure)</li>
      <li>A health or family emergency takes you out for an extended period</li>
    </ul>

    <p>
      Not reserve events:
    </p>

    <ul>
      <li>A normal slow month</li>
      <li>A delayed receivable that&apos;ll arrive next week</li>
      <li>A growth investment that&apos;s &quot;definitely going to pay off&quot;</li>
      <li>Paying owner distributions</li>
    </ul>

    <p>
      If you&apos;re dipping into reserve regularly for normal
      operating variability, your operating buffer is too thin -
      build it up before treating the reserve as another line item.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/cash-flow-management/what-is-cash-flow">
          What Is Cash Flow
        </ArticleLink>{" "}
        - the foundational concept.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>{" "}
        - knowing when reserves might be needed.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - what reserves protect against.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
          Fixed Costs vs Variable Costs
        </ArticleLink>{" "}
        - the cost vocabulary used to size your reserve.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - the growth rate your reserve supports.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Conventional rule: 3-6 months of fixed operating expenses in reserve.",
      "Adjust up for volatility, customer concentration, and seasonality - sometimes 6-12 months.",
      "Keep reserve liquid and safe - savings, money market, short-term treasuries.",
      "Always separate from operating cash. Mixed = used.",
      "Use only for genuine emergencies, not normal variability or growth investment.",
      "Build over time with monthly contributions and windfalls. 18-24 months is realistic for a 3-month reserve.",
    ]} />
  </>
);
