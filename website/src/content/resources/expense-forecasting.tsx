import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "expense-forecasting",
  title: "Expense Forecasting (Practical Methods)",
  excerpt:
    "Expense forecasting is half the equation most owners get wrong. Here's how to project fixed costs, variable costs, and the messy ones in between.",
  category: "business-forecasting",
  tags: ["Expense Forecasting", "Budgeting", "Cost Planning"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Split expenses into fixed (predictable monthly costs) and variable (scale with revenue) before forecasting.",
    "Fixed costs: forecast directly from current run rate plus known changes (new hires, lease renewals).",
    "Variable costs: forecast as a percentage of revenue or per-unit driver, then check the ratio quarterly.",
    "Don't forget lumpy expenses - quarterly taxes, annual insurance, software renewals - they wreck cash flow if unforecasted.",
    "The most common mistake: forecasting revenue carefully and expenses sloppily.",
  ],
  faq: [
    { q: "How do I forecast fixed costs?", a: "Take current monthly run rate. Add known increases (new hires starting, lease escalation, scheduled software price changes). Project forward. Fixed costs are the easiest part of expense forecasting." },
    { q: "How do I forecast variable costs?", a: "Express them as a percentage of revenue or as a per-unit cost. Cost of goods at 35% of revenue. Payment processing at 3% of revenue. Forecast revenue first, then apply the ratios. Revisit ratios quarterly." },
    { q: "What's a hidden expense?", a: "Costs that exist but aren't on your radar - subscription creep, annual renewals you forgot, depreciation kicking in on new equipment, payroll tax true-ups. Most expense forecasts miss 5-10% to hidden items." },
    { q: "How granular should expense forecasting be?", a: "Group by category that matters for decisions. Payroll, rent, software, marketing, professional services - usually 8-12 categories at most. More granular than that and the forecast becomes maintenance burden." },
    { q: "How often should I revise expense forecasts?", a: "Monthly along with revenue. Recurring expenses don't move much, but variable costs need ratio updates and one-offs need to be slotted in." },
    { q: "What's the biggest expense forecasting mistake?", a: "Treating all expenses as fixed. Variable costs that scale with revenue (cost of goods, payment processing, contractor work) need to be modeled as ratios, not flat amounts." },
  ],
  seo: {
    title: "Expense Forecasting: Practical Methods | Tweaxly",
    description:
      "How to project fixed costs, variable costs, and lumpy expenses. A plain-English guide to expense forecasting that catches what most forecasts miss.",
    keywords: [
      "expense forecasting",
      "expense forecast",
      "fixed costs vs variable costs",
      "cost planning",
      "budget forecasting",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Most expense forecasts fail in the same way: someone projects
      revenue carefully and then estimates expenses with a flat
      percentage or a gut feel. The result is a forecast that looks
      reasonable until reality arrives and the variable costs scale
      faster than expected. The discipline is mechanical, but it
      takes care.
    </Lead>

    <H2 id="split-first">Split first: fixed vs variable</H2>

    <p>
      The foundation of expense forecasting is separating costs by
      how they behave with revenue:
    </p>

    <ul>
      <li>
        <strong>Fixed costs</strong> - costs that stay the same
        regardless of revenue. Rent, salaries, software subscriptions,
        insurance, debt service.
      </li>
      <li>
        <strong>Variable costs</strong> - costs that scale with
        revenue or volume. Cost of goods, payment processing fees,
        contractor work, shipping, hourly labor.
      </li>
      <li>
        <strong>Semi-variable</strong> - costs that have a fixed
        component plus a variable component. Utilities (base + usage),
        some software subscriptions (base + per-user), customer
        support (team + volume).
      </li>
    </ul>

    <p>
      Each behaves differently and gets forecasted differently. See{" "}
      <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
        Fixed Costs vs Variable Costs
      </ArticleLink>{" "}
      for the deeper categorization.
    </p>

    <H2 id="fixed-forecast">Forecasting fixed costs</H2>

    <p>
      The easiest part. Take current monthly run rate, add known
      changes:
    </p>

    <ul>
      <li>New hires (start date + loaded cost)</li>
      <li>Salary increases (effective date + amount)</li>
      <li>Lease escalations (contract terms)</li>
      <li>Software renewals (often at higher rates)</li>
      <li>Insurance renewals</li>
      <li>Scheduled equipment purchases (depreciation starting)</li>
    </ul>

    <p>
      Most fixed cost forecasts are accurate to within ±5% over 12
      months because the inputs are knowable.
    </p>

    <H2 id="variable-forecast">Forecasting variable costs</H2>

    <p>
      Express each variable cost as a percentage of revenue or as a
      per-unit cost. Then forecast revenue first, apply the ratios.
    </p>

    <p>
      Examples:
    </p>

    <ul>
      <li>
        Cost of goods sold: 35% of revenue (from last 12 months
        average)
      </li>
      <li>
        Payment processing: 2.9% + $0.30 per transaction; or ~3%
        of revenue
      </li>
      <li>
        Shipping out: $8 average per order × order count
      </li>
      <li>
        Customer support contractor hours: scales with active
        customer count
      </li>
      <li>
        Sales commissions: 10% of new revenue
      </li>
    </ul>

    <p>
      Revisit the ratios quarterly. A cost-of-goods ratio that
      drifts from 35% to 40% over six months is one of the most
      reliable early-warning signs of margin compression - and
      catches it in the forecast before it shows up in actual
      monthly results.
    </p>

    <H2 id="lumpy-expenses">Don&apos;t forget lumpy expenses</H2>

    <p>
      The category of expenses that wreck unforecasted cash flow:
    </p>

    <ul>
      <li>Quarterly estimated taxes</li>
      <li>Annual insurance renewals (often $5-30K lump sum)</li>
      <li>Annual software renewals (sometimes 12-15 months in one bill)</li>
      <li>Annual accounting/audit fees</li>
      <li>Equipment purchases (capital expenditure)</li>
      <li>Legal fees on specific matters</li>
      <li>Conference and event spend</li>
    </ul>

    <p>
      None of these appear in monthly run rate. All of them appear
      in cash flow when they hit. Build them into the forecast as
      discrete monthly amounts in the right months - or as
      monthly accruals if the cash impact is what you&apos;re
      planning.
    </p>

    <Callout variant="warn" title="The 5-10% hidden tax">
      Most expense forecasts miss 5-10% to hidden costs - small
      subscription creep, annual renewals, tax true-ups,
      depreciation kicking in on equipment purchased months ago.
      Build a buffer or audit the actual expense base annually.
    </Callout>

    <H2 id="categorization">How granular should the forecast be</H2>

    <p>
      Group by category that matters for decisions. 8-12 categories
      is usually enough:
    </p>

    <ul>
      <li>Payroll (fixed)</li>
      <li>Contractor / freelance (variable)</li>
      <li>Rent & utilities (fixed)</li>
      <li>Software & tools (mostly fixed)</li>
      <li>Marketing & advertising (variable)</li>
      <li>Cost of goods (variable)</li>
      <li>Professional services (semi-variable)</li>
      <li>Insurance (fixed, lumpy)</li>
      <li>Travel & entertainment (variable)</li>
      <li>Office & supplies (mostly fixed)</li>
      <li>Taxes (fixed, lumpy)</li>
      <li>Other</li>
    </ul>

    <p>
      More granular than that and the forecast becomes a maintenance
      burden without adding decision-relevant information.
    </p>

    <H2 id="common-mistakes">Common expense forecasting mistakes</H2>

    <H3>1. Treating all expenses as fixed</H3>

    <p>
      Already covered. The most common error - and the one that
      makes forecasts most wrong when revenue moves.
    </p>

    <H3>2. Forecasting expenses from last month, not the run rate</H3>

    <p>
      Any single month has noise. Use a 3-month rolling average for
      &quot;normal&quot; expense levels.
    </p>

    <H3>3. Forgetting payroll true-ups and benefits adjustments</H3>

    <p>
      Bonus accruals, year-end true-ups, benefit cost changes.
      Easy to miss; meaningful when missed.
    </p>

    <H3>4. Ignoring inflation</H3>

    <p>
      For long-horizon forecasts, fixed costs aren&apos;t actually
      fixed. Rent escalates. Software prices rise. Insurance
      renews higher. Add 3-5% per year to the fixed cost base for
      multi-year forecasts.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-forecasting/what-is-financial-forecasting">
          What Is Financial Forecasting
        </ArticleLink>{" "}
        - the foundational concept.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/revenue-forecasting-methods">
          Revenue Forecasting Methods
        </ArticleLink>{" "}
        - the companion methods for the revenue side.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
          Fixed Costs vs Variable Costs
        </ArticleLink>{" "}
        - the categorization underlying the forecast.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/budget-planning-basics">
          Budget Planning Basics
        </ArticleLink>{" "}
        - the budget version of the same exercise.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/scenario-planning-explained">
          Scenario Planning Explained
        </ArticleLink>{" "}
        - modeling expense changes under different scenarios.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Split fixed vs variable costs before forecasting. Different methods apply to each.",
      "Fixed: current run rate + known changes (hires, renewals, escalations).",
      "Variable: percentage of revenue or per-unit driver. Revisit ratios quarterly.",
      "Don't forget lumpy expenses - quarterly taxes, annual renewals, equipment purchases.",
      "Most forecasts miss 5-10% to hidden costs. Build a buffer or audit annually.",
      "For multi-year forecasts, add 3-5% per year for inflation on fixed costs.",
    ]} />
  </>
);
