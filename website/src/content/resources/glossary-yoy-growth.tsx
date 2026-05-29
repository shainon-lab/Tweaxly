import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "yoy-growth",
  title: "YoY Growth",
  excerpt:
    "YoY Growth: Year-over-Year growth. Comparison to the same period a year ago. Cancels out seasonality; reflects underlying trend.",
  category: "business-glossary",
  tags: ["YoY Growth", "Growth Rate", "Trend"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Year-over-Year growth.",
    "Formula: YoY = (This period − Same period last year) ÷ Same period last year × 100%.",
    "Tells you: Underlying trend, with seasonality cancelled out.",
    "Slower than MoM: Takes months to reflect a new trajectory.",
    "Standard for: Board updates, investor reports, strategic planning.",
  ],
  faq: [
    { q: "What's YoY growth?", a: "Year-over-Year growth - the percentage change from a period to the same period a year ago. November 2026 revenue vs November 2025 revenue." },
    { q: "Why use YoY instead of MoM?", a: "YoY cancels out seasonality and short-term noise. A retailer's October-vs-November MoM is misleading; October 2026 vs October 2025 is meaningful." },
    { q: "When does YoY mislead?", a: "When the prior-year period was unusual - a record month, an outage, a one-off event. Always sanity-check the comparison period." },
    { q: "What's a good YoY growth rate?", a: "Depends on stage and category. Early-stage businesses can do 100%+ YoY. Mid-stage 30-80%. Mature 10-30%. Compare against your industry and stage." },
    { q: "How is YoY ARR growth quoted?", a: "Current ARR divided by ARR 12 months ago, minus 1. A SaaS business at $600K ARR vs $400K ARR last year has 50% YoY ARR growth." },
    { q: "Should I use YoY or MoM?", a: "Both. YoY for the underlying trend; MoM for operational pace. Watching only one means missing what the other catches." },
  ],
  seo: {
    title: "YoY Growth - Year-over-Year Definition | Tweaxly",
    description: "YoY Growth is Year-over-Year growth - comparison to the same period a year ago. Cancels out seasonality. Plain English definition.",
    keywords: ["YoY growth", "year over year growth", "YoY definition", "annual growth rate", "MoM vs YoY"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The growth metric for the underlying trend. YoY cancels out
      seasonality, holidays, and short-term noise to show what&apos;s
      actually happening to the business over time.
    </Lead>

    <DefinitionBlock term="YoY Growth (Year-over-Year)">
      the percentage change in a metric from one period to the
      same period a year ago. Reflects long-term trajectory and
      cancels out seasonality.
    </DefinitionBlock>

    <Formula formula={"YoY Growth = (This Period − Same Period Last Year) ÷ Same Period Last Year × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Strategic planning</strong> - the trend that informs longer-term decisions</li>
      <li><strong>Board updates</strong> - the standard headline growth metric</li>
      <li><strong>Investor reporting</strong> - what acquirers and lenders ask about</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A YoY comparison against an unusual prior period (record month, one-off event) will distort the picture either direction. Always sanity-check the comparison base.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/mom-growth">MoM Growth</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "YoY = (this period − same period last year) ÷ same period last year × 100%.",
      "Cancels seasonality - the standard for long-term trends.",
      "Slower than MoM but less noisy.",
      "Sanity-check the prior-year comparison base.",
    ]} />
  </>
);
