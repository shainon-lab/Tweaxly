import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "capex",
  title: "CAPEX",
  excerpt:
    "CAPEX: Capital Expenditure. Money spent on long-lived assets like equipment, buildings, or software. Depreciated over years, not expensed immediately.",
  category: "business-glossary",
  tags: ["CAPEX", "Capital Expenditure", "Assets"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Capital Expenditure.",
    "Definition: Money spent on long-lived assets used in the business.",
    "Examples: Equipment, vehicles, buildings, machinery, software, leasehold improvements.",
    "Treatment: Capitalized on the balance sheet, then depreciated over useful life.",
    "Distinct from: OPEX (operating expenses, hit P&L immediately).",
  ],
  faq: [
    { q: "What does CAPEX stand for?", a: "Capital Expenditure - money spent on long-lived assets used to operate or grow the business." },
    { q: "What's the difference between CAPEX and OPEX?", a: "CAPEX is for long-lived assets (equipment, buildings) and is depreciated over years. OPEX is for day-to-day operating costs (rent, salaries) and hits the P&L immediately." },
    { q: "How is CAPEX accounted for?", a: "The full cash leaves the business when purchased, but only a portion (depreciation) hits the P&L each year over the asset's useful life - typically 3-10 years." },
    { q: "What's maintenance vs growth CAPEX?", a: "Maintenance CAPEX replaces worn-out equipment to maintain capacity. Growth CAPEX expands capacity. Both reduce free cash flow, but only maintenance is truly required." },
    { q: "Why does CAPEX matter for cash flow?", a: "CAPEX consumes cash without affecting profit much (only depreciation hits the P&L). A profitable business with high CAPEX can have low free cash flow." },
    { q: "How do I decide between buying and leasing?", a: "Cash matters: buying uses cash now, leasing spreads it over time. Tax treatment differs. Run the math on both; pick what matches your cash position and capital plan." },
  ],
  seo: {
    title: "CAPEX - Capital Expenditure Definition | Tweaxly",
    description: "CAPEX stands for Capital Expenditure - money spent on long-lived assets. Depreciated over years. Distinct from OPEX.",
    keywords: ["CAPEX", "capital expenditure", "what is CAPEX", "CAPEX vs OPEX", "capital spending"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The other category of business spending. Where OPEX hits
      the P&L immediately, CAPEX builds long-lived assets that
      get depreciated over years. Different cash impact, different
      accounting treatment, different planning approach.
    </Lead>

    <DefinitionBlock term="CAPEX (Capital Expenditure)">
      money spent on long-lived assets used in the business -
      equipment, vehicles, buildings, machinery, software,
      leasehold improvements. Capitalized on the balance sheet
      and depreciated over the asset&apos;s useful life.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Capital planning</strong> - what assets need to be replaced or expanded</li>
      <li><strong>Cash flow management</strong> - CAPEX consumes cash up front</li>
      <li><strong>Free cash flow calculation</strong> - operating cash flow minus CAPEX</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      CAPEX doesn&apos;t hit the P&L all at once - only depreciation does. This is why a business can appear profitable but have negative cash flow during periods of heavy investment.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/opex">OPEX (Operating Expenses)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/free-cash-flow">Free Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ebitda">EBITDA</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "CAPEX = Capital Expenditure on long-lived assets.",
      "Examples: equipment, buildings, vehicles, software.",
      "Capitalized and depreciated over useful life.",
      "Distinct from OPEX, which hits P&L immediately.",
    ]} />
  </>
);
