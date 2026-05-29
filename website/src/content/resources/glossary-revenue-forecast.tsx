import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "revenue-forecast",
  title: "Revenue Forecast",
  excerpt:
    "Revenue Forecast: a projection of future revenue based on current activity, historical patterns, and explicit assumptions.",
  category: "business-glossary",
  tags: ["Revenue Forecast", "Forecasting", "Sales"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: A projection of future revenue based on current data + assumptions.",
    "Common methods: Trend extrapolation, top-down, bottom-up, driver-based, pipeline-based.",
    "Horizons: Short (1-3 months), medium (3-12), long-term (1-3 years).",
    "Accuracy expectations: ±10% at 3 months, ±15-25% at 12 months.",
    "Updated: Monthly with actuals.",
  ],
  faq: [
    { q: "What's a revenue forecast?", a: "A projection of future revenue based on current activity, historical patterns, and stated assumptions about what will change." },
    { q: "Which forecasting method is most accurate?", a: "Depends on business and horizon. Pipeline-based is most accurate for short-term B2B sales. Driver-based is most diagnostic. Trend extrapolation is simplest. Most businesses combine methods." },
    { q: "How accurate should a revenue forecast be?", a: "For 3 months out, ±10% is realistic. For 6-12 months, ±15-25% is normal. Beyond 12 months, treat as directional." },
    { q: "How often should I update?", a: "Monthly. After actuals close, plug them in, revise assumptions, re-project forward." },
    { q: "What's bottom-up vs top-down?", a: "Top-down: market size × share = revenue. Bottom-up: current activity built up by category. Bottom-up is usually more accurate; top-down is useful for strategic planning." },
    { q: "Should I forecast by customer or in aggregate?", a: "Top 10-20% individually (they materially affect the forecast). Long tail in aggregate." },
  ],
  seo: {
    title: "Revenue Forecast - Definition | Tweaxly Business Glossary",
    description: "Revenue Forecast is a projection of future revenue. Plain-English definition with methods and accuracy expectations.",
    keywords: ["revenue forecast", "what is a revenue forecast", "revenue projection", "sales forecast", "forecasting methods"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The primary forecast every business needs. Revenue
      forecasts anchor everything downstream - expense
      planning, cash projections, hiring decisions, capital
      allocation.
    </Lead>

    <DefinitionBlock term="Revenue Forecast">
      a projection of future revenue based on current activity,
      historical patterns, and explicit assumptions about what
      will change. Built bottom-up, top-down, by driver, or by
      pipeline depending on business model.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Cash flow projection</strong> - revenue feeds into the cash forecast</li>
      <li><strong>Resource planning</strong> - hiring, marketing budgets, capacity decisions</li>
      <li><strong>Investor and lender conversations</strong> - the basis for funding decisions</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Optimism inflates revenue forecasts. The realistic forecast usually feels uncomfortably slow compared to gut estimates - check assumptions against historical track record.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/forecast">Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/expense-forecast">Expense Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/scenario-planning">Scenario Planning</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variance">Variance</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Revenue forecast = projection of future revenue.",
      "Methods: trend, top-down, bottom-up, driver-based, pipeline.",
      "Accuracy: ±10% at 3 months, ±15-25% at 12 months.",
      "Update monthly with actuals.",
    ]} />
  </>
);
