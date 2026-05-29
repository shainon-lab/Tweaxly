import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "customer-retention-cost",
  title: "Customer Retention Cost",
  excerpt:
    "Customer Retention Cost (CRC): the amount spent to retain existing customers. The often-overlooked counterpart to CAC.",
  category: "business-glossary",
  tags: ["Customer Retention Cost", "CRC", "Retention"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Total cost of retaining existing customers - customer success, support, renewal management, retention marketing.",
    "Formula: Total Retention Spend ÷ Number of Customers Retained.",
    "Tracks alongside: CAC. Healthy ratio CAC:CRC roughly 5:1 to 7:1.",
    "Often underweighted: Many businesses obsess over acquisition cost and never measure retention cost.",
    "Includes: CSM salaries, support team allocation, retention tools, win-back campaigns.",
  ],
  faq: [
    { q: "What's customer retention cost?", a: "The cost of keeping existing customers - customer success, support, renewal management, retention marketing, account management." },
    { q: "How is CRC calculated?", a: "Total retention spend over a period divided by the number of customers retained. Most businesses don't calculate this rigorously; the discipline alone produces value." },
    { q: "How is CRC different from CAC?", a: "CAC is the cost to acquire new customers. CRC is the cost to retain existing ones. They serve different functions and typically have different teams and budgets." },
    { q: "What's a healthy CAC-to-CRC ratio?", a: "Generally 5:1 to 7:1 (acquisition costs 5-7x retention). If CRC approaches CAC, you're spending too much per retained dollar; if CRC is too low, retention may be suffering." },
    { q: "Should I budget retention separately?", a: "Yes. Without explicit retention budget, it gets crowded out by acquisition. Track retention spend, retention metrics, and the cost-effectiveness of retention activities." },
    { q: "What's the ROI of retention spending?", a: "Usually higher than acquisition - retaining a customer is typically 5-7x cheaper than acquiring a new one. The math depends on your CAC, LTV, and churn dynamics." },
  ],
  seo: {
    title: "Customer Retention Cost - Definition | Tweaxly",
    description: "Customer Retention Cost (CRC) is the cost of keeping existing customers. The often-overlooked counterpart to CAC.",
    keywords: ["customer retention cost", "CRC", "retention spending", "CAC vs CRC", "retention budget"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The companion to CAC that most businesses don&apos;t
      measure. Customer Retention Cost captures the spend that
      goes into keeping customers - and businesses that
      track it consistently find they&apos;re either
      under-investing in retention or paying too much per
      retained customer.
    </Lead>

    <DefinitionBlock term="Customer Retention Cost (CRC)">
      the total cost of activities aimed at keeping existing
      customers - customer success teams, support allocated to
      retention, renewal management, retention marketing,
      account management, retention tools.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Retention ROI</strong> - is your retention spend producing the retention rate it should?</li>
      <li><strong>Budget allocation</strong> - how much should go to acquisition vs retention?</li>
      <li><strong>Customer success team sizing</strong> - based on accounts per CSM and target retention</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Retention spend that doesn&apos;t reduce churn isn&apos;t producing returns. Track CRC against retention rate over time; sustained retention with rising CRC means the spend isn&apos;t working.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cac">CAC</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/retention-rate">Retention Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/churn-rate">Churn Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/customer-payback-period">Customer Payback Period</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "CRC = total cost of keeping existing customers.",
      "Often underweighted compared to CAC.",
      "Healthy CAC:CRC ratio around 5:1 to 7:1.",
      "Track CRC against retention rate to evaluate effectiveness.",
    ]} />
  </>
);
