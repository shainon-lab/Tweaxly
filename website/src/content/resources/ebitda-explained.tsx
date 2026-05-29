import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "ebitda-explained",
  title: "EBITDA Explained (in Plain English)",
  excerpt:
    "EBITDA is profit before financing and accounting choices. It exists so you can compare businesses fairly - here's what it actually is and when to use it.",
  category: "financial-fundamentals",
  tags: ["EBITDA", "Profit Metrics", "Valuation", "Financial Basics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 8,
  tldr: [
    "EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization.",
    "It's a profit number that strips out financing decisions (interest), tax decisions (taxes), and accounting decisions (depreciation, amortization) so you can compare businesses on operating performance alone.",
    "EBITDA is the standard metric in business valuation - most sale prices are quoted as a multiple of EBITDA.",
    "It is NOT cash flow - businesses still pay interest, taxes, and capital expenses. EBITDA just doesn't subtract them.",
    "Healthy small-business EBITDA margins run 10-30% depending on industry. Below 10% is thin; above 30% is exceptional.",
  ],
  faq: [
    { q: "What does EBITDA stand for?", a: "Earnings Before Interest, Taxes, Depreciation, and Amortization. Each letter is a cost you're adding back to net profit to get to a more comparable operating profit." },
    { q: "Why does EBITDA exist?", a: "To compare businesses fairly. Two identical companies can show different net profits because of how they're financed, how they're taxed, or how they depreciate their assets. EBITDA strips those choices out so you see the operating reality." },
    { q: "Is EBITDA the same as cash flow?", a: "No - this is the most common misconception. EBITDA doesn't subtract interest, taxes, or capital expenditures, but the business still pays all three. Real cash flow is usually lower than EBITDA, sometimes by a lot." },
    { q: "When should I use EBITDA?", a: "When comparing businesses (especially with different financing or tax structures), when negotiating a sale or acquisition, or when investors ask for it. For day-to-day operating decisions, net profit and cash flow are usually more useful." },
    { q: "What's a good EBITDA margin?", a: "Depends on industry. Software 25-40%. Services 15-30%. Manufacturing 10-20%. Retail 5-15%. Below 10% is thin for most categories." },
    { q: "What's the difference between EBITDA and operating profit?", a: "Operating profit subtracts depreciation and amortization (they're operating expenses). EBITDA adds them back. So EBITDA is usually higher than operating profit, sometimes by a lot if the business has significant capital assets." },
  ],
  seo: {
    title: "EBITDA Explained (in Plain English) | Tweaxly",
    description:
      "EBITDA is profit before financing and accounting choices. A plain-English breakdown of what it means, when to use it, and how it differs from cash flow.",
    keywords: [
      "EBITDA",
      "what is EBITDA",
      "EBITDA formula",
      "EBITDA margin",
      "EBITDA explained",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      EBITDA is the most-quoted profit metric in business that
      isn&apos;t actually one of the standard profit numbers. It gets
      its own term because it exists for a specific purpose: making
      businesses comparable when their financing, taxes, and asset
      structures are different. Understand that purpose and you
      understand the metric.
    </Lead>

    <DefinitionBlock term="EBITDA">
      Earnings Before Interest, Taxes, Depreciation, and Amortization.
      A profit number that takes net profit and adds back interest,
      taxes, and the non-cash accounting expenses (depreciation and
      amortization), so what&apos;s left is a measure of operating
      performance without the noise of how a business is financed,
      taxed, or accounts for its assets.
    </DefinitionBlock>

    <Formula
      formula={"EBITDA = Net profit + Interest + Taxes + Depreciation + Amortization\n\n(Or equivalently: Operating profit + Depreciation + Amortization)\n\nEBITDA margin = EBITDA ÷ Revenue × 100%"}
      example={
        <>
          A business posts $100,000 of net profit on $1,000,000 of
          revenue. It paid $20,000 in interest, $35,000 in taxes,
          and recorded $45,000 in depreciation. EBITDA ={" "}
          <strong>$100,000 + $20,000 + $35,000 + $45,000 = $200,000</strong>.
          EBITDA margin = <strong>20%</strong>. The same business has a
          10% net margin and a 20% EBITDA margin - both are correct;
          they just measure different things.
        </>
      }
    />

    <H2 id="what-each-letter-means">What each letter actually strips out</H2>

    <p>
      Every term in EBITDA is something added back to net profit
      because it&apos;s seen as a choice or a non-cash accounting
      convention rather than a true cost of operating the business.
    </p>

    <H3>Interest</H3>
    <p>
      How a business is financed (cash, debt, equity) is a choice.
      Two identical businesses might show very different net profits
      just because one borrowed money to grow and the other
      didn&apos;t. Stripping out interest lets you compare them on
      operating performance.
    </p>

    <H3>Taxes</H3>
    <p>
      Taxes depend on the jurisdiction, structure (LLC vs C-corp),
      and accounting treatments. Stripping them out compares
      pre-tax operating performance.
    </p>

    <H3>Depreciation</H3>
    <p>
      When a business buys a piece of equipment, the cash leaves
      immediately, but the expense is spread over years on the P&L
      via depreciation. Adding it back removes that non-cash
      allocation, exposing the operating performance independent of
      historical asset purchases.
    </p>

    <H3>Amortization</H3>
    <p>
      The same idea as depreciation, but applied to intangible
      assets (patents, software licenses, goodwill from acquisitions).
      Spread over their useful life on the P&L, added back in EBITDA.
    </p>

    <H2 id="why-it-matters">Why EBITDA exists - and where it&apos;s legitimately useful</H2>

    <p>
      Three contexts where EBITDA earns its place.
    </p>

    <p>
      <strong>Comparing businesses.</strong> An equity research
      analyst comparing two competitors can&apos;t fairly use net
      profit if one has lots of debt and the other doesn&apos;t.
      EBITDA neutralizes the financing choice. Same logic for any
      head-to-head comparison.
    </p>

    <p>
      <strong>Business valuation and sale.</strong> When a small
      business sells, the price is almost always a multiple of
      EBITDA - typically 3x-6x for small businesses, higher for
      software and faster-growing categories. Owners preparing to
      sell focus on growing EBITDA because that&apos;s what their
      sale price is anchored to.
    </p>

    <p>
      <strong>Investor conversations.</strong> Private equity, lenders,
      and acquirers speak EBITDA fluently because it strips out the
      noise. If you&apos;re raising money or borrowing significantly,
      you&apos;ll need to be able to explain your EBITDA.
    </p>

    <H2 id="ebitda-vs-others">EBITDA vs other profit numbers</H2>

    <ComparisonTable
      caption="When each profit number is most useful"
      columns={["What it tells you", "Best for"]}
      rows={[
        {
          label: "Gross profit",
          cells: ["Whether the product or service itself is profitable", "Pricing decisions, product mix"],
        },
        {
          label: "Operating profit",
          cells: ["Whether the business is profitable from operations", "Day-to-day management"],
        },
        {
          label: "EBITDA",
          cells: ["Operating performance without financing or accounting noise", "Comparing businesses, valuation"],
        },
        {
          label: "Net profit",
          cells: ["Final bottom line after every cost", "Owner takeaway, dividends, reinvestment"],
        },
        {
          label: "Cash flow",
          cells: ["What's actually moving in and out of the bank", "Survival, runway, planning"],
        },
      ]}
    />

    <H2 id="ebitda-is-not-cash">The biggest misunderstanding: EBITDA is NOT cash flow</H2>

    <p>
      The most common - and most expensive - mistake with EBITDA is
      treating it like cash flow. It isn&apos;t. Three reasons it
      can be much higher than actual cash:
    </p>

    <p>
      <strong>You still pay interest.</strong> EBITDA adds back
      interest on the P&L, but the business still cuts checks to
      lenders. Real cash flow has interest going out.
    </p>

    <p>
      <strong>You still pay taxes.</strong> Same logic. EBITDA
      ignores taxes for comparison purposes; the IRS does not.
    </p>

    <p>
      <strong>You still need to replace capital assets.</strong>
      Depreciation is a non-cash expense, but the business still
      has to buy new equipment, software, vehicles - and that uses
      cash. In capital-intensive businesses (manufacturing,
      logistics), capital expenditure can roughly equal depreciation
      year after year.
    </p>

    <Callout variant="warn" title="The famous critique">
      Warren Buffett and Charlie Munger have publicly mocked
      EBITDA as &quot;earnings before stuff we&apos;d rather you
      didn&apos;t notice.&quot; The honest take: EBITDA is useful
      for comparison and valuation. It&apos;s misleading when used
      as a stand-in for actual profitability or cash generation.
    </Callout>

    <H2 id="ebitda-margin-ranges">What &quot;good&quot; EBITDA margin looks like</H2>

    <ul>
      <li><strong>Software / SaaS:</strong> 25-40% (lower while growing aggressively)</li>
      <li><strong>Professional services:</strong> 15-30%</li>
      <li><strong>Manufacturing:</strong> 10-20%</li>
      <li><strong>E-commerce:</strong> 10-25%</li>
      <li><strong>Retail (general):</strong> 5-15%</li>
      <li><strong>Restaurants:</strong> 8-15% (lower for full-service)</li>
      <li><strong>Construction:</strong> 8-15%</li>
    </ul>

    <p>
      Below 10% is thin in most categories. Above 30% suggests
      software, intellectual property, or strong pricing power.
      Buyers typically pay higher multiples for businesses with
      higher and more durable EBITDA margins.
    </p>

    <H2 id="common-mistakes">Common mistakes with EBITDA</H2>

    <H3>1. Treating EBITDA as cash</H3>

    <p>
      Already covered above and worth repeating. The bills for
      interest, taxes, and capital expenditure are real. EBITDA
      pretends they aren&apos;t for comparison purposes only.
    </p>

    <H3>2. Quoting EBITDA without disclosing add-backs</H3>

    <p>
      Some sellers preparing for a sale produce &quot;Adjusted
      EBITDA&quot; with creative add-backs (owner&apos;s personal
      car, one-time legal expenses, &quot;non-recurring&quot;
      consultant fees that happen every year). Buyers normalize
      these aggressively. If the add-backs make the EBITDA much
      higher than the regular EBITDA, expect a lower multiple.
    </p>

    <H3>3. Optimizing for EBITDA at the expense of cash</H3>

    <p>
      A business preparing for sale can be tempted to defer
      capital expenditure (to grow EBITDA via lower depreciation
      base) or extend payable terms. The buyer sees through these
      choices and adjusts down accordingly.
    </p>

    <H3>4. Using EBITDA for day-to-day decisions</H3>

    <p>
      EBITDA strips out costs that are real to your business. For
      running the business, net profit (what you actually keep)
      and cash flow (what you actually have) are usually more
      useful day to day.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">
          Revenue vs Profit
        </ArticleLink>{" "}
        - the foundational distinction.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">
          Gross Profit Explained
        </ArticleLink>{" "}
        - the first profit layer.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/net-profit-explained">
          Net Profit Explained
        </ArticleLink>{" "}
        - the bottom line, contrasted with EBITDA.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit
        </ArticleLink>{" "}
        - why neither EBITDA nor net profit equal cash.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - the practical version of the EBITDA-isn&apos;t-cash story.
      </li>
    </ul>

    <KeyTakeaways items={[
      "EBITDA = Earnings Before Interest, Taxes, Depreciation, and Amortization.",
      "It exists to make businesses comparable - stripping out financing, taxation, and accounting choices.",
      "It's the standard metric in business valuation and sale negotiations.",
      "EBITDA is NOT cash flow. The business still pays interest, taxes, and capital expenses.",
      "Small business EBITDA margins typically run 10-30% depending on industry.",
      "For day-to-day management, net profit and cash flow are usually more useful than EBITDA.",
    ]} />
  </>
);
