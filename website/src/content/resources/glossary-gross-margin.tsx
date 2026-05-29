import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "gross-margin",
  title: "Gross Margin",
  excerpt:
    "Gross Margin: gross profit as a percentage of revenue. The standard way to measure product-level profitability across periods and businesses.",
  category: "business-glossary",
  tags: ["Gross Margin", "Gross Profit", "Margin"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Gross profit as a percentage of revenue.",
    "Formula: Gross Margin = Gross Profit ÷ Revenue × 100%.",
    "Tells you: How much of each dollar of revenue is left after direct production costs.",
    "Industry benchmarks: SaaS 70-85%, Services 40-60%, Retail 25-40%, Grocery <25%.",
    "Most useful for: Comparing across periods and against industry peers.",
  ],
  faq: [
    { q: "What's the difference between gross profit and gross margin?", a: "Gross profit is a dollar amount; gross margin is the same number as a percentage of revenue. A business with $100K revenue and $40K gross profit has a 40% gross margin." },
    { q: "What's a healthy gross margin?", a: "Depends entirely on industry. Software 70-85%, professional services 40-60%, retail 25-40%, grocery under 25%. Compare to industry, not absolute numbers." },
    { q: "What causes gross margin compression?", a: "Input cost inflation, hidden discounting, customer mix shift (more lower-margin customers), vendor price increases, payment processing fees creeping up." },
    { q: "How often should I watch gross margin?", a: "Monthly. Gross margin compression is one of the most reliable early warnings of structural trouble - catch it within 2-3 months." },
    { q: "Can gross margin be negative?", a: "Yes - it means you're selling each unit for less than it costs to produce. An existential problem; no scale fixes it." },
    { q: "How is gross margin different from net margin?", a: "Gross margin only subtracts direct production costs. Net margin subtracts everything (operating expenses, interest, taxes). Net is always smaller than gross." },
  ],
  seo: {
    title: "Gross Margin - Definition | Tweaxly Business Glossary",
    description: "Gross Margin is gross profit as a percentage of revenue. Plain-English definition with industry benchmarks and what compression signals.",
    keywords: ["gross margin", "what is gross margin", "gross margin formula", "gross margin by industry", "margin compression"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The percentage version of gross profit. Gross margin lets
      you compare profitability across periods and against
      industry peers in a way absolute dollar amounts can&apos;t.
    </Lead>

    <DefinitionBlock term="Gross Margin">
      gross profit expressed as a percentage of revenue. Tells
      you how much of each dollar of sales is left after the
      direct cost of producing that sale.
    </DefinitionBlock>

    <Formula formula={"Gross Margin = Gross Profit ÷ Revenue × 100%\n\nOr: Gross Margin = (Revenue − COGS) ÷ Revenue × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Industry benchmarking</strong> - compare to direct peers</li>
      <li><strong>Trend monitoring</strong> - the single best early warning for margin compression</li>
      <li><strong>Pricing analysis</strong> - shows the impact of pricing changes on product economics</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A 2-3 point drift in gross margin over 6 months is rarely random. Diagnose the cause before the compression compounds.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-margin">Net Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cogs">COGS</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/revenue">Revenue</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/profitability-ratio">Profitability Ratio</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Gross Margin = Gross Profit ÷ Revenue × 100%.",
      "The percentage version of gross profit.",
      "Healthy gross margin varies dramatically by industry.",
      "Compression is one of the most reliable early warning signs.",
    ]} />
  </>
);
