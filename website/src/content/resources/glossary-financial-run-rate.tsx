import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "financial-run-rate",
  title: "Financial Run Rate",
  excerpt:
    "Run Rate: extrapolation of current performance to a longer period. \"$1M run rate\" means current month × 12 = $1M.",
  category: "business-glossary",
  tags: ["Run Rate", "Annualization", "Projection"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Current short-period performance extrapolated to a longer period (usually annual).",
    "Example: $100K monthly revenue × 12 = $1.2M annual run rate.",
    "Used for: Quick projections, board updates, investor conversations.",
    "Don't confuse with: ARR (run rate is any metric; ARR is specifically recurring subscription revenue).",
    "Watch out: Run rate assumes nothing changes - rarely true in practice.",
  ],
  faq: [
    { q: "What's a financial run rate?", a: "A projection that extrapolates current short-period performance to a longer period. \"At a $5M annual run rate\" means the current monthly or quarterly pace × 12 (or 4) equals $5M." },
    { q: "How is run rate calculated?", a: "Most common: most recent month × 12. Sometimes: latest quarter × 4. Some businesses use a 3-month rolling average × 12 to smooth noise." },
    { q: "Is run rate the same as ARR?", a: "Related but distinct. ARR is specifically recurring subscription revenue × 12. Run rate is any metric (revenue, expenses, profit, cash flow) extrapolated forward." },
    { q: "Why use run rate instead of actual annual revenue?", a: "To capture current pace. A business that did $400K last year but is doing $100K/month now has a $1.2M run rate - showing current trajectory, not historical reality." },
    { q: "When does run rate mislead?", a: "When the current month is unusual (seasonal peak/trough, big one-off deal, holiday effect). A January retail run rate based on December is wildly optimistic." },
    { q: "Should I use run rate in financial planning?", a: "As a starting point only. Run rate is a quick estimation, not a forecast. Always sanity-check against seasonality, trends, and known upcoming changes." },
  ],
  seo: {
    title: "Financial Run Rate - Definition | Tweaxly",
    description: "Financial Run Rate is current performance extrapolated to a longer period. Plain-English definition with examples and limitations.",
    keywords: ["run rate", "financial run rate", "what is run rate", "annualized run rate", "run rate vs ARR"],
  },
};

export const Body = () => (
  <>
    <Lead>
      A common shortcut for projecting current performance to
      a longer period. Useful for quick estimates and
      conversation, dangerous if treated as forecast. Always
      sanity-check before acting on a run rate number.
    </Lead>

    <DefinitionBlock term="Financial Run Rate">
      an extrapolation of current short-period performance to
      a longer period - typically &quot;current monthly figure
      × 12&quot; to produce an annual run rate.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Quick projections</strong> - what does the current pace imply annually?</li>
      <li><strong>Investor conversations</strong> - the standard way to talk about &quot;where the business is right now&quot;</li>
      <li><strong>Board updates</strong> - run rate vs prior period or vs target</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Run rate assumes nothing changes - which is rarely true. Watch for seasonality, big one-off deals, holiday effects, and known upcoming changes. A run rate based on an unusual month produces an unusual number.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/arr">ARR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue-forecast">Revenue Forecast</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/yoy-growth">YoY Growth</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/growth-rate">Growth Rate</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Run rate = current performance × multiplier to longer period.",
      "Quick estimation, not a forecast.",
      "Watch for seasonality, one-offs, and upcoming changes.",
      "Distinct from ARR (which is specifically recurring revenue).",
    ]} />
  </>
);
