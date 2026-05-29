import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "accounts-aging",
  title: "Accounts Aging",
  excerpt:
    "Accounts Aging: a report that classifies receivables (or payables) by how long they've been outstanding. The standard cash flow management tool.",
  category: "business-glossary",
  tags: ["Accounts Aging", "AR Aging", "Receivables"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Report showing how long receivables (or payables) have been outstanding.",
    "Standard buckets: Current (0-30 days), 31-60, 61-90, 90+.",
    "Tells you: Which invoices are at risk and how aggressive collection should be.",
    "Earliest warning: AR aging into older buckets signals customer financial stress or process drift.",
    "Reviewed: Weekly for tight businesses; monthly minimum.",
  ],
  faq: [
    { q: "What's an accounts aging report?", a: "A report classifying accounts receivable (or payable) by how long they've been outstanding - typically in 30-day buckets: current, 31-60, 61-90, 90+." },
    { q: "Why does aging matter?", a: "Aging is one of the earliest warning signs of cash flow trouble. AR drifting into older buckets means customers are paying slower (or not at all), which translates to cash crunches 30-60 days later." },
    { q: "What's a healthy aging profile?", a: "80%+ of AR in current (0-30 days). Less than 5% in 90+ days. The exact targets depend on your payment terms and industry." },
    { q: "What should I do with aging AR?", a: "Aggressive follow-up on 30-60 day items. Escalation on 60-90. Consideration of collections or write-off for 90+. The path of least resistance is bad debt; the path of most cash is discipline." },
    { q: "Is aging payables useful too?", a: "Yes - shows how long you're taking to pay vendors. Helpful for relationship management and cash flow planning." },
    { q: "How often should I review aging?", a: "Weekly for businesses with significant AR. Monthly minimum for any business. Aging drift is one of the cheapest warning signals you can monitor." },
  ],
  seo: {
    title: "Accounts Aging - Definition | Tweaxly Business Glossary",
    description: "Accounts Aging is a report classifying receivables by how long they've been outstanding. The standard cash flow management tool.",
    keywords: ["accounts aging", "AR aging", "aging report", "what is aging", "receivables aging"],
  },
};

export const Body = () => (
  <>
    <Lead>
      One of the most underrated diagnostic tools in small
      business finance. The accounts aging report tells you which
      invoices are at risk, which customers are slipping, and
      which cash you should already be chasing - all from a
      single view updated weekly.
    </Lead>

    <DefinitionBlock term="Accounts Aging">
      a report that classifies accounts receivable (or payable)
      by how long they have been outstanding, typically grouped
      into 30-day buckets: current, 31-60, 61-90, 90+ days.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Collections prioritization</strong> - oldest receivables get the most attention</li>
      <li><strong>Cash flow forecasting</strong> - aging informs expected collection timing</li>
      <li><strong>Early warning</strong> - aging drift is one of the earliest cash flow signals</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Receivables that age past 90 days are usually unlikely to be collected without escalation - sometimes only partial collection through write-down. Act earlier rather than later.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/accounts-receivable">Accounts Receivable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-payable">Accounts Payable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Aging classifies receivables by days outstanding.",
      "Standard buckets: current, 31-60, 61-90, 90+.",
      "Drift into older buckets is one of the earliest cash flow warnings.",
      "Act on aging earlier, not later - 90+ days is hard to collect.",
    ]} />
  </>
);
