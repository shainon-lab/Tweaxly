import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "delegation-frameworks-for-business-owners",
  title: "Delegation Frameworks for Business Owners",
  excerpt:
    "Delegation is the single most important skill for owners trying to scale. Here's how to do it well, and how to know when you're doing it badly.",
  category: "small-business-operations",
  tags: ["Delegation", "Leadership", "Management"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "Delegate the outcome, not the steps. Owners who delegate steps end up busier than before.",
    "Show what \"done well\" looks like with examples. Without that, delegates guess at quality.",
    "Set check-in cadence, not check-in approval. Reviewing every step defeats delegation.",
    "Resist taking work back when it isn't done your way. Different ≠ worse.",
    "Delegation maturity: I do it → I do it together with them → They do it; I review → They do it; I trust.",
  ],
  faq: [
    { q: "What's the single biggest delegation mistake?", a: "Delegating the steps instead of the outcome. The delegate ends up doing exactly what you'd do - which means you still have to think through every decision. Real delegation means handing off the thinking, not just the doing." },
    { q: "How do I know if I'm delegating well?", a: "Two signs. First, the delegate makes decisions you wouldn't have made, and most of them work. Second, the delegate's work doesn't require your time to maintain. If you're checking constantly, you haven't delegated." },
    { q: "What if the delegate does the work differently than I would?", a: "If the outcome is good, the difference doesn't matter. The whole point of delegation is that they bring their own judgment. Different is fine; worse is the line." },
    { q: "How should I check in on delegated work?", a: "On a cadence (weekly review, monthly metric), not on every step. Approvals before action defeat delegation - the person is just executing your decisions." },
    { q: "What if the delegate makes a mistake?", a: "Use it as a learning opportunity unless it's a pattern. One mistake is part of delegation; repeated mistakes mean the delegation wasn't clear enough about success criteria or you delegated to the wrong person." },
    { q: "When should I take work back?", a: "Almost never. Taking work back signals that the delegation was conditional. Better to fix the success criteria, retrain, or assign to someone else than to take it back." },
  ],
  seo: {
    title: "Delegation Frameworks for Business Owners | Tweaxly",
    description:
      "Delegation is the most important skill for owners trying to scale. A plain-English guide to delegating well and recognizing when you're not.",
    keywords: [
      "delegation",
      "how to delegate",
      "delegation framework",
      "founder bottleneck",
      "small business management",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Delegation is the single most important skill for business
      owners trying to grow past their own bandwidth. Get it right
      and the business compounds; get it wrong and you remain the
      bottleneck of everything. Most owners think they delegate.
      Most don&apos;t - they assign work while keeping the
      decisions.
    </Lead>

    <H2 id="four-principles">Four principles</H2>

    <H3>1. Delegate the outcome, not the steps</H3>

    <p>
      The most common delegation mistake. The owner hands over
      the work but keeps the thinking - so every step requires
      the owner&apos;s judgment, decisions, and approval. The
      delegate becomes an executor, not an owner. The founder
      ends up doing more work, not less.
    </p>

    <p>
      Real delegation hands over both:
    </p>

    <ul>
      <li>
        <strong>The outcome</strong> - what success looks like
      </li>
      <li>
        <strong>The decisions</strong> - including the judgment
        calls along the way
      </li>
    </ul>

    <p>
      The delegate brings their own approach. Some of their
      decisions will surprise you. If the outcomes are good,
      the differences don&apos;t matter.
    </p>

    <H3>2. Show what &quot;done well&quot; looks like</H3>

    <p>
      Without examples, delegates guess at quality - and they
      usually guess wrong, often lower than your standard.
      Showing examples of past work that worked anchors them
      to the right bar.
    </p>

    <p>
      Concretely:
    </p>

    <ul>
      <li>
        Share 2-3 past examples of strong output
      </li>
      <li>
        Explain what makes them strong
      </li>
      <li>
        Note the common failure modes you want them to avoid
      </li>
    </ul>

    <H3>3. Set cadence, not approvals</H3>

    <p>
      Approvals before action defeat delegation. The delegate
      is just executing your decisions; nothing has actually
      been handed off.
    </p>

    <p>
      Instead, set a check-in cadence:
    </p>

    <ul>
      <li>Weekly review of work completed</li>
      <li>Monthly review of metrics</li>
      <li>Quarterly review of approach</li>
    </ul>

    <p>
      Between cadence points, the delegate decides and acts. You
      review outcomes, not approve actions.
    </p>

    <H3>4. Don&apos;t take work back</H3>

    <p>
      Taking work back signals the delegation was conditional.
      The delegate learns not to fully own the work; they
      learn to do enough to keep you from taking it back.
    </p>

    <p>
      Better responses when something goes wrong:
    </p>

    <ul>
      <li>
        Fix the success criteria if they were unclear
      </li>
      <li>
        Provide more examples if the bar was unclear
      </li>
      <li>
        Reassign if the person isn&apos;t right for the work
      </li>
      <li>
        Coach if the gap is skill
      </li>
    </ul>

    <p>
      Almost never: take it back.
    </p>

    <H2 id="maturity-model">Delegation maturity model</H2>

    <p>
      A useful progression for any specific responsibility:
    </p>

    <ol>
      <li>
        <strong>I do it</strong> - the founder does the work
        personally
      </li>
      <li>
        <strong>I do it together with them</strong> - the
        delegate learns by working alongside
      </li>
      <li>
        <strong>They do it; I review</strong> - the delegate
        owns it; founder catches errors
      </li>
      <li>
        <strong>They do it; I trust</strong> - the delegate
        owns it; founder only sees outcomes
      </li>
    </ol>

    <p>
      Most delegation gets stuck between steps 3 and 4. The
      founder keeps reviewing because reviewing feels safe.
      Moving to step 4 requires accepting that some mistakes
      will happen on the delegate&apos;s watch - and that&apos;s
      OK.
    </p>

    <Callout variant="info" title="The trust paradox">
      You can&apos;t delegate without trust. You can&apos;t
      build trust without delegating. Start with smaller
      decisions, build evidence of competence, expand the
      scope. Trust grows from successful delegation, not
      from waiting for it.
    </Callout>

    <H2 id="what-to-delegate">What to delegate first</H2>

    <p>
      Useful priorities:
    </p>

    <ul>
      <li>
        <strong>Work the founder is doing because they always
        have</strong>, not because they&apos;re uniquely good at
        it
      </li>
      <li>
        <strong>Work the founder is least skilled at</strong> -
        someone else will do it better
      </li>
      <li>
        <strong>Work that doesn&apos;t require the
        founder&apos;s judgment</strong> - process, execution,
        coordination
      </li>
      <li>
        <strong>Work that&apos;s holding up other work</strong> -
        bottleneck activities
      </li>
    </ul>

    <p>
      Last to delegate: vision, strategy, key relationships,
      decisions with reputational weight.
    </p>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Delegating tasks instead of outcomes</H3>

    <p>
      Already covered. The biggest mistake.
    </p>

    <H3>2. Hiring before delegating clearly</H3>

    <p>
      Bringing in a senior person without clear delegation
      means an expensive person doing what the founder
      vaguely directs.
    </p>

    <H3>3. Taking work back at the first mistake</H3>

    <p>
      Trains the team that delegation is conditional. They
      stop fully owning the work.
    </p>

    <H3>4. Delegating too little, too late</H3>

    <p>
      Most founders delegate later than they should. The pain
      threshold for delegating is much higher than the actual
      threshold should be.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-growth/common-growth-bottlenecks">
          Common Growth Bottlenecks
        </ArticleLink>{" "}
        - founder time is the most common; delegation is the
        cure.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/how-to-scale-a-small-business">
          How to Scale a Small Business
        </ArticleLink>{" "}
        - delegation is phase 2 of scaling.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/business-processes-explained">
          Business Processes Explained
        </ArticleLink>{" "}
        - documented processes enable delegation.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/team-productivity-metrics">
          Team Productivity Metrics
        </ArticleLink>{" "}
        - the outcomes you use to verify delegation worked.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/when-should-you-hire-your-next-employee">
          When Should You Hire Your Next Employee
        </ArticleLink>{" "}
        - hiring is delegation with a salary.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Delegate the outcome, not the steps. Owners who delegate steps end up busier.",
      "Show what \"done well\" looks like with examples. Don't make the delegate guess.",
      "Set cadence (weekly, monthly), not approvals (every step).",
      "Different ≠ worse. If the outcome works, the approach doesn't matter.",
      "Don't take work back. Fix criteria, coach, or reassign instead.",
      "Move through the maturity model: I do → we do → they do, I review → they do, I trust.",
    ]} />
  </>
);
