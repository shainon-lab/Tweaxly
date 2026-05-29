import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "mom-growth",
  title: "MoM Growth",
  excerpt:
    "MoM Growth: Month-over-Month growth. The percentage change from one month to the next. Fast, noisy, useful for operational pace.",
  category: "business-glossary",
  tags: ["MoM Growth", "Growth Rate", "Metrics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Month-over-Month growth.",
    "Formula: MoM = (This month − Last month) ÷ Last month × 100%.",
    "Tells you: Short-term momentum.",
    "Noisy: Highly sensitive to one-offs, holidays, calendar effects.",
    "Pair with: YoY (Year-over-Year) growth to separate momentum from underlying trend.",
  ],
  faq: [
    { q: "What's MoM growth?", a: "Month-over-Month growth - the percentage change from one month to the immediately preceding month. (This month − Last month) ÷ Last month × 100%." },
    { q: "Why is MoM noisy?", a: "Most businesses have month-to-month variation from weekends, holidays, big deals timing, and one-off events. Any single month's MoM is rarely meaningful in isolation - the trend matters." },
    { q: "When is MoM most useful?", a: "Operational pace, early signals, weekly or monthly reviews. Especially useful for fast-growing businesses where YoY comparisons aren't yet meaningful." },
    { q: "What's the difference between MoM and YoY?", a: "MoM compares to last month; YoY compares to the same month a year ago. MoM is faster but noisier; YoY is slower but cancels out seasonality." },
    { q: "What's compound monthly growth rate (CMGR)?", a: "The constant monthly growth rate that produces the observed change over a longer period. CMGR = (Ending ÷ Starting)^(1/months) − 1. More accurate than simple averages for fast-growing businesses." },
    { q: "When does MoM mislead?", a: "Seasonal businesses - November vs October MoM is meaningless for a retailer. Use YoY for businesses with predictable seasonality." },
  ],
  seo: {
    title: "MoM Growth - Month-over-Month Definition | Tweaxly",
    description: "MoM Growth is Month-over-Month growth - the percentage change from one month to the next. Plain-English definition with formula.",
    keywords: ["MoM growth", "month over month growth", "MoM definition", "growth rate", "MoM vs YoY"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The fast-twitch growth metric. MoM tells you what changed
      since last month - useful for operational pace, less useful
      for assessing the underlying trend. Always pair with YoY
      for the fuller picture.
    </Lead>

    <DefinitionBlock term="MoM Growth (Month-over-Month)">
      the percentage change in a metric from one month to the
      immediately preceding month. Reflects short-term momentum.
    </DefinitionBlock>

    <Formula formula={"MoM Growth = (This Month − Last Month) ÷ Last Month × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Operational reviews</strong> - what changed this month vs last?</li>
      <li><strong>Early-stage growth tracking</strong> - when YoY isn&apos;t yet meaningful</li>
      <li><strong>Pipeline and pace metrics</strong> - faster signals than YoY</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Single-month moves are usually noise. Two months in the same direction is the threshold for treating as signal. For seasonal businesses, MoM by itself misleads - use YoY.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/yoy-growth">YoY Growth</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/financial-run-rate">Financial Run Rate</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "MoM = (this month − last month) ÷ last month × 100%.",
      "Fast, noisy, reflects momentum.",
      "Single months are usually noise; two-month trends are signal.",
      "Misleads for seasonal businesses - pair with YoY.",
    ]} />
  </>
);
