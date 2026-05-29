import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-flow",
  title: "Cash Flow",
  excerpt:
    "Cash Flow: the actual money moving in and out of a business over a period. Different from profit. Determines short-term survival.",
  category: "business-glossary",
  tags: ["Cash Flow", "Cash", "Liquidity"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: The actual money moving in and out of a business over a period.",
    "Calculated as: Cash collected − Cash paid out over the period.",
    "Different from: Profit (cash flow is what's actually in the bank; profit is what was earned on paper).",
    "Three buckets: Operating cash flow (core business), investing (assets), financing (debt/equity).",
    "Watch it: Weekly for tight businesses; monthly minimum for any business.",
  ],
  faq: [
    { q: "What's cash flow in plain English?", a: "The actual money flowing in and out of your bank account over a period. Cash in (customer payments, loans) minus cash out (payroll, vendors, taxes)." },
    { q: "How is cash flow different from profit?", a: "Profit is what you earned on paper; cash flow is what actually moved through the bank. They can disagree significantly because of timing, non-cash expenses, and balance-sheet movements." },
    { q: "Can a profitable business have negative cash flow?", a: "Yes - and it's common during growth. Profit shows revenue when earned; cash flow shows it when collected. The gap between them is where cash crunches happen." },
    { q: "What are the three types of cash flow?", a: "Operating (from the core business), investing (buying/selling assets), and financing (loans, equity, distributions). Operating cash flow is the most important." },
    { q: "What's free cash flow?", a: "Operating cash flow minus capital expenditures. The cash actually available for owners, growth, or savings." },
    { q: "Why does cash flow matter more than profit short-term?", a: "Because bills are paid in cash, not in profit. A business with strong profit but no cash can't make payroll." },
  ],
  seo: {
    title: "Cash Flow - Definition | Tweaxly Business Glossary",
    description: "Cash Flow is the actual money in and out of a business. A plain-English definition with operating, investing, and financing types.",
    keywords: ["cash flow", "what is cash flow", "operating cash flow", "free cash flow", "business cash flow"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most important number for short-term business
      survival. Profit determines long-term viability; cash flow
      determines whether you can pay the bills due next week.
    </Lead>

    <DefinitionBlock term="Cash Flow">
      the actual money moving in and out of a business over a
      period - cash collected (from customers, loans, investors)
      minus cash paid out (to vendors, employees, lenders).
      Distinct from profit, which is what was earned on paper.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Short-term survival</strong> - whether the business can cover bills due this week / month</li>
      <li><strong>Cash flow forecasting</strong> - the 13-week rolling projection that anticipates crunches</li>
      <li><strong>Investment decisions</strong> - capital allocation depends on cash availability, not profit</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Don&apos;t spend against profit without checking cash. Profitable businesses run out of cash regularly - one of the most common failure modes for fast-growing companies.
    </p>
    <p>
      Full explanation:{" "}
      <ArticleLink href="/resources/cash-flow-management/what-is-cash-flow">What Is Cash Flow</ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/free-cash-flow">Free Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-reserve">Cash Reserve</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/burn-rate">Burn Rate</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/runway">Runway</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Cash flow = actual money in and out of the business.",
      "Three types: operating, investing, financing.",
      "Different from profit. Both are real; both matter.",
      "Short-term survival depends on cash, not profit.",
    ]} />
  </>
);
