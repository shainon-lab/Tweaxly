import {
  Lead, H2, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "ltv",
  title: "LTV",
  excerpt:
    "LTV: Customer Lifetime Value. The total profit a business expects from one customer over the full relationship. Half of the unit economics equation.",
  category: "business-glossary",
  tags: ["LTV", "Lifetime Value", "Unit Economics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Customer Lifetime Value (sometimes CLV or CLTV).",
    "Definition: The total gross profit expected from one customer across the entire relationship.",
    "Always use gross profit, not revenue - revenue-based LTV is misleading.",
    "Subscription formula: LTV = (Average revenue per customer × Gross margin) ÷ Monthly churn rate.",
    "Most useful when compared to CAC. Healthy LTV:CAC ratio is 3:1 or higher.",
  ],
  faq: [
    { q: "What does LTV stand for?", a: "Customer Lifetime Value (sometimes written CLV or CLTV). The total gross profit expected from one customer across the entire relationship." },
    { q: "Should I use revenue or gross profit in LTV?", a: "Gross profit. Revenue overstates customer value by ignoring the cost to serve each customer (payment processing, hosting, support, fulfillment). Revenue-based LTV will tell you to spend acquisition dollars you can't actually afford." },
    { q: "How do I estimate average customer lifetime?", a: "For subscription businesses: 1 ÷ monthly churn rate. A 4% monthly churn rate implies 25 months average lifetime. For non-subscription: average time between first and last purchase among customers you've had long enough to measure." },
    { q: "What's a good LTV:CAC ratio?", a: "3:1 is the conventional benchmark for healthy unit economics. Below 1:1 means you lose money per customer. Above 5:1 often means you could be growing faster." },
    { q: "How often should I recalculate LTV?", a: "Quarterly is the right cadence for most businesses. More often than that and noise drowns out signal; less often and you miss material shifts in retention or pricing." },
    { q: "What are the levers to improve LTV?", a: "Three: reduce churn (retention), increase average revenue per customer (pricing, upsell), and improve gross margin (lower cost to serve)." },
    { q: "Does LTV change as the business grows?", a: "Yes - usually in both directions. Better retention practices push LTV up; cohort mix shifts (cheaper plans, less ideal customers) push it down. Track LTV by cohort, not just overall." },
  ],
  seo: {
    title: "LTV - Customer Lifetime Value Definition | Tweaxly",
    description:
      "LTV stands for Customer Lifetime Value. The total gross profit expected from one customer. Half of the unit economics equation alongside CAC.",
    keywords: [
      "LTV",
      "customer lifetime value",
      "CLV",
      "LTV definition",
      "what is LTV",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      If CAC tells you what a customer costs, LTV tells you what
      they&apos;re worth. Knowing both is the only way to know
      whether your business model works. Knowing only one is
      worse than useless - it&apos;s actively misleading.
    </Lead>

    <DefinitionBlock term="LTV (Customer Lifetime Value)">
      the total gross profit your business expects to earn
      from a single customer across the full duration of the
      relationship.
    </DefinitionBlock>

    <Formula
      formula={"Subscription business:\nLTV = (Average revenue per customer per month × Gross margin) ÷ Monthly churn rate\n\nNon-subscription:\nLTV = Average gross profit per purchase × Average number of purchases over customer lifetime"}
    />

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Unit economics</strong> - the value half of
        the LTV:CAC ratio
      </li>
      <li>
        <strong>Customer segmentation</strong> - by-segment LTV
        identifies which customers are most valuable
      </li>
      <li>
        <strong>Pricing decisions</strong> - LTV impact of
        pricing changes
      </li>
      <li>
        <strong>Acquisition budget</strong> - how much you can
        afford to spend acquiring a customer
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Always use gross profit, not revenue. Revenue-based LTV
      ignores the cost to serve customers and produces a
      misleading number.
    </p>

    <p>
      LTV is an estimate, not a fact. Use conservative inputs.
      Recalculate quarterly. Look at LTV by cohort - averages
      hide important trends.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-lifetime-value-ltv">
        What Is Customer Lifetime Value (LTV)?
      </ArticleLink>
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/cac">
          CAC (Customer Acquisition Cost)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/mrr">
          MRR (Monthly Recurring Revenue)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/arr">
          ARR (Annual Recurring Revenue)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/gross-profit">
          Gross Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "LTV = total gross profit expected from one customer over the relationship.",
      "Always use gross profit, never revenue.",
      "Subscription LTV ≈ (ARPU × gross margin) ÷ monthly churn rate.",
      "Most useful compared to CAC. Aim for LTV:CAC ≥ 3:1.",
    ]} />
  </>
);
