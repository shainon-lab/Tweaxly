import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "why-profitable-businesses-run-out-of-cash",
  title: "Why Profitable Businesses Run Out of Cash",
  excerpt:
    "One of the most common ways businesses fail: they're profitable on paper and broke in the bank account. Here's why it happens and how to spot it.",
  category: "cash-flow-management",
  tags: ["Cash vs Profit", "Working Capital", "Growth"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 7,
  tldr: [
    "Profit recognizes revenue when earned; cash arrives when collected. The gap is where cash crunches happen.",
    "Fast growth is the most common culprit - every new dollar of revenue requires working capital before the cash arrives.",
    "Slow-paying customers, inventory buildup, equipment investment, and debt principal all consume cash without lowering profit.",
    "The signs are visible months before the crisis: aging receivables, growing inventory, declining cash even as profit stays positive.",
    "Prevention: rolling cash flow forecast, working capital discipline, and never spending against profit without checking cash first.",
  ],
  faq: [
    { q: "How can a business be profitable but run out of cash?", a: "Profit recognizes revenue when earned; cash arrives when collected. A business can earn $100K of profit on paper while customers still owe them $150K - all the profit is locked up as unpaid receivables. Add inventory, equipment purchases, or debt principal payments, and cash can run out while profit is still positive." },
    { q: "Why does fast growth often cause cash crunches?", a: "Growth requires working capital. Every new customer needs inventory ordered, payroll paid, and infrastructure scaled before they pay. A business growing 50% needs roughly 50% more working capital - which has to come from somewhere." },
    { q: "What are the warning signs?", a: "Aging receivables (DSO creeping up), inventory growing faster than revenue, declining cash even on profitable months, increasing reliance on credit lines, slow vendor payments. Any one is concerning; all together are urgent." },
    { q: "Can I borrow my way out of this?", a: "Sometimes - if the underlying business is healthy and the cash crunch is timing-driven. Debt buys time but doesn't fix economics. If the gap between profit and cash keeps widening, borrowing accelerates the problem." },
    { q: "What's the single best protection?", a: "A weekly-updated 13-week cash flow forecast that you actually look at. Most cash crunches are visible 6-10 weeks before they happen on a properly-built forecast." },
    { q: "Are some industries more prone to this?", a: "Yes. Industries with long collection cycles (B2B services, construction, agencies on net-60+), inventory-heavy businesses, and rapidly-growing subscription businesses with annual prepayment options all have wider profit-cash gaps." },
  ],
  seo: {
    title: "Why Profitable Businesses Run Out of Cash | Tweaxly",
    description:
      "One of the most common failure modes for small businesses: profitable on paper, broke in the bank. A plain-English explanation of why and how to spot it.",
    keywords: [
      "profitable business running out of cash",
      "cash flow vs profit",
      "why profitable businesses fail",
      "working capital management",
      "cash crunch",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most counter-intuitive failure mode in small
      business: the company is profitable, the team is doing good
      work, customers are signing up - and the bank account is
      empty. It happens often enough to be considered a category of
      its own. The good news: it&apos;s mostly preventable once you
      understand the mechanics.
    </Lead>

    <H2 id="the-mechanics">The mechanics: how the gap opens</H2>

    <p>
      Profit and cash diverge for three reasons. In a fast-growing
      business, all three compound at once.
    </p>

    <H3>1. Revenue is earned before it&apos;s collected</H3>

    <p>
      A business that books $100K of revenue this month on net-30
      terms records $100K of revenue on the P&L today. The cash
      arrives next month. Multiply by every month of growth, and
      receivables grow with the business - tying up more and more
      cash.
    </p>

    <H3>2. Expenses are paid before revenue arrives</H3>

    <p>
      To earn that revenue, the business spent money first. Payroll
      to deliver the work. Inventory to ship the product.
      Subscriptions to run the operation. Most expenses are due
      well before the matching revenue is collected.
    </p>

    <H3>3. Some cash uses don&apos;t touch profit at all</H3>

    <p>
      Buying inventory uses cash but only hits profit when it&apos;s
      sold (often months later). Paying down loan principal uses
      cash but only the interest hits profit. Buying equipment uses
      cash but only the depreciation hits profit, spread over years.
    </p>

    <p>
      All three together: a growing business pays cash out faster
      than it collects cash in, while also using cash for
      non-profit-affecting investments. Profit can stay strong
      throughout. Cash drains anyway.
    </p>

    <H2 id="the-classic-pattern">The classic growth-driven failure</H2>

    <p>
      The most common version of this story: a business growing
      fast, taking on bigger projects, hiring to keep up. Revenue is
      up 60% year over year. Profit margins are stable. By every
      metric on the P&L, the business is thriving.
    </p>

    <p>
      Then payroll comes due and there isn&apos;t money to cover
      it. The owner is stunned: &quot;but we&apos;re more profitable
      than we&apos;ve ever been!&quot; What happened:
    </p>

    <ul>
      <li>
        Receivables doubled (because revenue doubled), tying up
        ~$200K more cash.
      </li>
      <li>
        Inventory grew to support higher sales, tying up ~$80K more.
      </li>
      <li>
        New hires landed before their contributions started generating
        revenue, costing ~$60K of cash for two months.
      </li>
      <li>
        A loan principal payment came due, taking another $30K out
        of cash.
      </li>
    </ul>

    <p>
      Net: a profitable business consumed $370K of cash over six
      months and ran into a wall. None of it showed up as bad on
      the P&L.
    </p>

    <Callout variant="warn" title="The harsh rule">
      Growth requires cash. The faster you grow, the more cash you
      tie up before profits come back as bank balance. A business
      growing 30% per year and operating cash-flow-positive is
      doing better than one growing 100% but burning cash to fund
      it.
    </Callout>

    <H2 id="warning-signs">The warning signs</H2>

    <p>
      Several visible indicators warn you the gap is widening,
      months before it becomes a crisis.
    </p>

    <ul>
      <li>
        <strong>Days Sales Outstanding (DSO) creeping up.</strong>{" "}
        Customers paying later than they used to. Every day of
        DSO costs you cash.
      </li>
      <li>
        <strong>Inventory growing faster than revenue.</strong>{" "}
        Cash going into goods that haven&apos;t sold yet.
      </li>
      <li>
        <strong>Cash balance declining despite positive net
        profit.</strong> The clearest single signal that the gap
        between profit and cash is widening.
      </li>
      <li>
        <strong>Heavier reliance on credit lines.</strong> Operating
        cash flow isn&apos;t covering operating needs.
      </li>
      <li>
        <strong>Stretching vendor payments without explicit
        negotiation.</strong> Paying late because you have to,
        not because you arranged to.
      </li>
    </ul>

    <p>
      Any one of these is worth investigating. All together is
      urgent.
    </p>

    <H2 id="prevention">Prevention</H2>

    <p>
      Three habits that prevent this pattern.
    </p>

    <H3>1. Maintain a 13-week rolling cash forecast</H3>

    <p>
      The fastest single way to catch the gap. Covered in detail in{" "}
      <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
        Cash Flow Forecasting
      </ArticleLink>.
    </p>

    <H3>2. Discipline working capital actively</H3>

    <p>
      Don&apos;t let receivables aging drift. Don&apos;t let
      inventory swell. Don&apos;t pay early when you could pay on
      time. See{" "}
      <ArticleLink href="/resources/cash-flow-management/how-to-improve-cash-flow">
        How to Improve Cash Flow
      </ArticleLink>.
    </p>

    <H3>3. Never spend against profit without checking cash</H3>

    <p>
      Before investing, hiring, or distributing, reconcile profit
      to cash. If the P&L says you have $50K of profit but you only
      have $5K in the bank, the $50K is locked up somewhere -
      figure out where before spending it.
    </p>

    <H2 id="recovery">If you&apos;re already in the gap</H2>

    <p>
      Three immediate actions:
    </p>

    <ol>
      <li>
        <strong>Receivables aggressive follow-up.</strong> Every
        invoice over 30 days past due gets a call. Cash you&apos;re
        owed but not collecting is the cheapest source of cash you
        have.
      </li>
      <li>
        <strong>Defer everything non-critical.</strong> New hires,
        new equipment, marketing experiments. Buy time.
      </li>
      <li>
        <strong>Talk to your bank before you need to.</strong> A
        credit line negotiated when you don&apos;t need it is
        cheap and easy. The same conversation when you&apos;re in
        crisis is much more expensive.
      </li>
    </ol>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/cash-flow-vs-profit">
          Cash Flow vs Profit
        </ArticleLink>{" "}
        - the foundational distinction.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>{" "}
        - the prevention tool.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/how-to-improve-cash-flow">
          How to Improve Cash Flow
        </ArticleLink>{" "}
        - the operational levers.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-problems-early-warning">
          How to Detect Cash Flow Problems Before They Happen
        </ArticleLink>{" "}
        - the warning signs in detail.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - the growth rate the business can actually fund.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Profit is paper; cash is bank. They can disagree significantly during growth.",
      "Fast growth is the most common cause of profitable cash crunches.",
      "Receivables aging, inventory growth, declining cash on positive profit - all are warning signs.",
      "A 13-week rolling cash forecast catches most cash crunches 6-10 weeks before they happen.",
      "Never spend based on profit without checking cash first.",
      "If you're already in the gap: aggressive receivables, defer non-critical, talk to the bank early.",
    ]} />
  </>
);
