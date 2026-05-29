import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-monthly-recurring-revenue-mrr",
  title: "What Is Monthly Recurring Revenue (MRR)?",
  excerpt:
    "Monthly Recurring Revenue (MRR) is the normalized monthly subscription revenue a business can count on. The most important top-line metric for subscription businesses.",
  category: "business-metrics-kpis",
  tags: ["MRR", "Recurring Revenue", "SaaS Metrics", "Subscription Business"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 7,
  tldr: [
    "Monthly Recurring Revenue (MRR) is the sum of all subscription revenue, normalized to a monthly figure.",
    "Annual contracts get divided by 12 in MRR; quarterly by 3. One-time payments and overages are excluded.",
    "Break MRR into New, Expansion, Contraction, and Churned to understand what's driving the change month over month.",
    "MRR is the foundation of every other subscription metric (ARR, LTV, payback period, growth rate).",
    "Net New MRR (the sum of all four components) is the single number that tells you whether the subscription business grew or shrank this month.",
  ],
  faq: [
    { q: "What's the difference between MRR and revenue?", a: "Revenue is everything you billed in a period - subscriptions, one-time payments, overages, setup fees, professional services. MRR is just the recurring subscription portion, normalized to monthly." },
    { q: "How do I treat annual contracts in MRR?", a: "Divide the annual contract value by 12. A customer on a $12,000/year contract counts as $1,000 of MRR, regardless of whether they paid upfront or monthly." },
    { q: "Should one-time setup fees count in MRR?", a: "No. MRR is strictly recurring. Setup fees, one-time onboarding, and overages all sit outside MRR even when they're billed alongside subscription revenue." },
    { q: "What are the components of MRR change?", a: "New MRR (from new customers), Expansion MRR (existing customers paying more), Contraction MRR (existing customers paying less), and Churned MRR (customers who cancelled). Net New MRR = New + Expansion - Contraction - Churned." },
    { q: "Is MRR the same as ARR ÷ 12?", a: "Yes. ARR (Annual Recurring Revenue) is just MRR × 12. They're the same metric on different scales. Use MRR for month-to-month analysis; ARR for annual comparisons." },
    { q: "How fast should MRR grow?", a: "Depends on stage and category. Early-stage SaaS often targets 10-20% month-over-month growth. Mature SaaS often runs 2-5% month-over-month. Plot it as a growth rate and watch the trend." },
  ],
  seo: {
    title: "What Is Monthly Recurring Revenue (MRR)? | Tweaxly",
    description:
      "Monthly Recurring Revenue (MRR) is normalized monthly subscription revenue. A plain-English guide with formula, components, and how to track MRR growth.",
    keywords: [
      "monthly recurring revenue",
      "MRR",
      "what is MRR",
      "MRR formula",
      "SaaS metrics",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      For a subscription business, MRR is the single most useful
      number you can put on the wall. It cuts through the noise of
      one-time payments, upgrade timing, and billing cycles to tell
      you what the business is actually generating in predictable
      monthly revenue. Every other subscription metric is built on
      top of it.
    </Lead>

    <DefinitionBlock term="Monthly Recurring Revenue (MRR)">
      the total subscription revenue your business can expect to
      collect in a normalized month, calculated by summing every
      active subscription expressed as a monthly amount.
    </DefinitionBlock>

    <Formula
      formula={"MRR = Sum of (every active subscription, expressed as monthly revenue)\n\nNormalize: monthly plan = full amount; quarterly plan ÷ 3; annual plan ÷ 12.\n\nNet New MRR (month over month) = New MRR + Expansion MRR − Contraction MRR − Churned MRR"}
      example={
        <>
          A SaaS business has 100 customers paying $50/month, 30
          customers paying $200/month, and 5 customers on annual
          contracts at $2,400/year ($200/month equivalent). MRR ={" "}
          <strong>(100 × $50) + (30 × $200) + (5 × $200) = $12,000</strong>.
        </>
      }
    />

    <H2 id="what-counts-in-mrr">What counts (and doesn&apos;t) in MRR</H2>

    <p>
      The rule is simple: only revenue that is reliably recurring
      counts in MRR. Anything one-time or unpredictable sits
      outside.
    </p>

    <ul>
      <li><strong>In MRR:</strong> Monthly subscriptions, annual subscriptions (÷12), quarterly subscriptions (÷3), recurring add-ons.</li>
      <li><strong>Not in MRR:</strong> One-time setup or onboarding fees, professional services, overage charges that aren&apos;t predictable, refunds, discounts (some treat these differently).</li>
    </ul>

    <Callout variant="info" title="How to treat discounts">
      Two conventions exist. The more honest one: subtract discounts
      from MRR so you&apos;re reporting actual cash-in. The more
      generous one: report MRR at list price and track discounts
      separately. Pick one and be consistent.
    </Callout>

    <H2 id="components">The four components of MRR change</H2>

    <p>
      MRR doesn&apos;t move in one direction; it moves in four
      independent ones at the same time. Breaking out the components
      is where MRR becomes diagnostic.
    </p>

    <H3>New MRR</H3>
    <p>
      Revenue from customers who signed up this month. The headline
      &quot;growth&quot; number most often quoted.
    </p>

    <H3>Expansion MRR</H3>
    <p>
      Existing customers who paid more this month than last - upgrades
      to higher plans, additional seats, additional usage. Often the
      single highest-leverage growth lever in a mature subscription
      business.
    </p>

    <H3>Contraction MRR</H3>
    <p>
      Existing customers who paid less - downgrades, seat reductions,
      moving to cheaper plans. A growing contraction number can
      hide inside otherwise strong MRR growth.
    </p>

    <H3>Churned MRR</H3>
    <p>
      Revenue lost from customers who cancelled entirely. The most
      visible churn number, and the one most subscription businesses
      watch obsessively.
    </p>

    <H2 id="net-new-mrr">Net New MRR is the bottom line</H2>

    <Formula
      formula={"Net New MRR = New + Expansion − Contraction − Churned"}
    />

    <p>
      A single number that tells you whether the subscription
      business grew or shrank this month, and by how much. Positive
      Net New MRR means growth; negative means contraction.
    </p>

    <p>
      Two businesses with identical $10K Net New MRR can look very
      different:
    </p>

    <ul>
      <li>Business A: $15K New, $0 Expansion, $5K Churned. Growing from new sales, losing some to churn.</li>
      <li>Business B: $5K New, $10K Expansion, $5K Churned. Growth driven mostly by existing customers expanding.</li>
    </ul>

    <p>
      Business B is healthier - expansion is a sign of product-market
      fit, and it&apos;s usually cheaper than new acquisition.
    </p>

    <H2 id="net-revenue-retention">Net Revenue Retention</H2>

    <p>
      A related concept: Net Revenue Retention (NRR) measures what
      happened to last year&apos;s cohort. Did they collectively
      pay more, less, or about the same this year?
    </p>

    <Formula
      formula={"NRR = (Starting MRR + Expansion − Contraction − Churned) ÷ Starting MRR × 100%"}
      example={
        <>
          A cohort started the year at $100K MRR. By year-end, $10K
          of them had upgraded (Expansion), $3K downgraded
          (Contraction), and $7K had cancelled (Churned). NRR ={" "}
          <strong>($100K + $10K − $3K − $7K) ÷ $100K = 100%</strong>.
          The cohort is exactly stable - new sales would drive any
          headline growth.
        </>
      }
    />

    <p>
      NRR above 100% means existing customers grew more than they
      shrank - a strong sign. NRR above 120% is considered excellent
      for B2B SaaS.
    </p>

    <H2 id="common-mistakes">Common mistakes with MRR</H2>

    <H3>1. Including one-time revenue in MRR</H3>

    <p>
      Setup fees, professional services, and overage charges inflate
      MRR and create false confidence. They&apos;re real revenue,
      but they&apos;re not recurring - track them separately.
    </p>

    <H3>2. Not normalizing annual contracts to monthly</H3>

    <p>
      A $24,000 annual contract booked in January isn&apos;t $24,000
      of January MRR - it&apos;s $2,000/month for 12 months. Booking
      it as $24,000 makes MRR look enormous in January and flat for
      the rest of the year.
    </p>

    <H3>3. Watching only Net New MRR without breakdown</H3>

    <p>
      A flat Net New MRR can hide a business where new acquisition
      is dropping fast and expansion is masking it. Always look at
      the four components separately.
    </p>

    <H3>4. Confusing MRR with cash</H3>

    <p>
      A $12K annual contract paid upfront is $1K of MRR per month
      but $12K of cash in month 1 and $0 in months 2-12. Don&apos;t
      mix them up when budgeting.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-annual-recurring-revenue-arr">
          Annual Recurring Revenue (ARR)
        </ArticleLink>{" "}
        - the same metric expressed annually.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-lifetime-value-ltv">
          Customer Lifetime Value (LTV)
        </ArticleLink>{" "}
        - LTV is built directly on MRR per customer.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - MRR is most useful viewed as a growth rate.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing
        </ArticleLink>{" "}
        - the early warning signs visible in MRR components.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit
        </ArticleLink>{" "}
        - MRR isn&apos;t cash - the timing differences matter.
      </li>
    </ul>

    <KeyTakeaways items={[
      "MRR = sum of all subscriptions, normalized to monthly.",
      "Annual contracts ÷ 12; quarterly ÷ 3. One-time fees and overages don't count.",
      "Break MRR change into New, Expansion, Contraction, and Churned.",
      "Net New MRR (all four combined) is the single number that tells you growth or contraction.",
      "Expansion-driven growth is healthier than acquisition-driven growth.",
      "Net Revenue Retention (NRR) above 100% means existing customers grow more than they shrink - a strong signal.",
    ]} />
  </>
);
