import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "business-health-score",
  title: "Business Health Score",
  excerpt:
    "Business Health Score: a single 0 to 100 number that summarises how financially healthy a business is, derived from its financial statements.",
  category: "business-glossary",
  tags: ["Business Health Score", "Financial Review", "Financial Health", "KPIs"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-06-05",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: a single 0 to 100 score that summarises overall financial health.",
    "Built from profitability, cash, growth, and balance-sheet strength.",
    "A quick read, not a verdict - it points you to what to look at next.",
    "Typical bands: 90+ excellent, 75-89 healthy, 60-74 needs attention, below 60 high risk.",
    "Most useful as a trend over time, not a single snapshot.",
  ],
  faq: [
    { q: "What is a business health score?", a: "A single number, usually on a 0 to 100 scale, that summarises how financially healthy a business is. It blends signals like profitability, cash position, growth and balance-sheet strength into one easy-to-track figure." },
    { q: "How is a business health score calculated?", a: "By scoring several dimensions of the financials - profit margins, cash and liquidity, revenue trend, and how much the business owes - then combining them into one number. The exact weighting varies by tool; the value is consistency over time." },
    { q: "What is a good business health score?", a: "As a rough guide: 90 to 100 is excellent, 75 to 89 is healthy, 60 to 74 needs attention, and below 60 signals high risk. Bands matter less than the direction of travel from period to period." },
    { q: "Is a health score a replacement for an accountant?", a: "No. It is a fast summary that helps an owner understand where they stand and what to ask about. It does not replace professional accounting, tax or audit work - it points you toward the right conversations." },
    { q: "How does Tweaxly produce a health score?", a: "Tweaxly's Financial Review reads the financial report you upload, extracts the headline numbers, and produces a 0 to 100 health score alongside a plain-English summary, a second opinion, and the questions to ask your accountant." },
  ],
  seo: {
    title: "Business Health Score - Definition | Tweaxly Business Glossary",
    description: "A Business Health Score is a single 0 to 100 number summarising financial health, built from profitability, cash and balance-sheet strength. Plain English.",
    keywords: ["business health score", "financial health score", "company health score", "what is a health score", "financial review score"],
  },
};

export const Body = () => (
  <>
    <Lead>
      One number that tells you, at a glance, how the business is doing
      financially. A health score does not replace reading the statements -
      it points you straight to the parts worth reading.
    </Lead>

    <DefinitionBlock term="Business Health Score">
      a single figure, typically on a 0 to 100 scale, that summarises a
      business&apos;s overall financial health by combining several signals
      from its financial statements into one trackable number.
    </DefinitionBlock>

    <Formula formula={"Health Score (0-100) blends:\n  Profitability + Cash and Liquidity\n  + Revenue Trend + Balance-Sheet Strength"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Quick status</strong> - where does the business stand this period</li>
      <li><strong>Trend</strong> - is the score rising or falling over time</li>
      <li><strong>Triage</strong> - which area dragged the score down</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A score is a summary, not a diagnosis. A single high number can hide a
      weak{" "}
      <ArticleLink href="/resources/business-glossary/cash-flow-statement">cash flow statement</ArticleLink>{" "}
      or a fragile{" "}
      <ArticleLink href="/resources/business-glossary/balance-sheet">balance sheet</ArticleLink>, so always read the detail behind it.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/financial-second-opinion">Financial Second Opinion</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-margin">Net Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
    </ul>

    <p>
      See how the score is produced on the{" "}
      <ArticleLink href="/features/financial-review">Financial Review feature</ArticleLink>{" "}
      page, learn what feeds it in{" "}
      <ArticleLink href="/resources/financial-fundamentals/how-to-read-financial-statements">How to Read Your Financial Statements</ArticleLink>, and browse{" "}
      <ArticleLink href="/resources/business-intelligence">Business Intelligence &amp; Analytics</ArticleLink>.
    </p>

    <KeyTakeaways items={[
      "A single 0 to 100 summary of financial health.",
      "Blends profitability, cash, growth and balance-sheet strength.",
      "Read it as a trend, not a one-off verdict.",
      "A summary that points to the detail - not a replacement for it.",
    ]} />
  </>
);
