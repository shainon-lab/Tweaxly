import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-customer-lifetime-value-ltv",
  title: "What Is Customer Lifetime Value (LTV)?",
  excerpt:
    "Customer Lifetime Value (LTV) is the total profit you expect from one customer over the full life of the relationship. The other half of the unit economics equation.",
  category: "business-metrics-kpis",
  tags: ["LTV", "Customer Value", "Unit Economics", "Retention"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 7,
  tldr: [
    "Customer Lifetime Value (LTV) is the total gross profit you expect to earn from a single customer across the entire relationship.",
    "Use gross profit (not revenue) in LTV - revenue overstates value because it ignores the cost to serve each customer.",
    "The simplest formula: LTV = average gross profit per customer per period × average customer lifetime (in periods).",
    "LTV is most useful paired with CAC. The LTV:CAC ratio is one of the cleanest signals of business health.",
    "LTV is an estimate, not a fact. Use conservative inputs and revisit quarterly as you learn more about retention.",
  ],
  faq: [
    { q: "Should I use revenue or gross profit in LTV?", a: "Gross profit. Revenue overstates customer value by ignoring the cost to serve each customer (payment processing, hosting, support, fulfillment). LTV based on gross profit is the honest version." },
    { q: "How do I estimate average customer lifetime?", a: "For subscription businesses: 1 ÷ monthly churn rate (in months). For non-subscription: average time between first and last purchase among customers you've had long enough to measure." },
    { q: "Can LTV be calculated for one-time-purchase businesses?", a: "Yes - based on how often the average customer returns. If 30% of customers buy again, and the average customer makes 1.5 purchases, LTV = 1.5 × gross profit per purchase." },
    { q: "What's a good LTV:CAC ratio?", a: "3:1 is the conventional benchmark for healthy unit economics. Below 1:1 means you're losing money per customer. Above 5:1 often means you could be growing faster." },
    { q: "How often should I recalculate LTV?", a: "Quarterly is the right cadence for most businesses. More often than that and noise drowns out signal; less often and you miss material shifts in retention or pricing." },
    { q: "Does LTV change as the business grows?", a: "Yes - usually in both directions. Better retention practices push LTV up; cohort mix shifts (cheaper plans, less ideal customers) push it down. Track LTV by cohort to see which effect dominates." },
  ],
  seo: {
    title: "What Is Customer Lifetime Value (LTV)? | Tweaxly",
    description:
      "Customer Lifetime Value (LTV) is the total profit you expect from one customer. A plain-English breakdown with formula, examples, and benchmarks.",
    keywords: [
      "customer lifetime value",
      "LTV",
      "what is LTV",
      "LTV formula",
      "lifetime value",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      If Customer Acquisition Cost answers &quot;how much does a
      customer cost,&quot; Lifetime Value answers &quot;how much is
      that customer actually worth.&quot; Knowing both is the only
      way to know whether your business model works. Knowing only one
      is worse than useless - it&apos;s actively misleading.
    </Lead>

    <DefinitionBlock term="Customer Lifetime Value (LTV)">
      the total gross profit you expect to earn from a single
      customer across the full duration of the relationship -
      whether that&apos;s six months, three years, or a decade.
    </DefinitionBlock>

    <Formula
      formula={"Simplest version:\nLTV = Average gross profit per customer per period × Average customer lifetime (in periods)\n\nSubscription business version:\nLTV = (Average revenue per customer per month × Gross margin) ÷ Monthly churn rate"}
      example={
        <>
          A SaaS business charges $200/month with a 75% gross margin
          and a 4% monthly churn rate. LTV ={" "}
          <strong>($200 × 0.75) ÷ 0.04 = $3,750</strong>. If their
          CAC is $1,200, the LTV:CAC ratio is{" "}
          <strong>3.1:1</strong> - right in the healthy zone.
        </>
      }
    />

    <H2 id="revenue-or-profit">Use gross profit, not revenue</H2>

    <p>
      A common shortcut: calculate LTV using revenue instead of
      gross profit. It&apos;s easier - you don&apos;t need to know
      your gross margin - and it produces a much bigger, more
      impressive number. It&apos;s also wrong.
    </p>

    <p>
      Revenue overstates customer value because it ignores what it
      costs to serve them. A customer paying you $1,000 over their
      lifetime, where you spent $400 on hosting, support, payment
      processing, and fulfillment to serve them, is worth $600 to
      you - not $1,000. Multiply the gap across thousands of
      customers and revenue-based LTV will tell you to spend
      acquisition dollars you can&apos;t actually afford.
    </p>

    <Callout variant="warn" title="The honest version">
      Always use gross profit in LTV. If you see an article or
      pitch deck quoting revenue-based LTV, mentally multiply by the
      gross margin to get to a comparable number.
    </Callout>

    <H2 id="estimating-lifetime">Estimating average customer lifetime</H2>

    <p>
      For subscription businesses, the math is straightforward:
      average customer lifetime ≈ 1 ÷ monthly churn rate. A 4%
      monthly churn rate implies 25 months average lifetime. A 2%
      monthly churn rate implies 50 months.
    </p>

    <p>
      For non-subscription businesses (e-commerce, services, retail),
      it&apos;s a closer estimate: look at customers acquired 2+
      years ago and measure the average time between their first
      and last purchase. Different cohorts give different answers;
      use a recent enough cohort to be relevant but old enough to
      have a full lifetime captured.
    </p>

    <H2 id="ltv-cac">LTV is most useful paired with CAC</H2>

    <p>
      LTV in isolation is interesting trivia. LTV compared to{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-acquisition-cost-cac">
        Customer Acquisition Cost (CAC)
      </ArticleLink>{" "}
      is one of the cleanest signals of business health.
    </p>

    <ul>
      <li><strong>LTV:CAC below 1:1</strong> - you lose money on every customer. Stop scaling and fix the model.</li>
      <li><strong>LTV:CAC 1:1 to 2:1</strong> - acquisition barely pays back. Risky territory.</li>
      <li><strong>LTV:CAC around 3:1</strong> - the conventional benchmark. Healthy.</li>
      <li><strong>LTV:CAC above 5:1</strong> - strong economics. You may be under-investing in growth.</li>
    </ul>

    <H2 id="improving-ltv">Three levers to improve LTV</H2>

    <H3>1. Reduce churn</H3>

    <p>
      Even small churn improvements compound dramatically. Cutting
      monthly churn from 5% to 3% increases the implied lifetime
      from 20 months to 33 months - a 65% LTV improvement with
      everything else equal. Retention is the highest-leverage LTV
      lever for subscription businesses.
    </p>

    <H3>2. Increase average revenue per customer</H3>

    <p>
      Pricing, upsell, cross-sell, and feature expansion all push
      LTV up. The constraint: do they hurt retention? An aggressive
      upsell that pushes churn up can be net-negative on LTV even
      if revenue per customer rises.
    </p>

    <H3>3. Improve gross margin</H3>

    <p>
      Cheaper cost to serve flows directly to LTV. Migrating to
      cheaper infrastructure, automating support, and reducing
      payment processing fees are all gross margin improvements.
    </p>

    <H2 id="common-mistakes">Common mistakes with LTV</H2>

    <H3>1. Using revenue instead of gross profit</H3>

    <p>
      Already covered. The biggest single mistake.
    </p>

    <H3>2. Calculating LTV before you have enough retention data</H3>

    <p>
      Estimating LTV for a 6-month-old business with most customers
      still active is mostly guessing. Use industry benchmarks until
      you have at least 12-18 months of cohort data.
    </p>

    <H3>3. Treating LTV as constant</H3>

    <p>
      LTV changes as the business grows, customer mix shifts, and
      retention practices mature. A number you calculated 18 months
      ago is probably wrong now. Recalculate quarterly.
    </p>

    <H3>4. Ignoring the cohort effect</H3>

    <p>
      Customers acquired today behave differently from customers
      acquired three years ago. Older cohorts often have higher LTV
      (better targeting, better product). Average LTV across all
      cohorts can mask material shifts.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-acquisition-cost-cac">
          Customer Acquisition Cost (CAC)
        </ArticleLink>{" "}
        - the other half of the unit economics equation.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
          Monthly Recurring Revenue (MRR)
        </ArticleLink>{" "}
        - the building block of LTV for subscription businesses.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">
          Gross Profit Explained
        </ArticleLink>{" "}
        - the right input to use in LTV.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - LTV:CAC ratio determines what kind of growth you can sustain.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing
        </ArticleLink>{" "}
        - cohort LTV trending down is one of the earliest signs.
      </li>
    </ul>

    <KeyTakeaways items={[
      "LTV = average gross profit per customer per period × average customer lifetime.",
      "Always use gross profit, never revenue - revenue-based LTV is misleading.",
      "Subscription businesses: LTV ≈ (ARPU × gross margin) ÷ monthly churn rate.",
      "LTV is most useful paired with CAC. Healthy LTV:CAC is 3:1 or higher.",
      "Three levers to improve LTV: reduce churn, raise revenue per customer, improve gross margin.",
      "Recalculate LTV quarterly and look at it by cohort - averages hide important trends.",
    ]} />
  </>
);
