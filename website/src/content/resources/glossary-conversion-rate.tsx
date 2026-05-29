import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "conversion-rate",
  title: "Conversion Rate",
  excerpt:
    "Conversion Rate: the percentage of visitors, leads, or users who complete a desired action - sign up, buy, subscribe.",
  category: "business-glossary",
  tags: ["Conversion Rate", "Marketing Metrics", "Funnel"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: The percentage of people who complete a desired action out of the total who had the opportunity.",
    "Formula: Conversion Rate = (Conversions ÷ Total Audience) × 100%.",
    "Stage-specific: Each funnel stage has its own conversion rate (visit→signup, signup→trial, trial→paid).",
    "Drives revenue: Small conversion improvements compound across the funnel.",
    "Common range: E-commerce 2-5%, B2B SaaS 0.5-2% landing page, sales pipeline stages 15-60%.",
  ],
  faq: [
    { q: "What's a conversion rate?", a: "The percentage of people who take a desired action divided by the total who had the chance. 100 visitors and 3 sign up = 3% conversion rate." },
    { q: "What's a good conversion rate?", a: "Depends on the action and industry. E-commerce 2-5%. B2B SaaS landing pages 0.5-2%. Email signup 5-15%. Compare to your own baseline, not absolute numbers." },
    { q: "How do I improve conversion rate?", a: "Reduce friction, sharpen the value proposition, target the right audience, improve trust signals, simplify forms, A/B test specific elements." },
    { q: "What's a conversion funnel?", a: "The sequence of steps from first touchpoint to conversion - awareness → interest → consideration → purchase. Each stage has its own conversion rate." },
    { q: "Is a higher conversion rate always better?", a: "Not necessarily. Higher conversion can come from narrower targeting (fewer but better visitors), which means smaller total volume. Both quality and quantity matter." },
    { q: "How is conversion rate related to CAC?", a: "Lower conversion rate means more spend per conversion, which means higher CAC. Improving conversion is one of the most direct ways to reduce CAC without reducing total spend." },
  ],
  seo: {
    title: "Conversion Rate - Definition | Tweaxly Business Glossary",
    description: "Conversion Rate is the percentage of visitors or leads who complete a desired action. Plain-English definition with formula and benchmarks.",
    keywords: ["conversion rate", "what is conversion rate", "conversion rate formula", "funnel conversion", "marketing metrics"],
  },
};

export const Body = () => (
  <>
    <Lead>
      One of the most-watched metrics in any business that moves
      visitors or leads through a funnel. Small conversion
      improvements compound across stages and produce
      disproportionate revenue impact.
    </Lead>

    <DefinitionBlock term="Conversion Rate">
      the percentage of people who complete a desired action
      (signup, purchase, subscription, click) out of the total
      who had the opportunity. Each stage of a funnel has its
      own conversion rate.
    </DefinitionBlock>

    <Formula formula={"Conversion Rate = (Number of Conversions ÷ Total Audience) × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Marketing efficiency</strong> - measures how well marketing turns attention into action</li>
      <li><strong>Funnel optimization</strong> - identifies which stages have the most leakage</li>
      <li><strong>A/B testing</strong> - the standard outcome metric for experiments</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Conversion rate in isolation can mislead - a narrow audience can have great conversion but small volume. Watch conversion rate AND total conversions together.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cac">CAC (Customer Acquisition Cost)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/aov">Average Order Value (AOV)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/roas">ROAS (Return on Ad Spend)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/customer-payback-period">Customer Payback Period</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Conversion Rate = (Conversions ÷ Audience) × 100%.",
      "Each funnel stage has its own conversion rate.",
      "Small improvements compound across stages.",
      "Don't optimize in isolation - watch volume too.",
    ]} />
  </>
);
