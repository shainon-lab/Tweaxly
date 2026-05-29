import {
  Lead, H2, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "mrr",
  title: "MRR",
  excerpt:
    "MRR: Monthly Recurring Revenue. The normalized monthly subscription revenue a business can count on. The foundation of every other subscription metric.",
  category: "business-glossary",
  tags: ["MRR", "Recurring Revenue", "SaaS"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Monthly Recurring Revenue.",
    "Definition: The sum of all subscription revenue, normalized to a monthly figure.",
    "Normalization: Annual contracts ÷ 12. Quarterly ÷ 3. Monthly stays as-is.",
    "Doesn't include: One-time setup fees, professional services, overage charges.",
    "Used for: Tracking subscription business health, forecasting, growth rate calculation (Net New MRR).",
  ],
  faq: [
    { q: "What does MRR stand for?", a: "Monthly Recurring Revenue. The total subscription revenue your business can expect to collect in a normalized month." },
    { q: "How is MRR calculated?", a: "Sum every active subscription, expressed as a monthly amount. Monthly plans stay full value; annual plans divide by 12; quarterly plans divide by 3." },
    { q: "Does MRR include one-time fees or overage charges?", a: "No. MRR is strictly recurring. Setup fees, professional services, and unpredictable overage charges sit outside MRR." },
    { q: "What's Net New MRR?", a: "The sum of MRR changes in a period: New MRR (from new customers) + Expansion MRR (existing customers paying more) − Contraction MRR (existing customers paying less) − Churned MRR (cancellations)." },
    { q: "How fast should MRR grow?", a: "Depends on stage. Early-stage SaaS often targets 10-20% month-over-month growth. Mature SaaS commonly runs 2-5% MoM. Plot as a growth rate, not absolute change." },
    { q: "Is MRR the same as ARR ÷ 12?", a: "Yes. ARR (Annual Recurring Revenue) is just MRR × 12. They're the same metric on different scales. Use MRR for month-to-month analysis; ARR for annual comparisons." },
    { q: "What's Net Revenue Retention (NRR)?", a: "A related metric: NRR = (Starting MRR + Expansion − Contraction − Churned) ÷ Starting MRR. NRR above 100% means existing customers grew more than they shrank - a strong signal." },
  ],
  seo: {
    title: "MRR - Monthly Recurring Revenue Definition | Tweaxly",
    description:
      "MRR stands for Monthly Recurring Revenue - normalized monthly subscription revenue. The foundation of every subscription business metric.",
    keywords: [
      "MRR",
      "monthly recurring revenue",
      "MRR definition",
      "what is MRR",
      "SaaS MRR",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      For subscription businesses, the most important top-line
      metric. MRR cuts through the noise of one-time payments,
      upgrade timing, and billing cycles to tell you what the
      business is actually generating in predictable monthly
      revenue.
    </Lead>

    <DefinitionBlock term="MRR (Monthly Recurring Revenue)">
      the total subscription revenue your business can expect
      to collect in a normalized month, calculated by summing
      every active subscription expressed as a monthly amount.
    </DefinitionBlock>

    <Formula
      formula={"MRR = Sum of (every active subscription, expressed as monthly revenue)\n\nNormalize: monthly plan = full amount; quarterly ÷ 3; annual ÷ 12.\n\nNet New MRR = New + Expansion − Contraction − Churned"}
    />

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Subscription business health</strong> - the
        primary growth metric for SaaS and recurring-revenue
        businesses
      </li>
      <li>
        <strong>Forecasting</strong> - the foundation of every
        subscription revenue projection
      </li>
      <li>
        <strong>Component analysis</strong> - breaking into
        New, Expansion, Contraction, Churned reveals what&apos;s
        driving growth
      </li>
      <li>
        <strong>Investor reporting</strong> - the standard
        metric private investors and acquirers ask for
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Don&apos;t include one-time fees in MRR - it inflates the
      number and misleads. Track those separately.
    </p>

    <p>
      MRR isn&apos;t cash. A $12K annual contract paid upfront
      is $1K of MRR per month, but $12K of cash in month 1 and
      $0 for months 2-12. Plan accordingly.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-monthly-recurring-revenue-mrr">
        What Is Monthly Recurring Revenue (MRR)?
      </ArticleLink>
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/arr">
          ARR (Annual Recurring Revenue)
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
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          MoM vs YoY Growth (article)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "MRR = sum of every recurring subscription, normalized to monthly.",
      "Annual contracts ÷ 12; quarterly ÷ 3. One-time fees don't count.",
      "Net New MRR (New + Expansion − Contraction − Churned) is the single growth number.",
      "Same metric as ARR, different scale (ARR = MRR × 12).",
    ]} />
  </>
);
