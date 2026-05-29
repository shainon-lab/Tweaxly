import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "accounts-receivable",
  title: "Accounts Receivable",
  excerpt:
    "Accounts Receivable (AR): money customers owe the business but haven't paid yet. The invoices outstanding waiting to be collected.",
  category: "business-glossary",
  tags: ["Accounts Receivable", "AR", "Working Capital"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: Money customers owe the business but haven't paid yet.",
    "Also called: AR, trade receivables, or simply \"receivables.\"",
    "On the balance sheet: An asset (you're owed it).",
    "Key metric: Days Sales Outstanding (DSO) - average days to collect.",
    "Risk: Receivables that age past their terms become harder to collect.",
  ],
  faq: [
    { q: "What's accounts receivable in plain English?", a: "Money customers owe you for work already done or products already delivered. You sent the invoice; they haven't paid yet." },
    { q: "Is AR an asset or liability?", a: "An asset - it's money you have a right to receive. It sits on the balance sheet under current assets." },
    { q: "What's Days Sales Outstanding (DSO)?", a: "The average number of days between sending an invoice and collecting payment. DSO = (AR ÷ Revenue) × Number of days in the period." },
    { q: "How do I manage AR well?", a: "Invoice promptly, set tight payment terms (net-15 or 30), follow up automatically, accept easy payment methods, escalate aging invoices early." },
    { q: "What happens to AR that's never paid?", a: "It eventually gets written off as bad debt - an expense that reduces profit. Some businesses estimate bad debt allowance proactively." },
    { q: "Why does AR matter for cash flow?", a: "AR is revenue you've earned but haven't received as cash. Growing AR without growing collections is the classic profitable-but-cash-poor pattern." },
  ],
  seo: {
    title: "Accounts Receivable - Definition | Tweaxly Business Glossary",
    description: "Accounts Receivable (AR) is money customers owe the business but haven't paid yet. A plain-English definition with DSO and management tips.",
    keywords: ["accounts receivable", "AR", "what is accounts receivable", "DSO", "receivables"],
  },
};

export const Body = () => (
  <>
    <Lead>
      Money customers owe but haven&apos;t paid yet. Manageable
      AR is part of doing business; growing AR without growing
      collections is where cash crunches come from.
    </Lead>

    <DefinitionBlock term="Accounts Receivable (AR)">
      money owed to the business by customers for products or
      services already delivered but not yet paid for. Sits on
      the balance sheet as a current asset.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Cash flow forecasting</strong> - expected AR collections drive the 13-week cash forecast</li>
      <li><strong>DSO tracking</strong> - the standard metric for collections efficiency</li>
      <li><strong>Working capital management</strong> - AR is one of the largest working capital line items</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Aging AR is one of the most reliable warning signs of cash trouble. If DSO is creeping up, collections discipline has slipped or customers are getting stressed. Both deserve attention.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/accounts-payable">Accounts Payable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/accounts-aging">Accounts Aging</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "AR = money customers owe you, not yet paid.",
      "Asset on the balance sheet.",
      "Days Sales Outstanding (DSO) measures collection speed.",
      "Aging AR is a leading indicator of cash flow trouble.",
    ]} />
  </>
);
