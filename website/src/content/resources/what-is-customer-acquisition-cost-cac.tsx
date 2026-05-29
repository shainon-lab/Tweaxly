import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-customer-acquisition-cost-cac",
  title: "What Is Customer Acquisition Cost (CAC)?",
  excerpt:
    "Customer Acquisition Cost (CAC) is the average money you spend to win one new customer. A foundational metric for any business spending money to grow.",
  category: "business-metrics-kpis",
  tags: ["CAC", "Marketing Metrics", "Unit Economics", "Customer Acquisition"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 8,
  featured: true,
  tldr: [
    "Customer Acquisition Cost (CAC) is total sales and marketing spend divided by the number of new customers won in the same period.",
    "Lower CAC means cheaper customer acquisition - but only meaningful when compared against the value those customers generate (LTV).",
    "Healthy LTV:CAC ratio is roughly 3:1 or higher for most businesses. Below 1:1 means you lose money per customer.",
    "CAC payback period - how long it takes to earn back the CAC - matters as much as the ratio. Under 12 months is healthy for most businesses.",
    "CAC almost always rises as you scale. Plan for it.",
  ],
  faq: [
    { q: "What's a good CAC?", a: "There's no universal answer - CAC is meaningful relative to LTV. A useful rule: aim for an LTV:CAC ratio of at least 3:1. Industry benchmarks help, but your own historical trend matters more." },
    { q: "Should I include salaries in CAC?", a: "Yes. The fully-loaded CAC includes everything you spend to acquire customers: paid ads, content, events, sales team salaries (proportionally), agency fees, software. Excluding salaries makes CAC look artificially low." },
    { q: "How often should I measure CAC?", a: "Monthly is right for most businesses. Trends month-over-month and quarter-over-quarter are more useful than any single month's number." },
    { q: "Is CAC different by industry?", a: "Wildly. B2B SaaS CAC commonly runs $300-3,000+. E-commerce $20-100. Financial services $200-500. Compare yourself to your industry, not absolute numbers." },
    { q: "Why does CAC rise over time?", a: "The cheapest customers (your existing network, organic search, easy paid channels) get acquired first. Later customers come from more expensive channels or require more effort to convert." },
    { q: "What's CAC payback period?", a: "How many months of customer revenue (or gross profit) it takes to earn back the CAC. Under 12 months is healthy; 24+ months is risky unless you have very long customer relationships." },
  ],
  seo: {
    title: "What Is Customer Acquisition Cost (CAC)? | Tweaxly",
    description:
      "Customer Acquisition Cost (CAC) is the average money you spend to win one customer. A plain-English guide with formula, examples, and benchmarks.",
    keywords: [
      "customer acquisition cost",
      "CAC",
      "what is CAC",
      "CAC formula",
      "LTV to CAC ratio",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      If you spend any money to win customers - ads, salespeople,
      content, events, anything - Customer Acquisition Cost is one of
      the first metrics you should know. It answers the question every
      growth-focused business needs an answer to: how much does it
      actually cost us to add one more customer?
    </Lead>

    <DefinitionBlock term="Customer Acquisition Cost (CAC)">
      the average amount of money your business spends to acquire one
      new customer, calculated by dividing total sales and marketing
      spend over a period by the number of new customers won in that
      same period.
    </DefinitionBlock>

    <Formula
      formula={"CAC = Total sales & marketing spend ÷ New customers acquired (same period)"}
      example={
        <>
          A small B2B software business spends $30,000 on ads,
          content, and a part-time salesperson in a month. They win
          15 new customers that month. CAC ={" "}
          <strong>$30,000 ÷ 15 = $2,000</strong> per new customer.
        </>
      }
    />

    <H2 id="what-counts-in-cac">What counts in &quot;sales and marketing spend&quot;</H2>

    <p>
      The honest version of CAC is fully-loaded - it includes
      everything required to acquire a customer, not just the obvious
      line items.
    </p>

    <ul>
      <li>Paid advertising (Google, Meta, LinkedIn, etc.)</li>
      <li>Content production (writers, designers, video)</li>
      <li>Sales team salaries and commissions (proportionally if they also do account management)</li>
      <li>Marketing software (CRM, marketing automation, analytics)</li>
      <li>Agency or contractor fees</li>
      <li>Events, sponsorships, swag</li>
      <li>Marketing manager or growth team salaries</li>
    </ul>

    <p>
      What&apos;s NOT in CAC: customer support for existing customers,
      product development, general overhead, owner salary unrelated to
      sales activity.
    </p>

    <Callout variant="info" title="Fully-loaded vs paid-only CAC">
      Some businesses quote &quot;paid CAC&quot; (just ad spend ÷ new
      customers). It&apos;s useful for tracking paid channel
      efficiency, but not a substitute for fully-loaded CAC. Use both;
      label them clearly.
    </Callout>

    <H2 id="why-it-matters">Why CAC matters</H2>

    <p>
      Three reasons CAC is foundational.
    </p>

    <p>
      <strong>It tells you if growth is affordable.</strong> A
      business can grow customer count quickly with a high enough
      marketing budget. The question is whether each new customer is
      worth what they cost. If CAC is rising faster than customer
      value, you&apos;re subsidizing your own growth.
    </p>

    <p>
      <strong>It surfaces channel efficiency.</strong> Breaking CAC
      down by channel (paid search vs content vs referrals) shows
      where your acquisition dollars are working hardest. Most
      businesses discover one or two channels do most of the work.
    </p>

    <p>
      <strong>It anchors marketing budget decisions.</strong> If you
      know that $1 of marketing spend reliably produces $X of new
      revenue (within reasonable accuracy), you can decide whether to
      push harder. Without CAC, marketing spend becomes a gut call.
    </p>

    <H2 id="ltv-cac">CAC alone is meaningless. CAC vs LTV is everything.</H2>

    <p>
      A $2,000 CAC sounds expensive. But if those customers each
      generate $20,000 of gross profit over their lifetime, the
      business is doing fine. A $200 CAC sounds cheap. But if those
      customers churn after one month and generate $50 of gross
      profit, the business is losing money on every acquisition.
    </p>

    <p>
      The standard benchmark is the LTV:CAC ratio - the lifetime
      value of a customer divided by the cost to acquire them. See{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-lifetime-value-ltv">
        Customer Lifetime Value (LTV)
      </ArticleLink>{" "}
      for the companion concept.
    </p>

    <ComparisonTable
      caption="LTV:CAC ratio - how to read it"
      columns={["What it means", "Action"]}
      rows={[
        {
          label: "Below 1:1",
          cells: ["You lose money on every customer", "Stop scaling acquisition. Fix economics first."],
        },
        {
          label: "1:1 to 2:1",
          cells: ["Acquisition barely pays back. Risky.", "Investigate which channels work; cut the rest."],
        },
        {
          label: "3:1",
          cells: ["Conventional healthy ratio", "Reasonable to scale; keep watching."],
        },
        {
          label: "5:1 or higher",
          cells: ["Strong unit economics", "Probably under-investing in growth. Spend more."],
        },
        {
          label: "10:1+",
          cells: ["Either great economics, or you're not counting all CAC", "Sanity check - is this real?"],
        },
      ]}
    />

    <H2 id="payback-period">CAC payback period</H2>

    <p>
      The ratio matters, but so does timing. How fast do you earn
      back your CAC? A 3:1 LTV:CAC ratio means each customer is
      worth 3x what they cost - but if that 3x takes five years,
      you&apos;re tying up capital you might not have.
    </p>

    <Formula
      formula={"CAC payback period (months) = CAC ÷ (Monthly gross profit per customer)"}
      example={
        <>
          A SaaS business spends $1,200 to acquire a customer who
          pays $200/month and has a 75% gross margin. Monthly gross
          profit per customer = $150. CAC payback ={" "}
          <strong>$1,200 ÷ $150 = 8 months</strong>. Anything under
          12 months is generally healthy for subscription businesses.
        </>
      }
    />

    <H2 id="benchmarks">Rough CAC benchmarks by industry</H2>

    <ul>
      <li><strong>B2B SaaS (mid-market):</strong> $300-3,000+</li>
      <li><strong>B2B SaaS (enterprise):</strong> $5,000-30,000+</li>
      <li><strong>D2C e-commerce:</strong> $20-100</li>
      <li><strong>Financial services / fintech:</strong> $200-500</li>
      <li><strong>Marketplaces:</strong> $5-50 per acquired user (each side)</li>
      <li><strong>Local services (lawyers, accountants, contractors):</strong> $50-300</li>
      <li><strong>Restaurants:</strong> $5-15 per new customer</li>
    </ul>

    <p>
      These are wide ranges because customer value varies as widely.
      Use them as a sanity check, not a target.
    </p>

    <H2 id="common-mistakes">Common mistakes with CAC</H2>

    <H3>1. Quoting paid-only CAC as &quot;CAC&quot;</H3>

    <p>
      Excluding salaries, content, and tooling makes CAC look low.
      The honest fully-loaded CAC is often 2-3x the paid-only
      number. Both are useful; quote whichever you mean clearly.
    </p>

    <H3>2. Calculating CAC against active customer count instead of new acquisitions</H3>

    <p>
      CAC is about acquisition. Dividing total spend by total
      customer base gives you a vanity number that gets smaller as
      your business gets older - regardless of whether acquisition
      is getting better or worse.
    </p>

    <H3>3. Ignoring the time lag</H3>

    <p>
      A customer acquired in February might not actually be the
      result of February&apos;s ad spend. They might have seen ads
      in January, talked to sales in early February, and signed in
      late February. For shorter sales cycles this matters less; for
      longer cycles (B2B), match CAC over a rolling window that
      reflects the actual cycle.
    </p>

    <H3>4. Forgetting CAC rises as you scale</H3>

    <p>
      The first 100 customers are easier and cheaper to acquire
      than the next 1,000. Plan for CAC creep; build it into your
      forecasting; revisit unit economics regularly.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-lifetime-value-ltv">
          Customer Lifetime Value (LTV)
        </ArticleLink>{" "}
        - the other half of the unit economics equation.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
          Monthly Recurring Revenue (MRR)
        </ArticleLink>{" "}
        - if you&apos;re a subscription business, the most useful
        revenue metric to pair with CAC.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - CAC is most useful as a trend, not a single number.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/growth-vs-profitability">
          Growth vs Profitability
        </ArticleLink>{" "}
        - the broader trade-off CAC sits inside.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - high CAC paid upfront against revenue collected over time
        is a classic cash crunch pattern.
      </li>
    </ul>

    <KeyTakeaways items={[
      "CAC = sales & marketing spend ÷ new customers won (same period).",
      "Always quote fully-loaded CAC (including salaries and tooling), not just paid spend.",
      "CAC alone is meaningless - compare it to LTV. Healthy LTV:CAC is 3:1 or higher.",
      "Watch payback period as much as the ratio. Under 12 months is healthy for most businesses.",
      "CAC almost always rises as you scale. Plan for it.",
      "Break CAC down by channel - most businesses find one or two channels do most of the work.",
    ]} />
  </>
);
