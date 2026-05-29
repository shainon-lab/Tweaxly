import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "growth-rate",
  title: "Growth Rate",
  excerpt:
    "Growth Rate: the percentage change in a metric over a period. The standard way to talk about how fast a business is moving.",
  category: "business-glossary",
  tags: ["Growth Rate", "Metrics", "Growth"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: The percentage change in a metric over a defined period.",
    "Common forms: MoM, QoQ, YoY, CMGR (Compound Monthly Growth Rate).",
    "Applied to: Revenue, customer count, MRR, ARR, profit, almost any metric.",
    "Faster growth: Not always healthier. Sustainable growth matters more than peak growth.",
    "Reporting tip: Always quote growth rate alongside absolute number for context.",
  ],
  faq: [
    { q: "What's a growth rate?", a: "The percentage change in a metric over a defined period - month-over-month, quarter-over-quarter, year-over-year, or longer." },
    { q: "What's a healthy growth rate?", a: "Depends on metric, stage, and category. SaaS ARR: 20-50% YoY at scale is strong. Service businesses: 20-30% YoY. Early-stage: 100%+ YoY is common. Compare to your industry." },
    { q: "Is faster growth always better?", a: "No. Unsustainable growth often destroys more value than it creates. Sustainable growth that the business can actually fund and operate is usually more valuable than peak growth that breaks things." },
    { q: "What's CMGR (Compound Monthly Growth Rate)?", a: "The constant monthly growth rate that produces the observed change. CMGR = (Ending ÷ Starting)^(1/months) − 1. Useful for fast-growing businesses where simple averages mislead." },
    { q: "Should I quote growth as percent or absolute?", a: "Both, always together. \"30% growth\" sounds different on $100K than on $100M revenue. Without context, percentage growth is incomplete." },
    { q: "How do I tell good growth from bad growth?", a: "Check unit economics (LTV:CAC), cash flow (can you fund it?), and operational quality (can you deliver it?). Growth that fails any of these is unsustainable." },
  ],
  seo: {
    title: "Growth Rate - Definition | Tweaxly Business Glossary",
    description: "Growth Rate is the percentage change in a metric over a period. Plain-English definition with MoM, YoY, and CMGR explained.",
    keywords: ["growth rate", "what is growth rate", "MoM growth", "YoY growth", "business growth rate"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The standard way to describe how fast a business is
      changing. Growth rates can apply to revenue, customer
      count, MRR, profit - almost any metric. The most-asked
      question in business reporting is usually some version of
      &quot;what&apos;s the growth rate?&quot;
    </Lead>

    <DefinitionBlock term="Growth Rate">
      the percentage change in a metric over a defined period.
      Common forms: month-over-month (MoM), quarter-over-quarter
      (QoQ), year-over-year (YoY), and compound monthly growth
      rate (CMGR).
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Performance comparison</strong> - period over period, business vs business</li>
      <li><strong>Investor and lender conversations</strong> - the most-quoted metric in funding</li>
      <li><strong>Forecasting baseline</strong> - assumptions for future periods start with recent growth rates</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Growth rate alone doesn&apos;t tell you about quality. A business with 50% growth at deteriorating LTV:CAC is in worse shape than one with 25% growth at stable unit economics.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/mom-growth">MoM Growth</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/yoy-growth">YoY Growth</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Growth Rate = percentage change in a metric over a period.",
      "Forms: MoM, QoQ, YoY, CMGR.",
      "Always quote alongside absolute number for context.",
      "Faster isn't always better - sustainable growth matters more than peak.",
    ]} />
  </>
);
