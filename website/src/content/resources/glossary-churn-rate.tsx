import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "churn-rate",
  title: "Churn Rate",
  excerpt:
    "Churn Rate: the percentage of customers (or revenue) that leave during a period. The single most important retention metric for subscription businesses.",
  category: "business-glossary",
  tags: ["Churn Rate", "Retention", "Subscription"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: The percentage of customers (or revenue) lost during a period.",
    "Two flavors: Customer churn (count) and revenue churn (MRR lost).",
    "Formula: Churn Rate = Customers Lost ÷ Customers at Start × 100% (monthly).",
    "Healthy ranges: SaaS 2-5% monthly customer churn; B2B often 1-2%; consumer 5%+.",
    "Inverse of: Retention rate. Churn + Retention = 100%.",
  ],
  faq: [
    { q: "What's churn rate?", a: "The percentage of customers (or revenue) that left during a period - cancelled, didn't renew, or stopped paying. Usually expressed monthly or annually." },
    { q: "What's the difference between customer churn and revenue churn?", a: "Customer churn measures count of customers lost. Revenue churn measures MRR lost. They can differ when high-revenue customers churn at different rates than low-revenue ones." },
    { q: "What's gross vs net churn?", a: "Gross churn measures only customers/revenue lost. Net churn factors in expansion from remaining customers - and can be negative when expansion exceeds churn." },
    { q: "What's a good monthly churn rate?", a: "Depends on category. B2B SaaS: 1-2% monthly customer churn is healthy. Mid-market SaaS: 2-5%. Consumer apps: 5%+. Lower is always better." },
    { q: "How does churn affect LTV?", a: "Massively. LTV for subscription businesses is approximately (ARPU × Gross Margin) ÷ Monthly Churn. Halving churn doubles LTV." },
    { q: "What causes churn?", a: "Poor onboarding, lack of value realization, competitor switching, product issues, pricing changes, customer financial trouble, lifecycle (natural usage ending)." },
  ],
  seo: {
    title: "Churn Rate - Definition | Tweaxly Business Glossary",
    description: "Churn Rate is the percentage of customers (or revenue) that leave during a period. Plain-English definition with formula and benchmarks.",
    keywords: ["churn rate", "what is churn", "customer churn", "revenue churn", "subscription churn"],
  },
};

export const Body = () => (
  <>
    <Lead>
      For any business with recurring revenue, churn is one of
      the most consequential metrics. Small differences compound
      dramatically - cutting monthly churn from 5% to 3%
      increases customer lifetime by 65%.
    </Lead>

    <DefinitionBlock term="Churn Rate">
      the percentage of customers (or revenue) lost during a
      period. Customer churn measures count of customers lost;
      revenue churn measures MRR lost.
    </DefinitionBlock>

    <Formula formula={"Monthly Customer Churn = Customers Lost ÷ Customers at Start × 100%\n\nMonthly Revenue Churn = Churned MRR ÷ Starting MRR × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>LTV calculation</strong> - average customer lifetime = 1 ÷ monthly churn</li>
      <li><strong>Cohort analysis</strong> - tracking churn by acquisition cohort surfaces patterns</li>
      <li><strong>Investor reporting</strong> - one of the headline SaaS metrics</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Net churn can be more important than gross churn. A business with 5% gross monthly churn but 8% expansion revenue from remaining customers has negative net churn - one of the strongest signals in business.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/retention-rate">Retention Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/customer-retention-cost">Customer Retention Cost</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Churn = percentage of customers or revenue lost per period.",
      "Customer churn = count. Revenue churn = MRR.",
      "Inverse of retention. Halving churn doubles customer lifetime.",
      "Net churn (factoring in expansion) can be negative - the strongest signal.",
    ]} />
  </>
);
