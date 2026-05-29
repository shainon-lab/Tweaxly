import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "financial-red-flags-every-owner-should-know",
  title: "Financial Red Flags Every Owner Should Know",
  excerpt:
    "The financial patterns that almost always indicate trouble, and what to do when you see them. A practical catalogue every owner should keep close.",
  category: "business-signals",
  tags: ["Financial Red Flags", "Warning Signs", "Risk Management"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Eight financial red flags to recognize: aging receivables, gross margin compression, payable stretch, declining cash on positive profit, customer concentration drift, expense growth above revenue, falling new-customer count, and the \"explained-away\" miscellaneous category.",
    "Each red flag has a specific diagnostic and a specific response - don't apply one playbook to all.",
    "The pattern matters more than any single number. One red flag = investigate. Two together = act.",
    "Most financial failures involve 3-5 of these red flags persisting for 6+ months before the headline failure.",
    "The point of recognizing them isn't paranoia - it's catching problems while they're still small enough to fix cheaply.",
  ],
  faq: [
    { q: "What's a financial red flag?", a: "A specific pattern in your financial data that consistently precedes business problems. Examples: receivables aging, gross margin compression, declining cash on positive profit, customer concentration drift." },
    { q: "Should I panic when I see one?", a: "No - investigate. A single red flag often has a benign explanation. Two or more together, persistent for 2+ months, is when action is warranted." },
    { q: "What's the most under-recognized red flag?", a: "Gross margin compression. It's slow, it's quiet, and it's almost always structural. Most businesses lose 1-3 points of margin per year to undetected creep." },
    { q: "How quickly should I act when red flags appear?", a: "Investigate within a week. Diagnose within a month. Act within a quarter. Many red flags have months of runway before they become critical - use the time wisely." },
    { q: "Are some red flags worse than others?", a: "Aging receivables on a profitable business is the highest-urgency single red flag - it usually means you're 30-90 days from a cash problem. Slow trends (margin compression, expense creep) have longer fuses but bigger compounded impact." },
    { q: "Can I have red flags and still be healthy?", a: "Often, yes. The interpretation depends on growth stage, business model, and context. Use red flags as conversation starters with your numbers, not verdicts." },
  ],
  seo: {
    title: "Financial Red Flags Every Owner Should Know | Tweaxly",
    description:
      "Eight financial red flags that almost always indicate trouble. What to look for, what they usually mean, and what to do when you see them.",
    keywords: [
      "financial red flags",
      "business warning signs",
      "financial trouble signs",
      "early warning",
      "business signals",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      A red flag isn&apos;t a verdict - it&apos;s a signal worth
      investigating. The owners who catch problems early are the
      ones who recognize the patterns at first sight and ask the
      right question. Below is the catalogue every owner should
      have at their fingertips: what each signal means, when it
      matters, and what to do.
    </Lead>

    <H2 id="receivables">Red flag 1: Receivables aging out</H2>

    <p>
      <strong>What it looks like:</strong> Days Sales Outstanding
      (DSO) creeping up from 35 to 45 to 55. More invoices over
      60 days past due. Specific customers not paying.
    </p>

    <p>
      <strong>What it usually means:</strong> Customers are
      stressed (slower-paying is one of the earliest signs of
      customer financial trouble), terms have drifted, or
      collections discipline has slipped.
    </p>

    <p>
      <strong>What to do:</strong> Aggressive follow-up on
      everything 30+ days past due. Audit large balances. Consider
      shortening terms on new business.
    </p>

    <H2 id="margin-compression">Red flag 2: Gross margin compression</H2>

    <p>
      <strong>What it looks like:</strong> Cost-of-goods ratio
      drifting from 35% to 38% over 6+ months. Or gross margin
      moving from 60% to 55%.
    </p>

    <p>
      <strong>What it usually means:</strong> Input cost
      inflation, hidden discounting, customer mix shift, vendor
      price increases. Always structural, not seasonal.
    </p>

    <p>
      <strong>What to do:</strong> Diagnose the cause. If input
      costs, renegotiate or raise prices. If discounting, tighten
      sales discipline. If mix, decide whether to accept or
      adjust.
    </p>

    <H2 id="payable-stretch">Red flag 3: Payables stretching unilaterally</H2>

    <p>
      <strong>What it looks like:</strong> Days Payable
      Outstanding rising, but not by negotiation - just by
      delayed payment. Vendors calling.
    </p>

    <p>
      <strong>What it usually means:</strong> The business
      doesn&apos;t have the cash to pay on the agreed terms. A
      late-stage cash crunch sign.
    </p>

    <p>
      <strong>What to do:</strong> Diagnose cash flow urgently.
      This is often a 30-60 day warning of vendor relationships
      becoming permanently damaged.
    </p>

    <H2 id="cash-down-on-profit">Red flag 4: Declining cash on positive profit</H2>

    <p>
      <strong>What it looks like:</strong> P&L shows healthy
      profit; bank account drops month over month.
    </p>

    <p>
      <strong>What it usually means:</strong> The gap between
      profit and cash is widening. See{" "}
      <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
        Why Profitable Businesses Run Out of Cash
      </ArticleLink>.
      Usually receivables growth, inventory buildup, or debt
      principal payments.
    </p>

    <p>
      <strong>What to do:</strong> Reconcile profit to cash.
      Identify exactly where the cash is going. Build a 13-week
      forecast immediately.
    </p>

    <H2 id="concentration">Red flag 5: Customer concentration drift</H2>

    <p>
      <strong>What it looks like:</strong> Top customer growing
      from 15% to 25% to 35% of revenue. One client&apos;s
      retention becomes existentially important.
    </p>

    <p>
      <strong>What it usually means:</strong> Either you&apos;re
      losing other customers (concentration up by attrition) or
      a strong customer is over-indexed (concentration up by
      growth). Either way, risk is rising.
    </p>

    <p>
      <strong>What to do:</strong> Diversify acquisition
      aggressively. Build redundancy. Negotiate longer contract
      terms with the dominant account.
    </p>

    <H2 id="expense-growth">Red flag 6: Expense growth above revenue growth</H2>

    <p>
      <strong>What it looks like:</strong> Expenses growing 5-10+
      points faster than revenue for 6+ months.
    </p>

    <p>
      <strong>What it usually means:</strong> Margin erosion in
      progress. The math: a sustained 5-point gap erodes 15 points
      of margin over 3 years.
    </p>

    <p>
      <strong>What to do:</strong> Expense audit. Identify which
      categories are driving the gap. Fix or commit consciously
      to growth investment (and ensure cash supports it).
    </p>

    <H2 id="new-customer-drop">Red flag 7: Falling new customer count</H2>

    <p>
      <strong>What it looks like:</strong> New customer count
      dropping even as revenue holds (existing customers spending
      more).
    </p>

    <p>
      <strong>What it usually means:</strong> Acquisition is
      slowing. Often invisible in revenue for 60-90 days because
      retention masks it.
    </p>

    <p>
      <strong>What to do:</strong> Investigate the funnel - are
      leads down, or is conversion down? Either way, revenue will
      reflect it within a quarter.
    </p>

    <H2 id="miscellaneous-category">Red flag 8: &quot;Miscellaneous&quot; growing</H2>

    <p>
      <strong>What it looks like:</strong> The catch-all expense
      category quietly grows from 3% to 8% of total expenses.
    </p>

    <p>
      <strong>What it usually means:</strong> Hidden expense
      growth that nobody&apos;s scrutinizing because it&apos;s
      not in a named category.
    </p>

    <p>
      <strong>What to do:</strong> Break it out. Categorize
      properly. Most miscellaneous categories contain 30-50%
      that should be in a real expense bucket - and once labeled,
      the growth becomes visible.
    </p>

    <H2 id="how-to-use">How to use the list</H2>

    <p>
      The point isn&apos;t to scan for red flags and panic. The
      point is to know what each one means so you can recognize
      it in context.
    </p>

    <ul>
      <li>
        <strong>One red flag</strong> - investigate. Probably has
        a benign explanation.
      </li>
      <li>
        <strong>Two together, persistent for 2+ months</strong> -
        act. Get ahead of the trend.
      </li>
      <li>
        <strong>Three or more</strong> - reset assumptions and
        revisit the forecast. Something structural is happening.
      </li>
    </ul>

    <Callout variant="info" title="The compound pattern">
      Most business failures involve 3-5 red flags persisting for
      6+ months. The failures look sudden from outside; from
      inside, the signals were there for two quarters.
    </Callout>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-signals/early-signs-revenue-growth-is-slowing">
          Early Signs Revenue Growth Is Slowing
        </ArticleLink>{" "}
        - the revenue-side companion.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/expense-growth-warning-signs">
          Expense Growth Warning Signs
        </ArticleLink>{" "}
        - the expense-side companion.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/detecting-business-trends-before-they-become-problems">
          Detecting Business Trends Before They Become Problems
        </ArticleLink>{" "}
        - the discipline of watching consistently.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>{" "}
        - the classic failure mode several red flags point to.
      </li>
      <li>
        <ArticleLink href="/resources/business-signals/business-signals-founders-monitor">
          Business Signals Every Owner Should Monitor
        </ArticleLink>{" "}
        - the broader monitoring framework.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Eight red flags to know: receivables aging, margin compression, payable stretch, cash-down-on-profit, customer concentration, expense growth ahead of revenue, falling new customers, growing miscellaneous.",
      "Each has a specific diagnostic and specific response. Don't apply one playbook to all.",
      "One red flag = investigate. Two persistent = act. Three+ = reset assumptions.",
      "Most failures involve 3-5 red flags persisting for 6+ months before the headline event.",
      "The most under-recognized: gross margin compression. Slow, structural, costly.",
      "The point is catching problems while they're small enough to fix cheaply.",
    ]} />
  </>
);
