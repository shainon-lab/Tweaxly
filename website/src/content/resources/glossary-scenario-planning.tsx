import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "scenario-planning",
  title: "Scenario Planning",
  excerpt:
    "Scenario Planning: building 2-3 versions of a forecast under different assumptions to understand the range of likely outcomes.",
  category: "business-glossary",
  tags: ["Scenario Planning", "Forecasting", "Risk Management"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Building multiple forecast versions under different assumptions.",
    "Standard three: Base case, downside, upside.",
    "Purpose: See how the business behaves across the range of outcomes.",
    "Pre-deciding actions: Each scenario should have a pre-planned response.",
    "Updated: Quarterly for most businesses.",
  ],
  faq: [
    { q: "What's scenario planning?", a: "The discipline of building 2-3 versions of the same forecast under different assumptions, to see how the business behaves across the range of likely outcomes." },
    { q: "What are the standard scenarios?", a: "Base case (most likely), downside (what could go wrong), upside (what could go better than planned). Three brackets the realistic range." },
    { q: "What should I vary across scenarios?", a: "Things you're most uncertain about: revenue growth, customer concentration risk, expense trajectory, timing of major events." },
    { q: "What's the point of scenario planning?", a: "Not predicting the future - bracketing it. Seeing cash position, profitability, and key decisions across multiple scenarios reveals which decisions are robust vs fragile." },
    { q: "How do I respond to scenarios?", a: "Pre-decide actions for each: \"if downside unfolds, I'll defer hires and cut marketing.\" Pre-deciding removes the paralysis when reality starts heading in that direction." },
    { q: "How often should I update scenarios?", a: "Quarterly for most businesses. More often when conditions change rapidly. Less often when stable." },
  ],
  seo: {
    title: "Scenario Planning - Definition | Tweaxly Business Glossary",
    description: "Scenario Planning means building multiple forecasts under different assumptions to bracket the range of outcomes.",
    keywords: ["scenario planning", "what is scenario planning", "base case downside upside", "scenario analysis"],
  },
};

export const Body = () => (
  <>
    <Lead>
      A single forecast pretends the future is knowable.
      Scenarios admit it isn&apos;t and plan accordingly. The
      discipline produces better decisions because it forces
      you to see the range of outcomes rather than the
      optimistic case alone.
    </Lead>

    <DefinitionBlock term="Scenario Planning">
      the practice of building 2-3 versions of a financial
      forecast, each under a different set of assumptions, to
      understand the range of likely outcomes and pre-plan
      responses for each.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Strategic decisions</strong> - testing how decisions hold up across scenarios</li>
      <li><strong>Cash management</strong> - ensuring reserves and runway work in the downside</li>
      <li><strong>Investor and lender conversations</strong> - showing you&apos;ve thought through risk</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A &quot;downside&quot; scenario that doesn&apos;t actually feel uncomfortable is just base case dressed up as conservative. Make the downside genuinely scary.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/forecast">Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/budget">Budget</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/expense-forecast">Expense Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-reserve">Cash Reserve</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Scenario planning = multiple forecasts under different assumptions.",
      "Standard three: base, downside, upside.",
      "The point is seeing the range, not predicting one number.",
      "Pre-decide actions for each scenario.",
    ]} />
  </>
);
