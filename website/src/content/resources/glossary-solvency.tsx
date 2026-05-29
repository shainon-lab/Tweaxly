import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "solvency",
  title: "Solvency",
  excerpt:
    "Solvency: the long-term ability of a business to meet all its obligations. The structural counterpart to liquidity.",
  category: "business-glossary",
  tags: ["Solvency", "Long-term Health", "Capital Structure"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "advanced",
  tldr: [
    "Definition: The long-term ability of a business to meet all financial obligations.",
    "Standard metrics: Debt-to-Equity Ratio, Debt-to-Asset Ratio, Interest Coverage.",
    "Healthy: Total assets exceed total liabilities; debt service is sustainable from earnings.",
    "Different from: Liquidity (short-term cash availability).",
    "Insolvent: When liabilities exceed assets - the business is technically bankrupt.",
  ],
  faq: [
    { q: "What's solvency in plain English?", a: "Whether a business has enough assets and earnings power to cover all its long-term debts, not just the next month's bills." },
    { q: "How is solvency measured?", a: "Common metrics: Debt-to-Equity (how much debt vs owner equity), Debt-to-Asset (how much of assets are debt-financed), Interest Coverage (earnings vs interest payments)." },
    { q: "What's the difference between solvency and liquidity?", a: "Liquidity is short-term (can you pay this month?). Solvency is long-term (are total assets and earning power enough to cover all obligations over time?)." },
    { q: "What does \"insolvent\" mean?", a: "Liabilities exceed assets - the business is technically bankrupt. Even if it has cash today, it can't sustainably meet its obligations." },
    { q: "Can a business be solvent but illiquid?", a: "Yes. A business with strong long-term position but a short-term cash crunch is solvent but illiquid. Bridge financing usually solves it." },
    { q: "Can a business be liquid but insolvent?", a: "Briefly, yes. A business with cash on hand but underwater on total balance sheet is technically insolvent. Often resolved through restructuring, asset sale, or bankruptcy." },
  ],
  seo: {
    title: "Solvency - Definition | Tweaxly Business Glossary",
    description: "Solvency is the long-term ability of a business to meet all obligations. Distinct from liquidity (short-term).",
    keywords: ["solvency", "what is solvency", "solvency vs liquidity", "insolvent", "debt to equity"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The structural financial property that determines long-term
      survival. Where liquidity is about meeting next month&apos;s
      bills, solvency is about whether the business can sustain
      itself over years.
    </Lead>

    <DefinitionBlock term="Solvency">
      the long-term ability of a business to meet all its
      financial obligations. Measured by capital structure
      ratios (debt-to-equity, debt-to-asset) and earnings
      coverage (interest coverage).
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Lender risk assessment</strong> - banks evaluate solvency before extending long-term credit</li>
      <li><strong>Investor analysis</strong> - capital structure is one of the first things sophisticated investors examine</li>
      <li><strong>Strategic decisions</strong> - debt-heavy businesses have less strategic flexibility</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A business can technically be insolvent (liabilities exceed assets) for a while before it becomes obvious - especially if cash flow temporarily covers debt service. Watch the balance sheet, not just the bank account.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/debt-to-income-ratio">Debt-to-Income Ratio</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/profitability-ratio">Profitability Ratio</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Solvency = long-term ability to meet all obligations.",
      "Measured by debt-to-equity, debt-to-asset, interest coverage.",
      "Different from liquidity (short-term cash).",
      "Insolvency = liabilities exceed assets (technical bankruptcy).",
    ]} />
  </>
);
