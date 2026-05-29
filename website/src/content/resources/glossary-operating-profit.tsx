import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "operating-profit",
  title: "Operating Profit",
  excerpt:
    "Operating Profit: gross profit minus operating expenses. The profit from running the core business, before interest and taxes.",
  category: "business-glossary",
  tags: ["Operating Profit", "EBIT", "Operating Income"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Gross profit minus operating expenses (OPEX).",
    "Also called: Operating income, EBIT (Earnings Before Interest and Taxes), operating earnings.",
    "Formula: Operating Profit = Gross Profit − Operating Expenses.",
    "Tells you: Whether the core business is profitable, before financing and tax decisions.",
    "Used in: Operating margin (Operating Profit ÷ Revenue), EBIT-based valuation multiples.",
  ],
  faq: [
    { q: "What's operating profit?", a: "The profit from running the core business, calculated as gross profit minus operating expenses. Before interest payments and taxes." },
    { q: "Is operating profit the same as EBIT?", a: "Largely yes. EBIT (Earnings Before Interest and Taxes) is operating profit by another name. Some accountants distinguish them subtly; for practical purposes they're equivalent." },
    { q: "How is operating profit different from net profit?", a: "Operating profit comes before interest and taxes. Net profit subtracts both. The gap is how much financing and tax decisions cost the business." },
    { q: "What's the difference between operating profit and EBITDA?", a: "EBITDA also adds back depreciation and amortization (non-cash expenses). Operating profit includes them. EBITDA is usually higher than operating profit." },
    { q: "What's a good operating margin?", a: "Industry-dependent. Software 15-30%, services 10-20%, retail 3-8%. Compare to peers, not absolute numbers." },
    { q: "Why use operating profit instead of net profit?", a: "Because it isolates how well the core business is performing, independent of how it's financed or taxed. Better for comparing operating performance across businesses with different capital structures." },
  ],
  seo: {
    title: "Operating Profit - Definition | Tweaxly Business Glossary",
    description: "Operating Profit is gross profit minus operating expenses. The profit from running the core business, before interest and taxes.",
    keywords: ["operating profit", "EBIT", "operating income", "what is operating profit", "operating margin"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The middle profit number on a P&L. Operating profit captures
      how well the core business is performing - before financing
      decisions, before tax, before any accounting choices about
      asset depreciation get added back.
    </Lead>

    <DefinitionBlock term="Operating Profit">
      gross profit minus operating expenses (OPEX). The profit
      from running the core business, before interest and tax.
      Also called operating income or EBIT (Earnings Before
      Interest and Taxes).
    </DefinitionBlock>

    <Formula formula={"Operating Profit = Gross Profit − Operating Expenses\n\nOperating Margin = Operating Profit ÷ Revenue × 100%"} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Core business assessment</strong> - is the underlying business profitable?</li>
      <li><strong>Cross-business comparison</strong> - strips out financing differences</li>
      <li><strong>Operating margin tracking</strong> - the percentage version, watched over time</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Operating profit doesn&apos;t equal cash. Like all profit numbers, it&apos;s an accounting measure - timing of receivables, working capital movements, and non-cash items affect what actually hits the bank.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-profit">Net Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ebitda">EBITDA</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/opex">Operating Expenses (OPEX)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/net-margin">Net Margin</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Operating Profit = Gross Profit − Operating Expenses.",
      "Also called EBIT or operating income.",
      "Measures core business performance before financing and tax.",
      "Operating margin (% of revenue) is the standard comparison metric.",
    ]} />
  </>
);
