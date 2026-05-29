import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, Formula, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "gross-profit-explained",
  title: "Gross Profit Explained (with Examples)",
  excerpt:
    "Gross profit is what's left after you subtract the direct cost of what you sold. It tells you whether your product or service is fundamentally profitable.",
  category: "financial-fundamentals",
  tags: ["Gross Profit", "Gross Margin", "Cost of Goods Sold", "Financial Basics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 8,
  tldr: [
    "Gross profit is revenue minus the direct cost of producing or delivering what you sold (Cost of Goods Sold).",
    "Gross margin is gross profit expressed as a percentage of revenue - the standard way to compare it across periods or businesses.",
    "Healthy gross margins vary wildly by industry: a software business might sit at 80%; a grocery store at 25%.",
    "If gross profit doesn't cover your operating costs, the business can never be profitable - no amount of growth fixes that.",
    "Watch gross margin trend month over month. Gradual compression is one of the earliest signs of a structural problem.",
  ],
  faq: [
    { q: "What's the difference between gross profit and gross margin?", a: "Gross profit is a dollar amount. Gross margin is the same number expressed as a percentage of revenue. A business with $100K revenue and $40K gross profit has a 40% gross margin." },
    { q: "What costs are included in Cost of Goods Sold?", a: "Costs directly required to make or deliver what you sold - raw materials, payment processing fees, freight in, direct labor on production. NOT included: rent, marketing, owner salary, software subscriptions, general overhead." },
    { q: "What's a good gross margin?", a: "It depends entirely on industry. Software businesses commonly run 70-85%. Service businesses 40-60%. Retailers 25-40%. Grocery stores under 25%. Compare yourself to your industry, not to absolute numbers." },
    { q: "Can gross profit be negative?", a: "Yes - it means you're selling each unit for less than it costs to produce. That's an existential problem; no amount of volume fixes it. Either prices have to rise or production costs have to fall." },
    { q: "How is gross profit different from net profit?", a: "Gross profit subtracts only direct costs. Net profit subtracts everything - direct costs, operating expenses, interest, and taxes. Net profit is always smaller than gross profit (unless you have non-operating gains)." },
    { q: "Why does gross margin compress over time?", a: "Usual suspects: input costs rising faster than prices, customer mix shifting to lower-margin products, discounting to win or keep customers, or hidden cost creep (small fee increases from vendors that add up)." },
  ],
  seo: {
    title: "Gross Profit Explained (with Examples) | Tweaxly",
    description:
      "Gross profit is revenue minus direct costs. A plain-English breakdown with formula, worked examples, and how to use gross margin to track business health.",
    keywords: [
      "gross profit",
      "gross margin",
      "what is gross profit",
      "gross profit formula",
      "cost of goods sold",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Gross profit is the first layer of profitability and the most
      important one to get right. If the gross profit on a sale
      doesn&apos;t cover the cost of delivering that sale, no amount of
      scale or cost discipline elsewhere can save the business.
      Everything downstream of gross profit - operating profit, net
      profit, cash flow - depends on this number being healthy.
    </Lead>

    <DefinitionBlock term="Gross profit">
      what&apos;s left of your revenue after you subtract the direct
      cost of producing or delivering whatever you sold. Those direct
      costs are called Cost of Goods Sold (COGS) - or sometimes Cost
      of Revenue or Cost of Sales.
    </DefinitionBlock>

    <Formula
      formula={"Gross profit = Revenue − Cost of Goods Sold (COGS)\n\nGross margin = Gross profit ÷ Revenue × 100%"}
      example={
        <>
          A coffee shop sells $40,000 of coffee and pastries in a month.
          The beans, milk, ingredients, cups, and barista wages for those
          sales come to $14,000. Gross profit is{" "}
          <strong>$40,000 − $14,000 = $26,000</strong>. Gross margin is{" "}
          <strong>$26,000 ÷ $40,000 = 65%</strong>.
        </>
      }
    />

    <H2 id="what-counts-cogs">What counts as Cost of Goods Sold</H2>

    <p>
      The boundary between &quot;direct cost&quot; and &quot;overhead&quot;
      is what trips most owners up. The rule of thumb: if you stopped
      selling, this cost would mostly go away. If it would still be
      there next month, it&apos;s overhead, not COGS.
    </p>

    <ComparisonTable
      caption="What's in vs out of COGS"
      columns={["In COGS (direct)", "Out of COGS (overhead)"]}
      rows={[
        {
          label: "Product business",
          cells: [
            "Raw materials, freight in, payment processing, direct production labor, packaging",
            "Rent, owner salary, marketing, software, insurance, accounting",
          ],
        },
        {
          label: "Service business",
          cells: [
            "Contractor or staff time billed against the client, project-specific software, travel reimbursed by the client",
            "Office rent, owner time spent selling or admin, general subscriptions, marketing",
          ],
        },
        {
          label: "Software business",
          cells: [
            "Hosting costs per customer, payment processing, customer support attributable to active accounts, third-party API costs",
            "Engineering salaries, sales team, office, general overhead",
          ],
        },
      ]}
    />

    <Callout variant="info" title="Where accountants split hairs">
      Strict accounting moves some items around (depreciation of
      production equipment, for example, can belong in COGS).
      For most owner-level decisions, the rule of thumb above is
      good enough. If you&apos;re preparing financials for investors
      or a sale, work with your accountant on the exact lines.
    </Callout>

    <H2 id="margin-by-industry">What &quot;good&quot; looks like by industry</H2>

    <p>
      Gross margin is almost meaningless in absolute terms; it&apos;s
      meaningful relative to your industry. The same 40% gross margin
      that&apos;s healthy for a retailer would be alarmingly low for
      a software business. Rough benchmarks:
    </p>

    <ul>
      <li><strong>Software / SaaS:</strong> 70-85%</li>
      <li><strong>Professional services (consulting, agencies):</strong> 40-60%</li>
      <li><strong>Manufacturing:</strong> 25-50%</li>
      <li><strong>E-commerce:</strong> 30-50%</li>
      <li><strong>Restaurants:</strong> 60-70% on food costs, but net margins are thin</li>
      <li><strong>Brick-and-mortar retail:</strong> 25-40%</li>
      <li><strong>Grocery:</strong> 20-25%</li>
    </ul>

    <p>
      These are ballparks, not targets. The right reference is your
      own historical trend (am I getting better or worse?) and direct
      competitors at your scale.
    </p>

    <H2 id="why-it-matters">Why gross profit is the most important profit number to watch</H2>

    <p>
      Three reasons gross profit deserves a permanent slot on your
      monthly review:
    </p>

    <p>
      <strong>It&apos;s the floor.</strong> Operating costs are
      relatively fixed in the short term - you can&apos;t cut your way
      to profitability if your gross profit is too thin to cover them.
      A business losing money below the gross profit line has a
      pricing or a cost-of-production problem, not a marketing or
      overhead problem.
    </p>

    <p>
      <strong>It&apos;s a leading indicator.</strong> Gross margin
      compression usually shows up months before it affects net
      profit or cash. Watching it trend gives you warning to act
      while you still have room.
    </p>

    <p>
      <strong>It tells you which growth is good growth.</strong>
      Two clients that look the same in revenue can look very
      different in gross profit. The one that takes more support
      time, requires more custom work, or runs at a discount is
      eating margin you can&apos;t see in the top line. Tracking
      gross profit by customer or product family surfaces these
      patterns.
    </p>

    <H2 id="worked-example">Two worked examples</H2>

    <H3>Service business: a five-person agency</H3>

    <ul>
      <li>Monthly revenue: <strong>$120,000</strong></li>
      <li>Direct labor on client work (4 consultants × billable wages): $54,000</li>
      <li>Project-specific software, travel, contractor expenses: $9,000</li>
    </ul>

    <p>
      COGS = $63,000. Gross profit = $57,000. Gross margin = 47.5%.
      That&apos;s in the healthy range for an agency. If the same
      agency took on a $40K project at a 25% gross margin, blending
      the numbers down to 40% overall, the trend would be worth
      investigating before the next quarter.
    </p>

    <H3>Product business: a small e-commerce brand</H3>

    <ul>
      <li>Monthly revenue: <strong>$60,000</strong></li>
      <li>Cost of goods purchased + freight in: $24,000</li>
      <li>Payment processing (≈3% of revenue): $1,800</li>
      <li>Shipping out to customers: $4,200</li>
    </ul>

    <p>
      COGS = $30,000. Gross profit = $30,000. Gross margin = 50%.
      Healthy for direct-to-consumer e-commerce. If freight costs
      doubled or the brand started discounting heavily, that 50%
      could compress to 40% fast - and at 40%, after marketing and
      overhead, the business would be running thin.
    </p>

    <H2 id="common-mistakes">Common mistakes business owners make</H2>

    <H3>1. Treating COGS like a fixed bucket</H3>

    <p>
      Some COGS components are nearly fixed (a software license that
      scales with users; a hosting bill). Others are pure variable
      (cost of materials per unit sold). Mixing them obscures which
      lever to pull when margins compress. Split them on your
      bookkeeping if they&apos;re material.
    </p>

    <H3>2. Forgetting payment processing</H3>

    <p>
      2-3% of revenue disappearing to Stripe, Square, or PayPal is a
      direct cost of sale and belongs in COGS. Owners sometimes
      record it as overhead - which makes gross margin look better
      than it is.
    </p>

    <H3>3. Quoting gross margin to compare against a competitor&apos;s net margin</H3>

    <p>
      A common misuse. &quot;Our margins are 60%&quot; compared to
      a public company&apos;s 12% net margin is a different
      conversation than the speaker thinks they&apos;re having. Make
      sure both numbers are the same metric before drawing
      conclusions.
    </p>

    <H3>4. Letting gross margin compress quietly</H3>

    <p>
      Margin rarely collapses in one month. It drifts: input costs
      tick up 2%, a competitor forces a 3% discount, a new product
      mix has worse economics, payment processing fees grow with
      volume. Six months of 1% slips compound into a problem nobody
      saw coming.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">
          Revenue vs Profit
        </ArticleLink>{" "}
        - the parent distinction, if gross vs net vs operating still
        feels new.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/net-profit-explained">
          Net Profit Explained
        </ArticleLink>{" "}
        - the bottom-line counterpart. Gross sits at the top of the
        profit & loss statement; net sits at the bottom.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/ebitda-explained">
          EBITDA Explained
        </ArticleLink>{" "}
        - a related profit metric that strips out financing and
        accounting choices.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
          Fixed Costs vs Variable Costs
        </ArticleLink>{" "}
        - the cost vocabulary you need to draw the line between COGS
        and overhead cleanly.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/expense-growth-warning-signs">
          Expense Growth Warning Signs
        </ArticleLink>{" "}
        - margin compression is one of the most reliable expense-side
        warning signals.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Gross profit = Revenue − Cost of Goods Sold. It's the first profit number on the P&L.",
      "Gross margin (gross profit ÷ revenue × 100) lets you compare the number across periods and businesses.",
      "Healthy gross margin varies dramatically by industry - 25% can be excellent or terrible depending on category.",
      "Gross profit must cover all your operating costs for the business to be profitable. It's the floor.",
      "Watch gross margin month-over-month for compression - it's one of the earliest warning signs of a structural problem.",
      "Track gross profit per customer or product line where you can - it surfaces which growth is healthy growth.",
    ]} />
  </>
);
