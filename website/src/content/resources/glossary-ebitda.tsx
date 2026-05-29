import {
  Lead, H2, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "ebitda",
  title: "EBITDA",
  excerpt:
    "EBITDA: Earnings Before Interest, Taxes, Depreciation and Amortization. A profit measure that strips out financing and accounting decisions for comparison.",
  category: "business-glossary",
  tags: ["EBITDA", "Profit", "Valuation"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Stands for: Earnings Before Interest, Taxes, Depreciation, and Amortization.",
    "Used as: A profit measure that strips out financing decisions and accounting choices, making businesses more comparable.",
    "Common in: Business valuation, investor and lender conversations, M&A.",
    "Don't confuse with: Cash flow (EBITDA isn't cash - the business still pays interest, taxes, and capital expenses).",
  ],
  faq: [
    { q: "What does EBITDA stand for?", a: "Earnings Before Interest, Taxes, Depreciation, and Amortization." },
    { q: "Why does EBITDA exist?", a: "To make businesses comparable. Two identical companies can show different net profits because of how they're financed, how they're taxed, or how they depreciate their assets. EBITDA strips those choices out so you see the operating reality." },
    { q: "Is EBITDA cash flow?", a: "No - this is the most common misconception. EBITDA doesn't subtract interest, taxes, or capital expenditures, but the business still pays all three. Real cash flow is usually lower than EBITDA, sometimes by a lot." },
    { q: "What's a good EBITDA margin?", a: "Depends on industry. Software 25-40%. Services 15-30%. Manufacturing 10-20%. Retail 5-15%. Below 10% is thin for most categories." },
    { q: "What's the difference between EBITDA and operating profit?", a: "Operating profit subtracts depreciation and amortization (they're operating expenses). EBITDA adds them back. So EBITDA is usually higher than operating profit, sometimes significantly if the business has significant capital assets." },
    { q: "What is \"Adjusted EBITDA\"?", a: "EBITDA with additional add-backs for one-time or non-recurring expenses (founder car, one-time legal, severance). Buyers normalize these aggressively in valuation - aggressive add-backs typically lead to lower multiples." },
    { q: "When is EBITDA most useful?", a: "Comparing businesses (especially with different financing structures), business valuation and sale negotiations, and lender or private equity conversations. For day-to-day operating decisions, net profit and cash flow are usually more useful." },
  ],
  seo: {
    title: "EBITDA - Definition | Tweaxly Business Glossary",
    description:
      "EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization. A profit measure used in valuation and business comparison.",
    keywords: [
      "EBITDA",
      "EBITDA definition",
      "what does EBITDA mean",
      "EBITDA glossary",
      "earnings before interest",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      A profit measure that strips out the impact of financing
      decisions, tax decisions, and non-cash accounting expenses
      so businesses can be compared on operating performance
      alone. The standard metric in business valuation.
    </Lead>

    <DefinitionBlock term="EBITDA">
      Earnings Before Interest, Taxes, Depreciation, and
      Amortization. Calculated by adding interest, taxes,
      depreciation, and amortization back to net profit (or
      equivalently, starting with operating profit and adding
      back depreciation and amortization).
    </DefinitionBlock>

    <H2 id="how-to-calculate">How to calculate it</H2>

    <p>
      <strong>EBITDA = Net profit + Interest + Taxes +
      Depreciation + Amortization</strong>
    </p>

    <p>
      Or equivalently: Operating profit + Depreciation +
      Amortization.
    </p>

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Business valuation</strong> - small businesses
        typically sell for 3-6x EBITDA, higher for software and
        faster-growing categories
      </li>
      <li>
        <strong>Investor and lender conversations</strong> -
        EBITDA is the standard profit measure they ask for
      </li>
      <li>
        <strong>Comparing competitors</strong> - strips out
        financing and accounting differences
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      EBITDA is not cash flow. The business still pays interest,
      taxes, and capital expenses - EBITDA just doesn&apos;t
      subtract them. Don&apos;t treat EBITDA as money in the
      bank.
    </p>

    <p>
      For the full explanation, see{" "}
      <ArticleLink href="/resources/financial-fundamentals/ebitda-explained">
        EBITDA Explained
      </ArticleLink>.
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/net-profit">
          Net Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/gross-profit">
          Gross Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/runway">
          Runway
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/burn-rate">
          Burn Rate
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "EBITDA = Earnings Before Interest, Taxes, Depreciation, Amortization.",
      "It's a profit measure used to compare businesses on operating performance.",
      "Standard in business valuation and M&A.",
      "It's NOT cash - the business still pays interest, taxes, and capital costs.",
    ]} />
  </>
);
