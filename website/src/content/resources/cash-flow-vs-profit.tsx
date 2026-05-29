import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-flow-vs-profit",
  title: "Cash Flow vs Profit: Why They Disagree",
  excerpt:
    "Profit is what you earned on paper. Cash flow is what's actually in your bank account. They can differ by a lot - here's why, and what to do about it.",
  category: "financial-fundamentals",
  tags: ["Cash Flow", "Profit", "Cash vs Profit", "Working Capital"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 8,
  tldr: [
    "Profit is what you earned on paper - revenue minus expenses for the period.",
    "Cash flow is what actually moved through your bank account - cash in minus cash out.",
    "They disagree because of timing (invoices paid later), non-cash expenses (depreciation), and balance-sheet movements (inventory, debt principal, equipment).",
    "A profitable business can run out of cash. A loss-making business can have cash on hand. Both are common.",
    "Owners need to watch both numbers; one tells you about health, the other tells you about survival.",
  ],
  faq: [
    { q: "What's the simplest way to explain the difference?", a: "Profit is the result of accounting math on what happened. Cash flow is the result of looking at your bank statement. They measure the same business but from different angles." },
    { q: "Why isn't profit the same as cash?", a: "Three reasons: timing (you earned revenue but haven't collected it yet), non-cash expenses (depreciation reduces profit but doesn't move cash), and balance-sheet movements (buying inventory or paying loan principal uses cash without changing profit)." },
    { q: "Can a profitable business go bankrupt?", a: "Yes - this is one of the most common failure modes for fast-growing businesses. Profit on the P&L doesn't pay payroll; cash in the bank does." },
    { q: "Can a loss-making business have positive cash flow?", a: "Yes - usually when depreciation is significant (cash already spent in the past) or when the business is collecting on prior-period sales while expenses are declining." },
    { q: "Which should I look at first?", a: "Cash flow if you're worried about survival. Profit if you're evaluating the business's health and trajectory. Healthy businesses produce both; struggling businesses tend to lose one before the other." },
    { q: "What's the most useful single cash flow report?", a: "A 13-week rolling cash flow forecast - your expected cash in and out, week by week, for the next quarter. It's short enough to be accurate and long enough to give you room to react." },
  ],
  seo: {
    title: "Cash Flow vs Profit: Why They Disagree | Tweaxly",
    description:
      "Profit is what you earned on paper. Cash flow is what's actually in your bank account. A plain-English guide to why they differ and what to watch.",
    keywords: [
      "cash flow vs profit",
      "profit vs cash flow",
      "difference between cash flow and profit",
      "why is my business not making money",
      "cash flow forecasting",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Two numbers that should agree but rarely do. The single most
      common source of avoidable financial pain for small business
      owners is treating profit and cash as if they&apos;re the same
      thing. They aren&apos;t. Understanding why - and watching both
      independently - is one of the highest-leverage habits in
      running a business.
    </Lead>

    <DefinitionBlock term="Profit">
      what your business earned over a period of time on paper -
      revenue minus expenses, calculated using accrual accounting
      conventions. Lives on the profit and loss statement (P&L).
    </DefinitionBlock>

    <DefinitionBlock term="Cash flow">
      what actually moved in and out of your bank account over a
      period - the literal cash you received minus the literal
      cash you paid out. Lives on the cash flow statement (and
      visible to anyone looking at your bank statements).
    </DefinitionBlock>

    <p>
      The two measure the same business, but profit tells you about
      economic activity and cash flow tells you about the actual
      money. They&apos;re usually correlated but rarely identical.
    </p>

    <H2 id="why-they-differ">Why they disagree</H2>

    <p>
      Three reasons, each worth understanding.
    </p>

    <H3>1. Timing - revenue earned isn&apos;t cash received</H3>

    <p>
      Accrual accounting recognizes revenue when the sale happens,
      not when the customer pays. If you invoice $80,000 on net-30
      terms today, your P&L shows the revenue this month - but your
      bank account doesn&apos;t see the cash for 30 days (assuming
      the customer pays on time). The same logic runs in the other
      direction: expenses are recognized when incurred, not when
      paid.
    </p>

    <p>
      Most small businesses live with some version of this gap. The
      bigger the gap (longer payment terms, slow-paying customers,
      seasonal sales), the more profit and cash diverge.
    </p>

    <H3>2. Non-cash expenses - depreciation and amortization</H3>

    <p>
      When a business buys equipment, the cash leaves immediately.
      But on the P&L, that purchase is spread over the equipment&apos;s
      useful life as depreciation. So a $50,000 truck bought in
      January might show up as $10,000 of depreciation expense per
      year for five years - even though no actual cash leaves the
      business in years 2-5 because of that purchase.
    </p>

    <p>
      The result: depreciation lowers profit without lowering cash.
      A business with significant capital assets (manufacturing,
      construction, fleet) can show low profit but healthy cash
      flow purely because depreciation is a non-cash expense.
    </p>

    <H3>3. Balance-sheet movements that don&apos;t hit the P&L</H3>

    <p>
      Buying inventory, paying down loan principal, investing in
      capital equipment, and shareholder distributions all use cash
      but don&apos;t reduce profit (or do so much later). The
      profit number doesn&apos;t see them; the cash account does.
    </p>

    <p>
      The flip side: borrowing money increases cash without
      increasing profit. So does collecting on accounts receivable
      from prior periods. So does customer prepayments.
    </p>

    <H2 id="side-by-side">Side by side</H2>

    <ComparisonTable
      caption="Profit and cash flow, compared"
      columns={["Profit (P&L)", "Cash flow"]}
      rows={[
        {
          label: "What it measures",
          cells: ["Economic activity over a period", "Actual money in and out of the bank"],
        },
        {
          label: "When revenue is recognized",
          cells: ["When earned (invoice sent)", "When collected (cash received)"],
        },
        {
          label: "Includes depreciation?",
          cells: ["Yes (non-cash expense)", "No (cash already spent in the past)"],
        },
        {
          label: "Includes loan principal payments?",
          cells: ["No (only the interest)", "Yes (it's actual cash going out)"],
        },
        {
          label: "Includes inventory purchases?",
          cells: ["No (shows up as COGS when sold)", "Yes (immediate cash out)"],
        },
        {
          label: "What it tells you",
          cells: ["Whether the business is economically healthy", "Whether the business has the money it needs to operate"],
        },
        {
          label: "When to watch it",
          cells: ["Monthly, quarterly", "Weekly or daily for tight businesses"],
        },
      ]}
    />

    <H2 id="why-it-matters">Why this matters for small business survival</H2>

    <p>
      The classic failure mode: a small business growing fast,
      showing strong profit, and running out of cash. Here&apos;s
      how it happens.
    </p>

    <p>
      A product business books $200K of orders in a month - strong
      revenue, strong profit on paper. But to fulfill those orders,
      they had to buy $90K of inventory, pay $20K of additional
      payroll, and put $5K toward a new piece of equipment. They
      typically collect 60 days after invoicing. So in the same
      month: $200K of revenue recognized, but only $50K of cash
      collected, while $115K of cash went out. Cash position dropped
      $65K in a month the P&L called &quot;profitable.&quot;
    </p>

    <p>
      Multiply by three or four months of growth and the business
      can hit a cash wall while still posting strong profit. The
      common response - &quot;but we&apos;re profitable!&quot; - is
      true and irrelevant to the bank, the payroll provider, and
      the vendors expecting payment.
    </p>

    <p>
      The opposite failure mode is rarer but real: a business that
      looks unprofitable on the P&L but is generating cash because
      of large depreciation, large prior-period receivables coming
      in, or a one-time gain that hasn&apos;t hit the P&L yet.
      Owners can mistake the cash for sustainable profit and
      overspend.
    </p>

    <Callout variant="warn" title="The rule">
      Profit determines whether the business can survive long-term.
      Cash determines whether it can survive the next 90 days. Both
      are real. Watch both.
    </Callout>

    <H2 id="worked-example">A worked example with both numbers</H2>

    <p>
      A small wholesaler&apos;s month:
    </p>

    <ul>
      <li>Revenue (invoices sent): <strong>$120,000</strong></li>
      <li>Cost of goods sold: $66,000</li>
      <li>Operating expenses: $32,000</li>
      <li>Depreciation: $4,000</li>
      <li>Interest: $1,500</li>
      <li>Tax provision: $3,500</li>
    </ul>

    <p>
      <strong>Net profit:</strong> $120,000 − $66,000 − $32,000 − $4,000 − $1,500 − $3,500 = $13,000.
    </p>

    <p>
      And here&apos;s the cash side for the same month:
    </p>

    <ul>
      <li>Cash collected from customers (60-day terms): $90,000</li>
      <li>Cash paid for inventory purchased this month: $70,000 (some for future periods)</li>
      <li>Cash paid for operating expenses: $32,000</li>
      <li>Cash paid on interest: $1,500</li>
      <li>Cash paid on loan principal: $4,000 (not on the P&L)</li>
      <li>Cash for new equipment: $8,000 (not on the P&L this month)</li>
    </ul>

    <p>
      <strong>Cash flow:</strong> $90,000 − $70,000 − $32,000 − $1,500 − $4,000 − $8,000 = −$25,500.
    </p>

    <p>
      Same business, same month. Profit says they made $13,000.
      Cash flow says they lost $25,500. Both numbers are correct.
      Both are real. They&apos;re measuring different things.
    </p>

    <H2 id="practical-implications">Practical implications</H2>

    <p>
      Three concrete habits that follow from understanding the
      profit vs cash distinction.
    </p>

    <H3>Maintain a 13-week rolling cash forecast</H3>

    <p>
      The single most useful cash management tool. Project expected
      cash in (when invoices are likely to be paid) and cash out
      (recurring expenses, debt payments, scheduled purchases) by
      week for the next 13 weeks. Update weekly. Most cash crunches
      are visible in this report 6-8 weeks before they happen.
    </p>

    <H3>Reconcile profit to cash quarterly</H3>

    <p>
      Once a quarter, walk through why net profit and cash flow
      from operations differ. The explanation should always be:
      timing of receivables, timing of payables, inventory
      movements, non-cash expenses. If you can&apos;t explain the
      gap, something is wrong (either in the books or in the
      business).
    </p>

    <H3>Never pay distributions or make investment decisions from profit alone</H3>

    <p>
      Before committing cash, check the cash position - not the
      P&L. Owners get burned distributing &quot;profit&quot; that
      hasn&apos;t arrived in cash yet, or hiring against future
      revenue that turns into slow-paying receivables.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/revenue-vs-profit">
          Revenue vs Profit
        </ArticleLink>{" "}
        - the foundational distinction below this one.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/net-profit-explained">
          Net Profit Explained
        </ArticleLink>{" "}
        - the profit number most often confused with cash.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/what-is-cash-flow">
          What Is Cash Flow
        </ArticleLink>{" "}
        - the deeper dive on cash specifically.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - the classic failure mode this article warns about.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>{" "}
        - how to build the 13-week rolling forecast.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Profit and cash flow measure different things. Both are real; both matter.",
      "They differ because of timing (accrual vs cash), non-cash expenses (depreciation), and balance-sheet movements (inventory, principal, equipment).",
      "Profitable businesses can and do run out of cash - especially during growth.",
      "Loss-making businesses can have positive cash flow - especially when depreciation is significant.",
      "Watch profit monthly, cash flow weekly. Never spend against profit without checking cash.",
      "A 13-week rolling cash flow forecast catches most cash crunches with weeks of warning.",
    ]} />
  </>
);
