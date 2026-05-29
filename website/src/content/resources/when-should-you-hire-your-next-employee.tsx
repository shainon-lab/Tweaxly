import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "when-should-you-hire-your-next-employee",
  title: "When Should You Hire Your Next Employee?",
  excerpt:
    "The hiring decision is one of the highest-stakes choices in small business. Here's a framework for knowing when the math works and when it doesn't.",
  category: "business-growth",
  tags: ["Hiring", "Growth", "Team Building"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 6,
  tldr: [
    "Hire when the cost of NOT hiring (lost revenue, burnout, work falling through cracks) exceeds the loaded cost of the hire for at least 6-12 months.",
    "Loaded cost is 25-40% above gross salary - employer taxes, benefits, equipment, software.",
    "Hire ahead of revenue only if you have 6+ months of cash to fund the ramp-up.",
    "First hires usually pay back in 6-12 months. Specialized hires in 9-18 months. Senior hires in 12-24 months.",
    "The wrong hire is more expensive than no hire - factor recruitment cost, ramp-up time, severance risk, and team disruption.",
  ],
  faq: [
    { q: "What's a loaded cost of an employee?", a: "Gross salary plus employer taxes, benefits, software, equipment, and overhead allocated to the role. Typically 25-40% above the gross salary. A $80K salary often equals $100K-110K of total cost." },
    { q: "When is it cheaper to hire a contractor?", a: "For non-recurring or specialized work where you don't need 40 hours a week. Contractors have higher per-hour costs but no benefits, lower commitment, and easier scaling." },
    { q: "What's the right time to make a first hire?", a: "When you're personally bottlenecked on work that someone less expensive than you could do. Usually when the founder is regularly working 60+ hours and turning down growth opportunities." },
    { q: "How do I know if a hire will pay back?", a: "Estimate the revenue the role enables (sales, support capacity, throughput) over 12-24 months. Compare to the loaded cost over the same period. If revenue meaningfully exceeds cost, the hire pays back." },
    { q: "What if I can't afford to hire but need to?", a: "Three options: part-time or contractor work, hire below market with growth potential, raise capital to fund the hire. Never hire full-time without 6+ months of cash to support the ramp." },
    { q: "When should I hire ahead of revenue vs after?", a: "Ahead of revenue: when you have cash cushion AND the role enables revenue that's expected within 6-12 months. After revenue: when you don't have cash cushion or the revenue impact is uncertain." },
  ],
  seo: {
    title: "When Should You Hire Your Next Employee? | Tweaxly",
    description:
      "A practical framework for knowing when a new hire pays back, including loaded cost calculation and pay-back analysis.",
    keywords: [
      "when to hire next employee",
      "hiring decision",
      "loaded cost employee",
      "should I hire",
      "small business hiring",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Hiring is one of the highest-stakes decisions in small
      business. The right hire compounds returns for years; the
      wrong one costs 6-12 months of salary, ramp-up time, and
      team disruption. The framework below is the math; the
      judgment is yours.
    </Lead>

    <H2 id="loaded-cost">First, know the real cost</H2>

    <p>
      Owners often think about hiring at gross salary. The real
      number is loaded cost - everything required to actually put
      someone in the role:
    </p>

    <ul>
      <li>
        <strong>Gross salary</strong> - the headline number
      </li>
      <li>
        <strong>Employer taxes</strong> - typically 7.65% for FICA
        plus state unemployment, often 8-12% total
      </li>
      <li>
        <strong>Benefits</strong> - health insurance, retirement
        contributions, paid time off accrual; often $5-15K
        per employee per year
      </li>
      <li>
        <strong>Software & tools</strong> - per-seat licenses,
        productivity software, project tools; $1-5K annually
      </li>
      <li>
        <strong>Equipment</strong> - laptop, monitor, headset;
        $2-5K up front, refreshed every 3-4 years
      </li>
      <li>
        <strong>Office or remote support</strong> - if applicable
      </li>
      <li>
        <strong>Recruitment cost</strong> - amortized over expected
        tenure; $5-25K depending on level
      </li>
    </ul>

    <p>
      Total loaded cost is typically 25-40% above gross salary.
      An $80K hire is often a $100-110K total commitment.
    </p>

    <H2 id="when-to-hire">The hiring framework</H2>

    <p>
      Three questions to answer before hiring:
    </p>

    <H3>1. What does this hire enable?</H3>

    <p>
      Specifically, what work would they do that you currently
      can&apos;t, or what work would they free you (or others) to
      do? Be honest:
    </p>

    <ul>
      <li>
        Revenue-generating: sales calls, deal closing, customer
        success
      </li>
      <li>
        Capacity-expanding: delivery, support, fulfillment
      </li>
      <li>
        Founder-freeing: work that lets the founder spend time
        on higher-leverage activities
      </li>
      <li>
        Specialization: skills the team doesn&apos;t have
      </li>
    </ul>

    <H3>2. What&apos;s the cost of NOT hiring?</H3>

    <p>
      Make this concrete:
    </p>

    <ul>
      <li>Revenue you&apos;re currently turning down or losing</li>
      <li>Work falling through the cracks</li>
      <li>Quality issues from overwork</li>
      <li>Burnout risk on founders or team</li>
      <li>Slower growth or missed opportunities</li>
    </ul>

    <H3>3. Does the hire pay back?</H3>

    <p>
      Pay-back analysis: estimate the revenue or savings the role
      enables over 12-24 months. Compare to loaded cost over the
      same period.
    </p>

    <ul>
      <li>
        Revenue-generating roles (sales, customer success): aim
        for pay-back in 6-12 months
      </li>
      <li>
        Specialized roles (engineering, design): aim for
        pay-back in 9-18 months
      </li>
      <li>
        Senior roles (VP, head of): pay-back in 12-24 months;
        value is leverage on the whole team
      </li>
    </ul>

    <H2 id="cash-check">The cash check</H2>

    <p>
      Even if the math works, the cash needs to be there. Before
      hiring full-time:
    </p>

    <ul>
      <li>
        Do you have 6+ months of cash to fund the ramp-up?
      </li>
      <li>
        If revenue impact is delayed, can you survive the gap?
      </li>
      <li>
        Does your cash flow forecast accommodate the hire without
        breaching reserves?
      </li>
    </ul>

    <p>
      A great hire that runs you out of cash is still a bad
      hire. See{" "}
      <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
        Cash Flow Forecasting
      </ArticleLink>{" "}
      and{" "}
      <ArticleLink href="/resources/cash-flow-management/how-much-cash-reserve">
        How Much Cash Reserve Should a Business Have
      </ArticleLink>.
    </p>

    <Callout variant="info" title="The contractor alternative">
      When the math is tight, consider a contractor or part-time
      hire first. Higher per-hour cost, but no commitment,
      easier to scale, and you learn whether the role pays back
      before committing to a full-time hire.
    </Callout>

    <H2 id="when-not-to-hire">When not to hire</H2>

    <p>
      Common situations where the answer is &quot;not yet&quot;:
    </p>

    <ul>
      <li>
        <strong>Cash reserve below 3 months.</strong> Build cushion
        first.
      </li>
      <li>
        <strong>Unit economics deteriorating.</strong> Fix the
        underlying problem before adding cost.
      </li>
      <li>
        <strong>Revenue declining.</strong> Hiring into a
        downturn rarely works.
      </li>
      <li>
        <strong>Founder can&apos;t articulate the role.</strong>{" "}
        If you can&apos;t describe what they&apos;ll do, you&apos;ll
        hire wrong.
      </li>
    </ul>

    <H2 id="common-mistakes">Common hiring mistakes</H2>

    <H3>1. Underestimating loaded cost</H3>

    <p>
      Thinking about hiring at gross salary makes every hire
      look 25-40% more affordable than it is.
    </p>

    <H3>2. Hiring before product-market fit</H3>

    <p>
      Hiring into uncertainty multiplies the cost of being
      wrong. Find the model first; scale after.
    </p>

    <H3>3. Hiring senior too early</H3>

    <p>
      A senior hire costs 2-3x a junior one and brings more
      expectations. Many small businesses are better off with
      junior + smart founder than senior + distracted founder.
    </p>

    <H3>4. Not setting clear success criteria</H3>

    <p>
      Without clear success criteria, you can&apos;t evaluate
      whether the hire worked. Define what 6 months and 12 months
      of success look like before you hire.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-growth/growth-vs-profitability">
          Growth vs Profitability
        </ArticleLink>{" "}
        - hiring is the primary growth investment.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - hiring rate is constrained by sustainable growth.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/common-growth-bottlenecks">
          Common Growth Bottlenecks
        </ArticleLink>{" "}
        - hiring is often the bottleneck and the relief.
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>{" "}
        - how to model the hire&apos;s cash impact.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/delegation-frameworks-for-business-owners">
          Delegation Frameworks for Business Owners
        </ArticleLink>{" "}
        - what to do with the new capacity once you have it.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Loaded cost is 25-40% above gross salary. Use it for decisions, not the headline number.",
      "Hire when cost of NOT hiring exceeds loaded cost over 6-12 months.",
      "Always check cash. 6+ months of cushion to fund ramp-up.",
      "Pay-back targets: revenue roles 6-12 months, specialized 9-18, senior 12-24.",
      "Consider contractor or part-time first when the math is tight.",
      "Don't hire without clear 6-month and 12-month success criteria.",
    ]} />
  </>
);
