import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "accounts-payable",
  title: "Accounts Payable",
  excerpt:
    "Accounts Payable (AP): money the business owes vendors and suppliers but hasn't paid yet. The bills that are coming due.",
  category: "business-glossary",
  tags: ["Accounts Payable", "AP", "Working Capital"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: Money the business owes vendors and suppliers but hasn't paid yet.",
    "Also called: AP, trade payables, or simply \"payables.\"",
    "On the balance sheet: A liability (you owe it).",
    "Key metric: Days Payable Outstanding (DPO) - average days to pay.",
    "Strategic use: Stretching DPO (within terms) keeps cash in your hands longer.",
  ],
  faq: [
    { q: "What's accounts payable in plain English?", a: "Money you owe vendors and suppliers for goods or services already received but not yet paid for. The bills sitting in your queue." },
    { q: "Is AP an asset or liability?", a: "A liability - it's money you owe. Sits on the balance sheet under current liabilities." },
    { q: "What's Days Payable Outstanding (DPO)?", a: "The average number of days between receiving a vendor bill and paying it. DPO = (AP ÷ COGS or expenses) × Number of days in the period." },
    { q: "Should I stretch AP to improve cash flow?", a: "Within agreed terms, yes - paying on the due date rather than early keeps cash in your hands. Beyond terms (paying late) damages vendor relationships and ultimately costs more." },
    { q: "What's a good payment term to negotiate?", a: "Net-30 is standard. Net-45 or net-60 are achievable with larger vendors. Always negotiate terms upfront, not by paying late." },
    { q: "How does AP affect working capital?", a: "Higher AP (more bills outstanding) increases working capital available for operations. It's effectively short-term financing from your vendors." },
  ],
  seo: {
    title: "Accounts Payable - Definition | Tweaxly Business Glossary",
    description: "Accounts Payable (AP) is money the business owes vendors but hasn't paid yet. Plain-English definition with DPO and strategy notes.",
    keywords: ["accounts payable", "AP", "what is accounts payable", "DPO", "payables"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The mirror image of accounts receivable - money you owe
      vendors. Managed well, AP is effectively interest-free
      short-term financing. Managed badly, it damages vendor
      relationships and ultimately costs more.
    </Lead>

    <DefinitionBlock term="Accounts Payable (AP)">
      money the business owes vendors and suppliers for goods or
      services already received but not yet paid for. Sits on
      the balance sheet as a current liability.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Cash flow forecasting</strong> - scheduled AP payments are the cash-out side of the forecast</li>
      <li><strong>Vendor relationship management</strong> - paying on time builds credit; paying late costs it</li>
      <li><strong>Working capital strategy</strong> - longer DPO means more cash in operations</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Stretching payables beyond agreed terms damages vendor relationships and often results in vendors raising prices, requiring upfront payment, or refusing future business. Negotiate longer terms; don&apos;t take them by paying late.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/accounts-receivable">Accounts Receivable</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/opex">Operating Expenses (OPEX)</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "AP = money you owe vendors, not yet paid.",
      "Liability on the balance sheet.",
      "Days Payable Outstanding (DPO) measures payment speed.",
      "Negotiate terms; don't stretch them by paying late.",
    ]} />
  </>
);
