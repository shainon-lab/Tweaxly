import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "free-cash-flow",
  title: "Free Cash Flow",
  excerpt:
    "Free Cash Flow (FCF): operating cash flow minus capital expenditures. The cash actually available for owners, growth, or savings.",
  category: "business-glossary",
  tags: ["Free Cash Flow", "FCF", "Cash Generation"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Free Cash Flow (FCF).",
    "Formula: Operating Cash Flow − Capital Expenditures.",
    "Tells you: The cash actually available for owners, investors, or reinvestment.",
    "Why \"free\": It's free of required reinvestment - what's left to distribute or save.",
    "Most useful for: Valuation, dividend decisions, growth investment capacity.",
  ],
  faq: [
    { q: "What's free cash flow in plain English?", a: "The cash the business actually generates after reinvesting in equipment, capacity, and other capital needed to maintain or grow operations. The discretionary cash." },
    { q: "How is FCF calculated?", a: "FCF = Operating Cash Flow − Capital Expenditures (CAPEX). Or alternately: Net Income + Depreciation − Working Capital changes − CAPEX." },
    { q: "Why is it called \"free\"?", a: "Because it's the cash that's free of required reinvestment. Operating cash flow includes money that must be plowed back into capital assets just to maintain the business; FCF subtracts that." },
    { q: "How is FCF different from EBITDA?", a: "EBITDA doesn't subtract CAPEX or working capital changes. FCF does. For capital-intensive businesses, FCF is usually much lower than EBITDA." },
    { q: "What's a good FCF margin?", a: "FCF margin (FCF ÷ Revenue) varies by industry. Software 15-30%. Services 10-20%. Manufacturing 5-15%. Compare to peers." },
    { q: "Can FCF be negative?", a: "Yes - especially for fast-growing businesses where CAPEX exceeds operating cash flow. Common for early-stage; concerning for mature businesses." },
  ],
  seo: {
    title: "Free Cash Flow - Definition | Tweaxly Business Glossary",
    description: "Free Cash Flow (FCF) is operating cash flow minus capital expenditures. The cash actually available for distribution or savings.",
    keywords: ["free cash flow", "FCF", "what is free cash flow", "FCF formula", "discretionary cash flow"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The cash flow metric that strips out required reinvestment.
      Free cash flow shows what&apos;s actually left after paying
      for everything the business needs to keep operating and
      growing - the money that&apos;s genuinely available for
      owners, investors, or discretionary investment.
    </Lead>

    <DefinitionBlock term="Free Cash Flow (FCF)">
      operating cash flow minus capital expenditures - the cash
      genuinely available for owners, investors, debt repayment,
      or discretionary growth investment after maintaining
      operating capacity.
    </DefinitionBlock>

    <Formula formula={"Free Cash Flow = Operating Cash Flow − Capital Expenditures (CAPEX)\n\nFCF Margin = Free Cash Flow ÷ Revenue × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Business valuation</strong> - DCF (discounted cash flow) valuations use FCF</li>
      <li><strong>Dividend / distribution decisions</strong> - what can be safely paid out</li>
      <li><strong>Growth investment capacity</strong> - how much can be redirected to discretionary growth</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      &quot;Maintenance CAPEX&quot; (replacement of worn-out equipment) and &quot;growth CAPEX&quot; (capacity expansion) both reduce FCF, but only maintenance is truly required. Some analyses separate the two for clarity.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ebitda">EBITDA</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/capex">Capital Expenditure (CAPEX)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-profit">Net Profit</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "FCF = Operating Cash Flow − CAPEX.",
      "The cash genuinely available for owners, growth, or savings.",
      "Foundation of DCF valuation.",
      "Can be negative for fast-growing businesses investing heavily.",
    ]} />
  </>
);
