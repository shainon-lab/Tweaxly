import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "net-margin",
  title: "Net Margin",
  excerpt:
    "Net Margin: net profit as a percentage of revenue. The single number that answers \"how much of every dollar do we actually keep?\"",
  category: "business-glossary",
  tags: ["Net Margin", "Net Profit", "Profitability"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Net profit as a percentage of revenue.",
    "Formula: Net Margin = Net Profit ÷ Revenue × 100%.",
    "Tells you: How much of every dollar of revenue you actually keep after all costs.",
    "Industry benchmarks: SaaS 10-25%, Services 10-20%, Retail 2-6%, Restaurants 3-5%.",
    "Most useful for: Bottom-line comparison across businesses and periods.",
  ],
  faq: [
    { q: "What's net margin?", a: "Net profit divided by revenue, expressed as a percentage. A business with $1M revenue and $120K net profit has a 12% net margin." },
    { q: "What's a good net margin?", a: "Industry-dependent. Software 10-25%. Services 10-20%. Manufacturing 5-15%. Retail 2-6%. Most small businesses land between 5% and 20%." },
    { q: "How is net margin different from gross margin?", a: "Gross margin subtracts only direct production costs. Net margin subtracts everything (operating, interest, taxes). Net is always lower than gross." },
    { q: "Can net margin be negative?", a: "Yes - it means the business is losing money. Common in early-stage growth businesses investing ahead of profit." },
    { q: "Is high net margin always better?", a: "Not necessarily. Very high net margin sometimes means under-investment in growth. Optimal margin balances current profitability with future growth investment." },
    { q: "Why does net margin matter for business valuation?", a: "Buyers typically pay a multiple of net profit (or EBITDA). Higher net margin = more profit per dollar of revenue = higher valuation for the same revenue base." },
  ],
  seo: {
    title: "Net Margin - Definition | Tweaxly Business Glossary",
    description: "Net Margin is net profit as a percentage of revenue. The bottom-line measure of how much of each dollar you actually keep.",
    keywords: ["net margin", "what is net margin", "net profit margin", "profit margin formula", "net margin by industry"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The bottom-line percentage. If gross margin shows
      product-level economics, net margin shows whole-business
      economics - the share of every dollar that actually stays
      with the business after every cost.
    </Lead>

    <DefinitionBlock term="Net Margin">
      net profit expressed as a percentage of revenue. The single
      cleanest measure of how much of every dollar of revenue
      the business actually keeps after all costs.
    </DefinitionBlock>

    <Formula formula={"Net Margin = Net Profit ÷ Revenue × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Profitability comparison</strong> - across periods, businesses, or industries</li>
      <li><strong>Valuation</strong> - buyer multiples are anchored on net margin trend</li>
      <li><strong>Investor reporting</strong> - the headline profitability number</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Owner-operated businesses where the founder doesn&apos;t pay themselves a market salary look more profitable than they are. Always normalize for owner compensation before comparing.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/net-profit">Net Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/operating-profit">Operating Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ebitda">EBITDA</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/profitability-ratio">Profitability Ratio</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Net Margin = Net Profit ÷ Revenue × 100%.",
      "The bottom-line profitability percentage.",
      "Small business net margins typically 5-20% depending on industry.",
      "Normalize for owner salary before comparing.",
    ]} />
  </>
);
