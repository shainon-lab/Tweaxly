import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "debt-to-income-ratio",
  title: "Debt-to-Income Ratio",
  excerpt:
    "Debt-to-Income Ratio: total debt service relative to income. The standard measure of how much debt a business can afford.",
  category: "business-glossary",
  tags: ["Debt-to-Income", "Leverage", "Lending"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "advanced",
  tldr: [
    "Definition: Ratio of total debt service to income.",
    "For businesses: Often expressed as debt service coverage ratio (DSCR).",
    "Formula: DSCR = Net Operating Income ÷ Total Debt Service.",
    "Healthy: DSCR > 1.25 (income covers debt with cushion).",
    "Used in: Lender underwriting, credit decisions, financial health assessment.",
  ],
  faq: [
    { q: "What's debt-to-income for a business?", a: "A ratio comparing debt obligations to income, used to assess how much debt the business can afford to take on (or already has)." },
    { q: "What's DSCR?", a: "Debt Service Coverage Ratio. Net Operating Income divided by Total Debt Service. The business equivalent of debt-to-income for personal lending." },
    { q: "What's a healthy DSCR?", a: "Generally 1.25 or higher - the business generates 25%+ more income than its debt requires. Some lenders require 1.5+. Below 1.0 means the business can't cover debt from operations." },
    { q: "Why do lenders use this ratio?", a: "Because it tells them whether the business can sustainably service the loan. A loan that requires the business to stretch is high-risk for both sides." },
    { q: "Can a business have too little debt?", a: "Sometimes. Cheap debt can fund profitable growth that produces more than it costs. The right level depends on growth opportunities and risk tolerance." },
    { q: "How does this differ from a personal DTI?", a: "Personal DTI uses gross income; business DSCR uses operating income (already netted of operating costs). Same concept, business adjustment for cost structure." },
  ],
  seo: {
    title: "Debt-to-Income Ratio - Definition | Tweaxly Business Glossary",
    description: "Debt-to-Income Ratio (DSCR for businesses) measures debt service relative to income. The standard lender metric.",
    keywords: ["debt to income ratio", "DSCR", "debt service coverage", "business debt ratio", "what is DTI"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The metric lenders care about most when evaluating
      whether a business can take on (or already supports)
      its debt load. A weak ratio limits financing options;
      a strong one opens them.
    </Lead>

    <DefinitionBlock term="Debt-to-Income Ratio (DSCR for businesses)">
      a ratio comparing debt service (loan payments) to
      income, indicating how much of business income is
      consumed by debt obligations. For businesses, commonly
      expressed as Debt Service Coverage Ratio (DSCR).
    </DefinitionBlock>

    <Formula formula={"DSCR = Net Operating Income ÷ Total Debt Service\n\nExample: $200K Net Operating Income, $120K annual debt service. DSCR = $200K ÷ $120K = 1.67."} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Lender underwriting</strong> - banks require minimum DSCR for loan approval</li>
      <li><strong>Capital structure planning</strong> - how much debt the business can sustainably carry</li>
      <li><strong>Financial health assessment</strong> - a key liquidity indicator</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      DSCR uses operating income, not cash flow. A business with strong DSCR but weak cash conversion (lots of working capital tied up) can still struggle to service debt in practice.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/solvency">Solvency</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/operating-profit">Operating Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/free-cash-flow">Free Cash Flow</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Business DTI is typically expressed as DSCR.",
      "DSCR = Net Operating Income ÷ Total Debt Service.",
      "Healthy DSCR > 1.25; lenders often require 1.5+.",
      "DSCR uses operating income, not cash - check both.",
    ]} />
  </>
);
