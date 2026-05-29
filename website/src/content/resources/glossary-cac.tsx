import {
  Lead, H2, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cac",
  title: "CAC",
  excerpt:
    "CAC: Customer Acquisition Cost. The average money spent to win one new customer. Foundational metric for any business spending on growth.",
  category: "business-glossary",
  tags: ["CAC", "Customer Acquisition", "Marketing"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Customer Acquisition Cost.",
    "Calculated as: Total sales & marketing spend ÷ new customers acquired (same period).",
    "Most useful when: Compared against LTV (Customer Lifetime Value). Healthy LTV:CAC is 3:1 or higher.",
    "Don't confuse with: Marketing spend (CAC includes salaries, tools, and everything required to acquire customers - not just paid ads).",
  ],
  faq: [
    { q: "What does CAC stand for?", a: "Customer Acquisition Cost - the average money spent to win one new customer." },
    { q: "What's included in CAC?", a: "Everything required to acquire customers: paid ads, content production, sales team salaries (proportionally), marketing tools and software, agency fees, events. The fully-loaded number; not just paid spend." },
    { q: "What's a good CAC?", a: "Meaningful only relative to LTV (Customer Lifetime Value). Aim for LTV:CAC ratio of 3:1 or higher. Below 1:1 means you lose money per customer. Absolute CAC numbers vary wildly by industry." },
    { q: "How often should I measure CAC?", a: "Monthly is right for most businesses. Trends month-over-month and quarter-over-quarter are more useful than any single month's number." },
    { q: "Is CAC different by industry?", a: "Wildly. B2B SaaS commonly runs $300-3,000+. E-commerce $20-100. Financial services $200-500. Local services $50-300. Compare to your industry, not absolute numbers." },
    { q: "What's CAC payback period?", a: "How many months of customer revenue (or gross profit) it takes to earn back the CAC. CAC ÷ monthly gross profit per customer = payback in months. Under 12 months is healthy for most businesses." },
    { q: "Why does CAC rise over time?", a: "The cheapest customers (existing network, organic, easy paid channels) get acquired first. Later customers come from more expensive channels or require more effort to convert. Plan for CAC creep." },
  ],
  seo: {
    title: "CAC - Customer Acquisition Cost Definition | Tweaxly",
    description:
      "CAC stands for Customer Acquisition Cost. The average money spent to win one new customer. Includes salaries, tools, and ads.",
    keywords: [
      "CAC",
      "customer acquisition cost",
      "CAC definition",
      "what is CAC",
      "CAC formula",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      One of the most important unit economics metrics in any
      business that spends to acquire customers. Tells you what
      it costs to add one more customer to your base.
    </Lead>

    <DefinitionBlock term="CAC (Customer Acquisition Cost)">
      the average amount of money spent to acquire one new
      customer, calculated by dividing total sales and marketing
      spend over a period by the number of new customers won
      in that same period.
    </DefinitionBlock>

    <H2 id="how-to-calculate">How to calculate it</H2>

    <p>
      <strong>CAC = Total sales & marketing spend ÷ New
      customers acquired (same period)</strong>
    </p>

    <p>
      Use fully-loaded spend, not just paid advertising. Include
      salaries, tools, content, and any cost required to acquire
      customers.
    </p>

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Unit economics</strong> - compared to LTV to
        determine if growth pays back
      </li>
      <li>
        <strong>Channel evaluation</strong> - breaking CAC down
        by channel shows which work
      </li>
      <li>
        <strong>Marketing budget decisions</strong> - what to
        spend, where
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Paid-only CAC (just ad spend ÷ new customers) is a
      different number than fully-loaded CAC. Always be clear
      which one you&apos;re quoting.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/business-metrics-kpis/what-is-customer-acquisition-cost-cac">
        What Is Customer Acquisition Cost (CAC)?
      </ArticleLink>
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/ltv">
          LTV (Customer Lifetime Value)
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
        <ArticleLink href="/resources/business-glossary/runway">
          Runway
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/burn-rate">
          Burn Rate
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "CAC = total sales & marketing spend ÷ new customers acquired.",
      "Always quote fully-loaded CAC (including salaries and tools), not just paid spend.",
      "Most useful compared to LTV. Aim for LTV:CAC ≥ 3:1.",
      "CAC rises as you scale. Plan for it.",
    ]} />
  </>
);
