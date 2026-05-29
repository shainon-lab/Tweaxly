import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "business-expense-categories-explained",
  title: "Business Expense Categories Explained",
  excerpt:
    "A working set of expense categories every small business should use. Standard names, what belongs in each, and how to keep the chart of accounts useful.",
  category: "expense-management",
  tags: ["Expense Categories", "Chart of Accounts", "Bookkeeping"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Most small businesses need 8-15 expense categories. More than that and the chart gets unwieldy; fewer and the report loses meaning.",
    "Core categories: Payroll, Rent & Utilities, Software & Tools, Marketing & Sales, Cost of Goods, Professional Services, Insurance, Travel, Office Supplies, Other.",
    "Separate fixed from variable inside categories where it matters (e.g., contractor work is usually variable; salaries are fixed).",
    "Tax-deductible categories matter for the IRS but should match how you actually run the business, not just bookkeeping convenience.",
    "Audit annually - categories drift, and a useful chart of accounts stays clean.",
  ],
  faq: [
    { q: "How many expense categories should I have?", a: "8-15 for most small businesses. Larger or more complex businesses may need 20-30. More than that and your monthly P&L becomes hard to read." },
    { q: "Should I follow my accountant's chart of accounts?", a: "Use it as a starting point. The accountant's structure is optimized for tax filing; you may need additional internal categories that aren't tax-relevant but matter for management." },
    { q: "What goes in \"Other\" or \"Miscellaneous\"?", a: "Ideally, very little. If miscellaneous is more than 5% of total expenses, you have categories that should be broken out. Audit and re-categorize annually." },
    { q: "Should I split contractor and employee payroll?", a: "Yes. Employees are usually fixed costs with payroll tax and benefit obligations. Contractors are usually variable and have different tax treatment. Keep them separate." },
    { q: "What's the difference between an expense category and a tag?", a: "Categories are the main bucket on your P&L (Payroll, Rent, Marketing). Tags are cross-cutting attributes (project, client, location, business unit). Use both for reporting flexibility." },
    { q: "Should marketing channels be separate categories?", a: "If material - yes. Most businesses benefit from separating paid advertising, content, events, and partnerships if any one is more than a few thousand dollars per month." },
  ],
  seo: {
    title: "Business Expense Categories Explained | Tweaxly",
    description:
      "A practical set of expense categories for small businesses. What to include, how to organize, and how to keep your chart of accounts useful.",
    keywords: [
      "business expense categories",
      "chart of accounts",
      "small business expenses",
      "expense tracking",
      "bookkeeping categories",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      A working set of expense categories is the foundation of a
      useful financial report. Get the categories right and your
      monthly P&L tells you exactly where money went; get them
      wrong and you&apos;re looking at a wall of accounting jargon
      that doesn&apos;t inform any decision.
    </Lead>

    <H2 id="standard-categories">A working set for most small businesses</H2>

    <p>
      Most small businesses can run effectively on 8-15 expense
      categories. The starter set:
    </p>

    <ul>
      <li>
        <strong>Cost of Goods Sold (COGS)</strong> - direct costs
        of what you sold (materials, freight in, payment processing,
        direct labor on the product)
      </li>
      <li>
        <strong>Payroll - Employees</strong> - salaries, employer
        taxes, benefits
      </li>
      <li>
        <strong>Payroll - Contractors</strong> - 1099 contractors,
        agencies, freelancers (separate because tax treatment and
        cost behavior differ)
      </li>
      <li>
        <strong>Rent & Utilities</strong> - office rent, utilities,
        cleaning
      </li>
      <li>
        <strong>Software & Tools</strong> - SaaS subscriptions,
        software licenses, productivity tools
      </li>
      <li>
        <strong>Marketing & Sales</strong> - paid ads, content,
        events, agency fees (consider splitting into 2-3 if material)
      </li>
      <li>
        <strong>Professional Services</strong> - accounting, legal,
        consulting (not directly related to product delivery)
      </li>
      <li>
        <strong>Insurance</strong> - business insurance, health
        insurance (if not in benefits), liability
      </li>
      <li>
        <strong>Travel & Meals</strong> - business travel, client
        entertainment
      </li>
      <li>
        <strong>Office Supplies & Other</strong> - small misc, but
        track if it grows
      </li>
      <li>
        <strong>Bank & Finance</strong> - bank fees, interest on
        loans (interest sometimes split out separately)
      </li>
      <li>
        <strong>Depreciation & Amortization</strong> - non-cash
        accounting expenses
      </li>
    </ul>

    <p>
      Add categories specific to your business model (Hosting &
      Infrastructure for software, Inventory Shrinkage for retail,
      etc.). The 8-15 range is a guideline, not a hard limit.
    </p>

    <H2 id="why-split">Why split things that look similar</H2>

    <p>
      Splitting categories that look like they could be combined
      produces useful diagnostics:
    </p>

    <ul>
      <li>
        <strong>Employee vs contractor payroll</strong> - very
        different cost behavior and tax treatment
      </li>
      <li>
        <strong>Marketing channels</strong> - which channels are
        growing? Which are paying back?
      </li>
      <li>
        <strong>Professional services types</strong> - accounting
        is fixed and recurring; legal is usually one-off
      </li>
      <li>
        <strong>Travel by purpose</strong> - sales travel ROI is
        different from team travel
      </li>
    </ul>

    <p>
      Granularity costs are mostly maintenance. Worth it when the
      categories produce different decisions; not worth it when
      they don&apos;t.
    </p>

    <H2 id="fixed-vs-variable">Tag fixed vs variable inside categories</H2>

    <p>
      Inside a category like Payroll, separate fixed (salaries)
      from variable (commissions, overtime, contractors). Inside
      Marketing, separate the always-on (CRM, content team) from
      the campaign-based (paid ads, events).
    </p>

    <p>
      The classification supports{" "}
      <ArticleLink href="/resources/business-forecasting/expense-forecasting">
        forecasting
      </ArticleLink>{" "}
      - fixed costs project linearly, variable costs project as
      ratios.
    </p>

    <H2 id="other-category">Watch the &quot;Other&quot; category</H2>

    <p>
      If &quot;Other&quot; or &quot;Miscellaneous&quot; is more
      than 5% of total expenses, you have categories that need
      to be broken out. The catch-all hides expense growth and
      makes diagnosis harder.
    </p>

    <Callout variant="info" title="Annual audit habit">
      Once a year, run through every line in &quot;Other&quot; and
      categorize properly. Add new categories for anything
      consistently appearing. A clean chart of accounts compounds
      in value over years.
    </Callout>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Too few categories</H3>

    <p>
      A 5-category P&L isn&apos;t informative. You can&apos;t
      diagnose what&apos;s changing.
    </p>

    <H3>2. Too many categories</H3>

    <p>
      A 40-category P&L is overwhelming and rarely revisits the
      same number from month to month. The granularity exceeds
      the decisions you actually make.
    </p>

    <H3>3. Categories that match tax filing only</H3>

    <p>
      The IRS&apos; chart of accounts is for taxes, not management.
      You need both; don&apos;t conflate them.
    </p>

    <H3>4. Categories that don&apos;t survive turnover</H3>

    <p>
      If only one person knows what goes in each category, the
      chart deteriorates when that person leaves. Document the
      rules.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/expense-management/fixed-costs-vs-variable-costs">
          Fixed Costs vs Variable Costs
        </ArticleLink>{" "}
        - the underlying cost behavior categorization.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/budget-planning-basics">
          Budget Planning Basics
        </ArticleLink>{" "}
        - budgeting works at the category level.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/cost-optimization-strategies">
          Cost Optimization Strategies
        </ArticleLink>{" "}
        - the playbook for cutting by category.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/expense-forecasting">
          Expense Forecasting
        </ArticleLink>{" "}
        - forecasting at the category level.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/hidden-business-costs">
          Hidden Business Costs
        </ArticleLink>{" "}
        - the costs that hide in poorly-named categories.
      </li>
    </ul>

    <KeyTakeaways items={[
      "8-15 categories is the sweet spot for most small businesses.",
      "Standard starter set covers payroll, rent, software, marketing, COGS, professional services, insurance, travel, supplies, other.",
      "Split categories where behavior or decisions differ (employees vs contractors, marketing channels).",
      "Watch \"Other\" - if it's above 5% of total, break it out.",
      "Tax categories aren't the same as management categories. Use both.",
      "Audit annually. A clean chart of accounts compounds in value.",
    ]} />
  </>
);
