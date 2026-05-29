import {
  Lead, H2, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "arr",
  title: "ARR",
  excerpt:
    "ARR: Annual Recurring Revenue. The total subscription revenue a business expects to collect over a normalized year. The headline metric for subscription businesses.",
  category: "business-glossary",
  tags: ["ARR", "Recurring Revenue", "SaaS"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Annual Recurring Revenue.",
    "Used as: The standard headline metric for subscription businesses - quoted as \"$X ARR.\"",
    "How calculated: MRR (Monthly Recurring Revenue) × 12, or sum of all annual subscription values.",
    "Don't confuse with: Actual revenue (ARR is a snapshot of currently-active subscriptions, not what was billed last year).",
  ],
  faq: [
    { q: "What does ARR stand for?", a: "Annual Recurring Revenue. The annualized version of MRR (Monthly Recurring Revenue)." },
    { q: "Is ARR the same as revenue?", a: "No. ARR is a snapshot of currently-active recurring subscriptions, projected forward 12 months. Revenue is what was actually billed in a specific period. They can differ significantly, especially in growing or churning businesses." },
    { q: "Does ARR include one-time fees?", a: "No. ARR is strictly recurring subscription revenue. Setup fees, professional services, and one-time payments should be tracked separately." },
    { q: "What's a good ARR growth rate?", a: "Depends on stage. Sub-$1M ARR: 100%+ YoY is common. $1-10M ARR: 50-150% YoY is healthy. $10-100M ARR: 40-80% YoY is strong. $100M+: 20-40% YoY is considered very healthy." },
    { q: "Can ARR decrease?", a: "Yes - when contraction (downgrades) and churn (cancellations) exceed new acquisition and expansion. A shrinking ARR usually appears in the components (Churned and Contraction) months before it shows up in total." },
    { q: "What's the Rule of 40?", a: "A SaaS benchmark: revenue growth rate (%) + profit margin (%) should sum to 40 or higher. A business growing 60% at -20% margins passes. So does one growing 20% at 20% margins. Failing both means losing." },
    { q: "Is ARR cash?", a: "No. ARR represents the recurring revenue rate of currently-active subscriptions. It says nothing about when that revenue is actually collected, especially when customers prepay annually." },
  ],
  seo: {
    title: "ARR - Annual Recurring Revenue Definition | Tweaxly",
    description:
      "ARR stands for Annual Recurring Revenue. The standard headline metric for subscription businesses, equal to MRR × 12.",
    keywords: [
      "ARR",
      "annual recurring revenue",
      "ARR definition",
      "SaaS ARR",
      "what is ARR",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The standard size and growth metric for subscription
      businesses. Quoted as &quot;$X ARR&quot; or
      &quot;$X million ARR&quot; - the recurring revenue rate
      of currently-active subscriptions.
    </Lead>

    <DefinitionBlock term="ARR (Annual Recurring Revenue)">
      the total subscription revenue your business can expect
      to collect over a normalized year, calculated by taking
      current MRR and multiplying by 12 (or equivalently,
      summing all subscriptions at their annual value).
    </DefinitionBlock>

    <H2 id="how-to-calculate">How to calculate it</H2>

    <p>
      <strong>ARR = MRR × 12</strong>
    </p>

    <p>
      A business with $25,000 of MRR is at $300,000 ARR.
    </p>

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Quoting business size</strong> - &quot;Acme is
        at $5M ARR&quot;
      </li>
      <li>
        <strong>Growth rate</strong> - usually quoted YoY
        (year-over-year)
      </li>
      <li>
        <strong>Investor conversations</strong> - the standard
        metric in SaaS funding
      </li>
      <li>
        <strong>Sales targets</strong> - &quot;hit $X ARR by
        year end&quot;
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      ARR is not actual revenue billed in the year. A business
      growing from $400K to $600K ARR over the year actually
      bills somewhere between $400K and $600K, depending on
      growth pattern - not $600K.
    </p>

    <p>
      Only recurring revenue counts. One-time setup fees,
      professional services, and overage charges are excluded.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-annual-recurring-revenue-arr">
        What Is Annual Recurring Revenue (ARR)?
      </ArticleLink>
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/mrr">
          MRR (Monthly Recurring Revenue)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ltv">
          LTV (Customer Lifetime Value)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/cac">
          CAC (Customer Acquisition Cost)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ebitda">
          EBITDA
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          MoM vs YoY Growth (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "ARR = Annual Recurring Revenue = MRR × 12.",
      "Headline metric for subscription businesses.",
      "Snapshot of current run rate, NOT actual revenue billed.",
      "Only recurring subscription revenue counts - one-time fees don't.",
    ]} />
  </>
);
