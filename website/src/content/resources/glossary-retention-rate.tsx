import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "retention-rate",
  title: "Retention Rate",
  excerpt:
    "Retention Rate: the percentage of customers (or revenue) that stay during a period. The mirror image of churn.",
  category: "business-glossary",
  tags: ["Retention Rate", "Customer Retention", "Subscription"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: The percentage of customers (or revenue) retained during a period.",
    "Formula: Retention Rate = 100% − Churn Rate.",
    "Net Revenue Retention (NRR): Factors in expansion - can exceed 100%.",
    "Healthy NRR: Above 100% is strong; above 120% is exceptional for B2B SaaS.",
    "Inverse of: Churn rate.",
  ],
  faq: [
    { q: "What's retention rate?", a: "The percentage of customers (or revenue) that stay during a period. The mirror image of churn." },
    { q: "What's Net Revenue Retention (NRR)?", a: "Starting MRR plus expansion, minus contraction and churn, divided by starting MRR. NRR above 100% means existing customers grew more than they shrank." },
    { q: "What's a good NRR?", a: "Above 100% is strong. Above 120% is considered excellent for B2B SaaS. Some best-in-class businesses run 130-150% NRR." },
    { q: "Can NRR be over 100%?", a: "Yes - and it's the holy grail of subscription metrics. It means existing customers expand faster than churn. Growth happens even without new acquisition." },
    { q: "How is retention rate different from customer satisfaction?", a: "Satisfaction is what customers say; retention is what they do. They correlate but aren't identical - customers can be satisfied and still churn (lifecycle, market change), or dissatisfied and stay (switching cost)." },
    { q: "How do I improve retention?", a: "Better onboarding (early value realization), proactive customer success outreach, product improvements based on cancellation feedback, addressing low-engagement signals early." },
  ],
  seo: {
    title: "Retention Rate - Definition | Tweaxly Business Glossary",
    description: "Retention Rate is the percentage of customers retained during a period. Includes Net Revenue Retention. Plain English.",
    keywords: ["retention rate", "customer retention", "NRR", "net revenue retention", "retention formula"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The companion metric to churn. If churn measures who&apos;s
      leaving, retention measures who&apos;s staying. For
      subscription businesses, retention - especially Net Revenue
      Retention - is one of the strongest indicators of product-market
      fit.
    </Lead>

    <DefinitionBlock term="Retention Rate">
      the percentage of customers (or revenue) that stay during
      a period. Retention + Churn = 100%. Net Revenue Retention
      (NRR) goes further by factoring in expansion from existing
      customers.
    </DefinitionBlock>

    <Formula formula={"Customer Retention Rate = 1 − Churn Rate\n\nNet Revenue Retention (NRR) = (Starting MRR + Expansion − Contraction − Churn) ÷ Starting MRR × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Subscription health</strong> - the single best long-term indicator</li>
      <li><strong>Cohort analysis</strong> - retention by cohort surfaces what drives staying power</li>
      <li><strong>Investor reporting</strong> - NRR is one of the headline metrics</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Customer retention rate and revenue retention rate can differ significantly. A business losing many small customers but retaining big ones can have weak customer retention but strong revenue retention.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/churn-rate">Churn Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/customer-retention-cost">Customer Retention Cost</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Retention Rate = 100% − Churn Rate.",
      "NRR factors in expansion - can exceed 100%.",
      "NRR above 120% is exceptional for B2B SaaS.",
      "Customer retention and revenue retention can differ.",
    ]} />
  </>
);
