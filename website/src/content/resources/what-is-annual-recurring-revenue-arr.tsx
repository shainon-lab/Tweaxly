import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-annual-recurring-revenue-arr",
  title: "What Is Annual Recurring Revenue (ARR)?",
  excerpt:
    "Annual Recurring Revenue (ARR) is the annualized version of MRR. The standard headline metric for subscription business size and growth.",
  category: "business-metrics-kpis",
  tags: ["ARR", "Recurring Revenue", "SaaS Metrics", "Subscription Business"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Annual Recurring Revenue (ARR) is MRR × 12 - the same metric on an annual basis.",
    "ARR is the headline number for subscription businesses: the size of the business is usually quoted in ARR.",
    "ARR doesn't include one-time fees, professional services, or overage charges - only recurring subscription revenue.",
    "Growth rates are typically quoted as YoY ARR growth: this year's ARR vs same time last year.",
    "ARR is a snapshot - the value as of right now. Don't confuse it with revenue actually billed or collected in the year.",
  ],
  faq: [
    { q: "Is ARR the same as revenue?", a: "No. ARR is a snapshot of currently-active subscriptions, expressed annually. Revenue is what was actually billed (or earned, depending on accounting) over a specific period. They can differ significantly, especially in growing or churning businesses." },
    { q: "How is ARR different from MRR?", a: "They're the same metric on different scales. ARR = MRR × 12. Most SaaS businesses report MRR internally and ARR externally. Use whichever fits the audience." },
    { q: "Should one-time professional services revenue count in ARR?", a: "No. ARR is strictly recurring subscription revenue. Professional services, setup fees, and one-time payments should be tracked separately." },
    { q: "What's a good ARR growth rate?", a: "Depends on stage. Early-stage SaaS often targets 100%+ year-over-year ARR growth. Mature SaaS commonly runs 20-40%. Above 50% YoY at scale is exceptional." },
    { q: "Is ARR cash?", a: "No. ARR represents the recurring revenue rate of currently-active subscriptions. It says nothing about when that revenue is actually collected, especially when customers prepay annually." },
    { q: "What's the rule of 40?", a: "A SaaS benchmark: revenue growth rate (%) + profit margin (%) should sum to 40 or higher. A business growing 60% with -20% margins hits 40; a business growing 20% with 20% margins also hits 40. Both are considered healthy." },
  ],
  seo: {
    title: "What Is Annual Recurring Revenue (ARR)? | Tweaxly",
    description:
      "Annual Recurring Revenue (ARR) is the annualized version of MRR. A plain-English guide to ARR, what counts in it, and how to track growth.",
    keywords: [
      "annual recurring revenue",
      "ARR",
      "what is ARR",
      "ARR vs MRR",
      "SaaS metrics",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Annual Recurring Revenue is the size badge of subscription
      businesses. When you read &quot;Acme reaches $10M ARR,&quot;
      that means $10 million of annualized subscription revenue is
      currently running through the business. ARR is one of the most
      important metrics to understand if you operate, work in, or
      invest in subscription businesses.
    </Lead>

    <DefinitionBlock term="Annual Recurring Revenue (ARR)">
      the total subscription revenue your business can expect to
      collect over a normalized year - calculated by taking your
      current MRR and multiplying by 12.
    </DefinitionBlock>

    <Formula
      formula={"ARR = MRR × 12\n\nOr equivalently:\nARR = Sum of (every active subscription, expressed as annual revenue)"}
      example={
        <>
          A SaaS business has $25,000 of MRR as of today.
          ARR = <strong>$25,000 × 12 = $300,000</strong>. The
          business is at a $300K ARR run rate.
        </>
      }
    />

    <H2 id="arr-vs-revenue">ARR is not the same as revenue</H2>

    <p>
      The single most common misconception about ARR is confusing it
      with actual revenue billed or collected. They&apos;re
      different:
    </p>

    <ul>
      <li>
        <strong>ARR</strong> is a snapshot. Today&apos;s ARR is your
        currently-active subscription base, projected forward 12 months.
      </li>
      <li>
        <strong>Revenue</strong> is what you actually billed (or
        earned, on accrual) in a specific period. It looks backward.
      </li>
    </ul>

    <p>
      In a growing business, this year&apos;s billed revenue is less
      than current ARR (because ARR was lower for most of the year).
      In a shrinking business, billed revenue is higher than current
      ARR. The two only match exactly if the business has been
      perfectly flat for 12 months.
    </p>

    <Callout variant="warn" title="Ending ARR vs revenue">
      An &quot;Acme exits the year at $10M ARR&quot; pitch deck
      claim is talking about end-of-year ARR, not full-year billed
      revenue. The actual revenue the business booked might be $7M
      or $8M. Both numbers are useful; they measure different
      things.
    </Callout>

    <H2 id="components">ARR has the same component structure as MRR</H2>

    <p>
      Everything in our{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
        MRR article
      </ArticleLink>{" "}
      applies to ARR - just multiplied by 12. The four components of
      ARR change:
    </p>

    <ul>
      <li><strong>New ARR:</strong> Customers who signed up.</li>
      <li><strong>Expansion ARR:</strong> Existing customers paying more.</li>
      <li><strong>Contraction ARR:</strong> Existing customers paying less.</li>
      <li><strong>Churned ARR:</strong> Customers who cancelled.</li>
    </ul>

    <p>
      Net New ARR (= New + Expansion − Contraction − Churned) is
      the single growth or contraction number.
    </p>

    <H2 id="growth-rates">ARR growth rates</H2>

    <p>
      The standard way to talk about subscription growth is
      year-over-year ARR growth. Take current ARR, compare it to ARR
      from 12 months ago, express as a percentage.
    </p>

    <Formula
      formula={"YoY ARR Growth (%) = (Current ARR − ARR 12 months ago) ÷ ARR 12 months ago × 100%"}
      example={
        <>
          A business had $400K ARR 12 months ago and $600K ARR today.
          YoY growth ={" "}
          <strong>($600K − $400K) ÷ $400K = 50%</strong>.
        </>
      }
    />

    <p>
      Rough benchmarks (varies by stage and category):
    </p>

    <ul>
      <li>
        <strong>Sub-$1M ARR:</strong> 100%+ YoY growth is common.
      </li>
      <li>
        <strong>$1-10M ARR:</strong> 50-150% YoY is the typical
        healthy range.
      </li>
      <li>
        <strong>$10-100M ARR:</strong> 40-80% YoY is strong.
      </li>
      <li>
        <strong>$100M+ ARR:</strong> 20-40% YoY is considered very
        healthy.
      </li>
    </ul>

    <H2 id="rule-of-40">The Rule of 40</H2>

    <p>
      A widely-used SaaS benchmark: a healthy SaaS business should
      have a revenue growth rate plus profit margin that sums to 40
      or higher.
    </p>

    <Formula
      formula={"Rule of 40 = YoY Revenue Growth (%) + Profit Margin (%) ≥ 40"}
      example={
        <>
          A business growing ARR 60% per year at a -20% operating
          margin passes (60 + −20 = 40). A business growing ARR 20%
          per year at a 20% operating margin also passes (20 + 20 =
          40). Both shapes are considered healthy.
        </>
      }
    />

    <p>
      The Rule of 40 captures the basic trade-off: a SaaS business
      can be excused for losing money if it&apos;s growing fast
      enough, or for slower growth if it&apos;s genuinely
      profitable. Failing both - slow growth AND losing money - is
      a problem.
    </p>

    <H2 id="common-mistakes">Common mistakes with ARR</H2>

    <H3>1. Quoting ARR as if it were revenue</H3>

    <p>
      Already covered - the most common error. ARR is a forward
      projection of currently-active subscriptions, not a historical
      revenue measure.
    </p>

    <H3>2. Including non-recurring revenue</H3>

    <p>
      Setup fees, professional services, and overage charges aren&apos;t
      part of ARR. Including them inflates the headline number and
      misleads readers (especially investors).
    </p>

    <H3>3. Reporting ARR without growth context</H3>

    <p>
      &quot;We&apos;re at $5M ARR&quot; means very different things
      if growth is 100% YoY versus 5%. Always quote ARR with growth
      rate.
    </p>

    <H3>4. Treating ARR as predictable cash</H3>

    <p>
      ARR is the annualized run rate of recurring revenue. It
      doesn&apos;t account for cash timing (annual upfront vs monthly
      billing), churn risk, or contract terms. Don&apos;t budget
      against ARR directly.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
          Monthly Recurring Revenue (MRR)
        </ArticleLink>{" "}
        - the monthly counterpart; same metric, different scale.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-lifetime-value-ltv">
          Customer Lifetime Value (LTV)
        </ArticleLink>{" "}
        - LTV per customer × customer count ≈ a forward view of
        ARR.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - the standard ways to talk about ARR change.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/revenue-forecasting-methods">
          Revenue Forecasting Methods
        </ArticleLink>{" "}
        - ARR is the foundation of most subscription revenue
        forecasts.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing
        </ArticleLink>{" "}
        - ARR growth rate is the most direct measure.
      </li>
    </ul>

    <KeyTakeaways items={[
      "ARR = MRR × 12. Same metric, annual scale.",
      "ARR is a snapshot of currently-active recurring subscriptions, NOT actual revenue billed.",
      "Only include recurring subscription revenue - one-time fees and overages don't count.",
      "Track ARR growth year-over-year. 50%+ YoY is strong at most stages.",
      "Rule of 40: growth rate + profit margin should sum to 40 or higher for a healthy SaaS.",
      "Always quote ARR with its growth rate - the headline number is meaningless without trajectory.",
    ]} />
  </>
);
