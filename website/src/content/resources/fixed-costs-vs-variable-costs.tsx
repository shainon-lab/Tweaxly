import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, ComparisonTable, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "fixed-costs-vs-variable-costs",
  title: "Fixed Costs vs Variable Costs",
  excerpt:
    "Fixed costs stay the same regardless of activity. Variable costs scale with it. The distinction drives almost every cost decision in your business.",
  category: "expense-management",
  tags: ["Fixed Costs", "Variable Costs", "Cost Structure"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "Fixed costs stay roughly the same regardless of revenue (rent, salaries, software).",
    "Variable costs scale with activity (cost of goods, payment processing, contractor work).",
    "Semi-variable costs have both - a fixed base plus a variable component (utilities, tiered software).",
    "The mix matters for break-even, scenario planning, and cost cutting. High fixed cost businesses have high operating leverage - they make more on the way up and lose more on the way down.",
    "Owners often confuse fixed for variable and over-cut in downturns. Most \"fixed\" costs are renegotiable, just not immediately.",
  ],
  faq: [
    { q: "What's the simplest difference?", a: "Fixed: doesn't move with sales. Variable: scales with sales. Rent is fixed. Cost of goods is variable. Software subscriptions are fixed. Payment processing is variable." },
    { q: "What's a semi-variable cost?", a: "A cost with both fixed and variable components. Utilities have a base service fee plus usage-based charges. Tiered software has a base plan plus per-seat or per-feature additions." },
    { q: "Why does the distinction matter?", a: "Because they behave differently when revenue changes. High-fixed-cost businesses have high operating leverage - they grow profit fast on the way up and lose it fast on the way down." },
    { q: "Are salaries fixed or variable?", a: "Salaried employees are fixed. Hourly employees scale with hours worked (variable). Commissions are variable. Most businesses have a mix - track them as separate categories." },
    { q: "How do I cut fixed costs?", a: "Slower than variable. Most fixed costs have contracts, notice periods, or relationships you don't want to break. Plan reductions over quarters, not days." },
    { q: "What's a good fixed-to-variable cost ratio?", a: "Depends on the business model. Software businesses tend to have high fixed costs (engineers, infrastructure) and low variable. Retailers have lower fixed and higher variable. There's no universal target." },
  ],
  seo: {
    title: "Fixed Costs vs Variable Costs | Tweaxly",
    description:
      "Fixed costs stay the same regardless of activity; variable costs scale with it. A plain-English guide to the distinction and why it matters.",
    keywords: [
      "fixed costs vs variable costs",
      "fixed and variable costs",
      "cost structure",
      "operating leverage",
      "cost behavior",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most important categorization in business expenses.
      Get the fixed vs variable distinction right and most cost
      decisions become easier - cuts during downturns, forecasting,
      pricing, scenario planning. Get it wrong and you over-react
      to volatility or under-react to structural cost growth.
    </Lead>

    <DefinitionBlock term="Fixed costs">
      costs that stay roughly the same regardless of revenue or
      activity level. Rent, salaries, software subscriptions,
      insurance, debt service.
    </DefinitionBlock>

    <DefinitionBlock term="Variable costs">
      costs that scale with activity or revenue. Cost of goods,
      payment processing fees, contractor work, shipping, hourly
      labor, sales commissions.
    </DefinitionBlock>

    <H2 id="side-by-side">Side by side</H2>

    <ComparisonTable
      caption="Fixed vs variable cost behavior"
      columns={["Fixed", "Variable"]}
      rows={[
        { label: "Behavior with revenue", cells: ["Stays the same", "Scales up or down"] },
        { label: "Examples", cells: ["Rent, salaries, software, insurance", "Cost of goods, payment fees, contractor work"] },
        { label: "Predictability", cells: ["High - usually known in advance", "Moderate - depends on revenue level"] },
        { label: "Speed to cut", cells: ["Slow - contracts and notice periods", "Fast - scales down with volume"] },
        { label: "Risk", cells: ["High in downturns - bills don't shrink", "Low - self-correct as revenue drops"] },
      ]}
    />

    <H2 id="semi-variable">Semi-variable costs</H2>

    <p>
      The messy middle: costs that have a fixed base plus a
      variable component. Common examples:
    </p>

    <ul>
      <li>
        <strong>Utilities</strong> - base service fee + usage
      </li>
      <li>
        <strong>Tiered software</strong> - base plan + per-seat
        or per-feature
      </li>
      <li>
        <strong>Phone / internet</strong> - base plan + overages
      </li>
      <li>
        <strong>Some payroll</strong> - base salary + overtime or
        bonuses
      </li>
    </ul>

    <p>
      For forecasting, decompose them into their fixed and
      variable components and treat each piece accordingly.
    </p>

    <H2 id="why-it-matters">Why the distinction matters</H2>

    <p>
      Three places the fixed vs variable distinction drives
      meaningful decisions:
    </p>

    <H3>Operating leverage</H3>

    <p>
      A business with a high proportion of fixed costs has high
      operating leverage - small revenue changes produce big profit
      changes. The math: once fixed costs are covered, additional
      revenue is mostly profit (until variable costs scale up).
      Going up, this is great. Going down, it&apos;s painful.
    </p>

    <H3>Break-even analysis</H3>

    <p>
      The revenue level at which the business covers its fixed
      costs: Break-even revenue = Fixed costs ÷ Contribution margin.
      Knowing your break-even tells you exactly how much you can
      afford to lose before things get serious.
    </p>

    <H3>Downturn response</H3>

    <p>
      Variable costs self-correct in downturns - cost of goods
      drops when sales drop. Fixed costs don&apos;t. A downturn
      response that cuts only variable costs leaves the fixed
      base untouched - which is usually where the gap is.
    </p>

    <Callout variant="info" title="The most common mistake">
      Owners often treat &quot;fixed&quot; as &quot;unchangeable.&quot;
      It isn&apos;t. Most fixed costs are negotiable - just on a
      slower timeline. Renegotiating rent, downsizing the office,
      restructuring salary, switching software vendors all reduce
      fixed costs over 3-12 months.
    </Callout>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Treating headcount as variable</H3>

    <p>
      Hiring and firing have real friction, cost, and time. Treat
      salaried roles as fixed costs that move quarterly at best.
    </p>

    <H3>2. Mislabeling payment processing</H3>

    <p>
      Payment processing scales with revenue - it&apos;s variable.
      Often gets miscategorized as overhead, making gross margin
      look better than it is.
    </p>

    <H3>3. Cutting only variable in downturns</H3>

    <p>
      Variable costs self-correct. Fixed costs don&apos;t. A
      downturn response that ignores fixed costs leaves the
      structural problem unaddressed.
    </p>

    <H3>4. Forgetting hidden fixed costs</H3>

    <p>
      Software subscriptions, insurance, equipment depreciation,
      and accounting fees often sit unexamined. Audit annually.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/expense-management/business-expense-categories-explained">
          Business Expense Categories Explained
        </ArticleLink>{" "}
        - the standard categorization on top of fixed vs variable.
      </li>
      <li>
        <ArticleLink href="/resources/financial-fundamentals/gross-profit-explained">
          Gross Profit Explained
        </ArticleLink>{" "}
        - gross profit math depends on variable cost identification.
      </li>
      <li>
        <ArticleLink href="/resources/business-forecasting/expense-forecasting">
          Expense Forecasting
        </ArticleLink>{" "}
        - fixed and variable get forecast differently.
      </li>
      <li>
        <ArticleLink href="/resources/expense-management/cost-optimization-strategies">
          Cost Optimization Strategies
        </ArticleLink>{" "}
        - cutting fixed and variable each have different playbooks.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - cost structure determines what growth rates are sustainable.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Fixed costs stay the same regardless of activity. Variable costs scale with it.",
      "Semi-variable costs have both - decompose for forecasting.",
      "High fixed cost businesses have high operating leverage - amplified on both upside and downside.",
      "Break-even = fixed costs ÷ contribution margin. Know yours.",
      "In downturns, variable costs self-correct; fixed costs don't. Address both.",
      "\"Fixed\" doesn't mean \"unchangeable\" - just slower to change.",
    ]} />
  </>
);
