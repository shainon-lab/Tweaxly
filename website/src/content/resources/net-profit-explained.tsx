import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "net-profit-explained",
  title: "Net Profit Explained (with Examples)",
  excerpt:
    "Net profit is the bottom line - what's left after every cost, interest, and tax. It's the truest single measure of whether a business is making money.",
  category: "financial-fundamentals",
  tags: ["Net Profit", "Bottom Line", "Net Margin", "Financial Basics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 8,
  tldr: [
    "Net profit is revenue minus every cost, including direct costs, operating expenses, interest, and taxes.",
    "Net margin is net profit divided by revenue - the standard way to compare across periods or businesses.",
    "Net profit is the single number that answers \"is this business actually making money?\".",
    "Healthy net margins vary by industry. Small businesses commonly land between 5% and 20%.",
    "Net profit is not the same as cash in the bank - the gap between them is the cash flow vs profit problem.",
  ],
  faq: [
    { q: "What's the simplest definition of net profit?", a: "The money left over after the business has paid for everything required to earn its revenue - direct costs, operating costs, interest, and taxes." },
    { q: "How is net profit different from gross profit?", a: "Gross profit subtracts only direct production costs. Net profit subtracts everything - operating expenses, interest, and taxes. Net profit is always smaller than gross profit." },
    { q: "What's a good net margin?", a: "It depends on industry. Software businesses often run 15-25%. Service businesses 10-20%. Retailers 2-6%. Restaurants 3-5%. Compare yourself to industry, not absolute numbers." },
    { q: "Can a business have a high gross margin but a low net margin?", a: "Yes - and this is common. A software business might have an 80% gross margin but a 5% net margin because it's spending heavily on sales, marketing, and engineering to grow." },
    { q: "Is net profit the same as cash?", a: "No. Profit is what you earned on paper; cash is what's actually in your bank account. The two can differ significantly because of timing - revenue earned but not yet collected, expenses incurred but not yet paid, inventory, depreciation." },
    { q: "Why is net profit sometimes called the \"bottom line\"?", a: "Because it's the last line on a profit & loss statement, after every cost has been subtracted. \"The bottom line\" became shorthand for \"the final answer.\"" },
  ],
  seo: {
    title: "Net Profit Explained (with Examples) | Tweaxly",
    description:
      "Net profit is the bottom line - what's left after every cost is subtracted. A plain-English breakdown with formula, examples, and how to use net margin.",
    keywords: [
      "net profit",
      "net margin",
      "what is net profit",
      "bottom line",
      "net profit formula",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      If you only have time to look at one profit number, look at this
      one. Net profit is what&apos;s left after the business has paid
      for everything - the materials, the team, the rent, the
      software, the marketing, the interest on debt, and the taxes.
      Whatever&apos;s left is what the business actually made.
    </Lead>

    <DefinitionBlock term="Net profit">
      revenue minus all costs, including the cost of producing what
      you sold, operating expenses, interest payments, and taxes.
      The final &quot;bottom line&quot; on a profit and loss
      statement.
    </DefinitionBlock>

    <Formula
      formula={"Net profit = Revenue − COGS − Operating expenses − Interest − Taxes\n\nNet margin = Net profit ÷ Revenue × 100%"}
      example={
        <>
          A small marketing agency books $50,000 of revenue in a
          month. COGS (contractors on client work): $18,000.
          Operating expenses (office, salaries, software, marketing):
          $24,000. Interest on a small business loan: $500. Tax
          provision: $2,000. Net profit ={" "}
          <strong>$50,000 − $18,000 − $24,000 − $500 − $2,000 = $5,500</strong>.
          Net margin = $5,500 ÷ $50,000 = <strong>11%</strong>.
        </>
      }
    />

    <H2 id="profit-layers">The three profit numbers, top to bottom</H2>

    <p>
      A profit and loss statement (P&L) doesn&apos;t show just one
      profit - it shows three, stacked from top to bottom. Each one
      strips out a different layer of cost. Net profit is what&apos;s
      left after every layer.
    </p>

    <ol>
      <li>
        Revenue (top of the page)
      </li>
      <li>
        − Cost of Goods Sold (direct costs)
      </li>
      <li>
        = <strong>Gross profit</strong>
      </li>
      <li>
        − Operating expenses (rent, salaries not in COGS, marketing,
        software, insurance, etc.)
      </li>
      <li>
        = <strong>Operating profit</strong>
      </li>
      <li>
        − Interest on debt
      </li>
      <li>
        − Taxes
      </li>
      <li>
        = <strong>Net profit</strong> (bottom of the page)
      </li>
    </ol>

    <p>
      Each level answers a different question. Gross profit asks
      &quot;does the product or service make money?&quot; Operating
      profit asks &quot;does the business make money?&quot; Net
      profit asks &quot;does the whole package - business,
      financing, taxes - make money?&quot;
    </p>

    <H2 id="why-it-matters">Why net profit deserves your closest attention</H2>

    <p>
      Net profit is the only profit number that fully accounts for
      the whole business. The earlier numbers - gross, operating -
      tell you about pieces. Net tells you about the whole.
    </p>

    <p>
      <strong>It&apos;s what reinvests in the business.</strong> The
      profit you keep is what funds next year&apos;s growth, pays
      down debt, builds cash reserves, or distributes to owners.
      Operating profit doesn&apos;t do any of that until interest
      and taxes are paid; net profit does.
    </p>

    <p>
      <strong>It&apos;s what buyers value.</strong> If you ever
      sell the business, the buyer&apos;s offer will be a multiple
      of profit - usually net profit or a normalized version of it.
      Revenue gets a smaller multiple than profit. Owners
      optimizing for sale value should optimize for profit growth,
      not pure revenue growth.
    </p>

    <p>
      <strong>It&apos;s the bottom line.</strong> When the bank
      asks &quot;is this business profitable,&quot; they mean net
      profit. When an investor asks &quot;what&apos;s your margin,&quot;
      they usually mean net margin. The single number that gets
      most reported and most compared is this one.
    </p>

    <H2 id="net-margin-ranges">What &quot;good&quot; net margin looks like</H2>

    <p>
      Like gross margin, net margin is meaningful relative to your
      industry, not in absolute terms. Rough small-business ranges:
    </p>

    <ul>
      <li><strong>Software / SaaS:</strong> 10-25% (higher for established, lower while growing fast)</li>
      <li><strong>Professional services / consulting:</strong> 10-20%</li>
      <li><strong>Agencies and creative services:</strong> 8-15%</li>
      <li><strong>Manufacturing:</strong> 5-15%</li>
      <li><strong>E-commerce:</strong> 5-15%</li>
      <li><strong>Restaurants:</strong> 3-6%</li>
      <li><strong>Retail (general):</strong> 2-6%</li>
      <li><strong>Construction / contractors:</strong> 5-10%</li>
    </ul>

    <p>
      Small businesses across most categories land somewhere
      between 5% and 20%. Above 25% net margin tends to mean
      software, intellectual property, or a strong moat. Below 5%
      means high volume, thin margins, and very little room for
      error.
    </p>

    <H2 id="profit-vs-cash">Net profit is not cash</H2>

    <p>
      The single most important caveat about net profit: it&apos;s
      not the same as the cash in your bank account. A business can
      report strong net profit and still run out of cash. Three
      reasons:
    </p>

    <p>
      <strong>Timing.</strong> Revenue is recognized when a sale
      happens; cash arrives when the customer pays. A business
      sending out $50K of invoices on 60-day terms shows the
      revenue today, but the cash is two months away.
    </p>

    <p>
      <strong>Non-cash expenses.</strong> Depreciation lowers net
      profit but doesn&apos;t actually move cash. The cash for the
      equipment left the business when it was bought; depreciation
      just allocates that historical cost over future periods.
    </p>

    <p>
      <strong>Investment and financing.</strong> Buying inventory,
      paying down loan principal, and investing in equipment all
      consume cash without touching the profit number.
    </p>

    <p>
      The full story is in our{" "}
      <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
        Cash Flow vs Profit
      </ArticleLink>{" "}
      article and the practical implications are covered in{" "}
      <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
        Why Profitable Businesses Run Out of Cash
      </ArticleLink>.
    </p>

    <Callout variant="warn" title="A trap to avoid">
      Owners sometimes pay themselves or invest based on net profit
      and discover the cash isn&apos;t there. Always reconcile net
      profit against cash flow before committing to spending it.
    </Callout>

    <H2 id="worked-example">Worked example: same revenue, different net profit</H2>

    <p>
      Two service businesses with identical revenue, very different
      bottom lines.
    </p>

    <H3>Agency A - thin overhead, healthy margin</H3>

    <ul>
      <li>Revenue: $200,000</li>
      <li>COGS (contractors): $90,000 → Gross profit $110,000 (55%)</li>
      <li>Operating expenses: $70,000</li>
      <li>Interest + taxes: $8,000</li>
      <li>Net profit: <strong>$32,000 (16% net margin)</strong></li>
    </ul>

    <H3>Agency B - bloated overhead</H3>

    <ul>
      <li>Revenue: $200,000</li>
      <li>COGS (contractors): $90,000 → Gross profit $110,000 (55%)</li>
      <li>Operating expenses: $98,000 (larger office, more software, more SDRs)</li>
      <li>Interest + taxes: $8,000</li>
      <li>Net profit: <strong>$4,000 (2% net margin)</strong></li>
    </ul>

    <p>
      Identical revenue. Identical gross margin. Eight times the
      net profit at Agency A - because the overhead is leaner.
      Owners chasing growth often grow operating expenses faster
      than revenue and end up with Agency B&apos;s P&L without
      noticing.
    </p>

    <H2 id="common-mistakes">Common mistakes business owners make</H2>

    <H3>1. Treating net profit as cash</H3>

    <p>
      The most expensive mistake. Reinvesting or paying out based
      on the P&L without checking the bank account leads to
      avoidable cash crunches. Always reconcile.
    </p>

    <H3>2. Comparing your net margin to a competitor&apos;s gross margin</H3>

    <p>
      &quot;They&apos;re at 60% margin and we&apos;re at 10%&quot;
      is meaningless if they&apos;re quoting gross and you&apos;re
      quoting net. Make sure both numbers are the same metric.
    </p>

    <H3>3. Ignoring owner compensation</H3>

    <p>
      Some owners don&apos;t pay themselves a market salary and
      treat the gap as net profit. The business looks more
      profitable than it is. If you replaced yourself with a hired
      operator, what would the actual net profit be? That&apos;s
      the honest number.
    </p>

    <H3>4. Optimizing for net profit at the cost of growth</H3>

    <p>
      Especially common in mature businesses. Cutting every cost
      that doesn&apos;t produce profit this quarter starves
      tomorrow&apos;s growth. Net profit is a result, not the only
      input. Balance it against reinvestment.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">
          Revenue vs Profit
        </ArticleLink>{" "}
        - the parent distinction.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">
          Gross Profit Explained
        </ArticleLink>{" "}
        - the first profit layer above net.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/ebitda-explained">
          EBITDA Explained
        </ArticleLink>{" "}
        - a related &quot;profit&quot; metric used in valuation and
        investor conversations.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit
        </ArticleLink>{" "}
        - why net profit isn&apos;t cash.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - net profit trends are most useful viewed as growth, not
        as a single number.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Net profit = Revenue − every cost (direct, operating, interest, taxes). It's the bottom line.",
      "Net margin (net profit ÷ revenue) is the standard way to compare across periods or businesses.",
      "Small business net margins commonly land between 5% and 20%. Compare to industry, not absolute.",
      "Net profit is what funds reinvestment, debt repayment, owner distributions, and valuation.",
      "Net profit is not cash. Always reconcile before spending against it.",
      "Always pay yourself a market salary before claiming a net profit number - otherwise the comparison is dishonest.",
    ]} />
  </>
);
