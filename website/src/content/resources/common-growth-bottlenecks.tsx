import {
  Lead, H2, H3, Callout, ArticleLink,
  KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "common-growth-bottlenecks",
  title: "Common Growth Bottlenecks (and How to Diagnose Them)",
  excerpt:
    "Most small businesses are bottlenecked on one of five things. Recognizing which one is yours is more useful than generic growth advice.",
  category: "business-growth",
  tags: ["Growth Bottlenecks", "Scaling", "Strategy"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "Most small businesses are bottlenecked on one of five things: founder time, sales process, fulfillment capacity, hiring pipeline, or customer concentration.",
    "Bottlenecks are often invisible because they look like normal operations - until you try to remove one and discover you can.",
    "Diagnose by asking: if I could double one capacity tomorrow, what would I pick? That's your bottleneck.",
    "Fix the bottleneck before throwing money at growth investments. Growth without bottleneck relief just makes the bottleneck more painful.",
    "Bottlenecks move as you grow - the constraint that limits you at $500K isn't the same as the one at $5M.",
  ],
  faq: [
    { q: "How do I know what my bottleneck is?", a: "Ask: if I could double one capacity tomorrow (more sales hours, more delivery, more leads, more leadership time), which would produce the biggest revenue jump? That's your bottleneck." },
    { q: "What's the most common growth bottleneck?", a: "Founder time. The founder is doing too many things, several of which are below their highest-leverage activity. Until the founder is freed up, the business can't scale past the founder's bandwidth." },
    { q: "Can a business have multiple bottlenecks?", a: "Yes - but usually one dominates. Fix that one, and the next one becomes the constraint. The discipline is sequential, not parallel." },
    { q: "Do bottlenecks change as the business grows?", a: "Always. Early-stage bottleneck is usually demand or product-market fit. Mid-stage is usually hiring or processes. Late-stage is usually leadership or strategic capacity." },
    { q: "What's the cost of ignoring a bottleneck?", a: "Investments elsewhere don't produce returns. Spending on marketing when fulfillment is the bottleneck just produces unhappy customers. Diagnose first." },
    { q: "How long does it take to clear a bottleneck?", a: "Hiring bottlenecks: 3-6 months. Process bottlenecks: 6-12 months. Founder-time bottlenecks: 6-18 months (requires delegation maturity). Strategic bottlenecks: years." },
  ],
  seo: {
    title: "Common Growth Bottlenecks | Tweaxly",
    description:
      "Most small businesses are bottlenecked on one of five things. A plain-English guide to diagnosing yours and the right sequence of fixes.",
    keywords: [
      "growth bottlenecks",
      "business bottleneck",
      "scaling problems",
      "small business growth limits",
      "founder bottleneck",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Most growth advice fails because it&apos;s generic. The
      actions you need depend entirely on which bottleneck is
      stopping you. Spending on marketing won&apos;t help if
      fulfillment is the constraint; hiring sales won&apos;t help
      if founder time is the constraint. Diagnose first, act
      second.
    </Lead>

    <H2 id="five-bottlenecks">Five common bottlenecks</H2>

    <H3>1. Founder time</H3>

    <p>
      The most common bottleneck in small business. The founder
      is doing too many things - sales, delivery, finance,
      hiring, product, support - and several of those things
      should be delegated. The business can&apos;t grow past
      the founder&apos;s bandwidth.
    </p>

    <p>
      Symptoms: founder working 60+ hours, founder personally
      involved in every customer interaction, founder is the
      bottleneck on every important decision.
    </p>

    <p>
      The fix: delegation, but real delegation - with clear
      criteria for what &quot;done well&quot; looks like. See{" "}
      <ArticleLink href="/resources/small-business-operations/delegation-frameworks-for-business-owners">
        Delegation Frameworks for Business Owners
      </ArticleLink>.
    </p>

    <H3>2. Sales process maturity</H3>

    <p>
      The business closes deals through founder relationships
      and ad-hoc effort, not through a repeatable sales process.
      Each new customer is a custom situation.
    </p>

    <p>
      Symptoms: long sales cycles with no predictable pattern,
      every deal needs founder involvement, win rates are
      unpredictable, can&apos;t hand off sales to anyone.
    </p>

    <p>
      The fix: documented sales playbook, defined pipeline
      stages, predictable hand-offs.
    </p>

    <H3>3. Fulfillment capacity</H3>

    <p>
      The business can&apos;t deliver more revenue without
      breaking quality. Service businesses, agencies, and
      product companies hit this regularly.
    </p>

    <p>
      Symptoms: long delivery times, quality complaints,
      employee burnout, customer churn from poor experience.
    </p>

    <p>
      The fix: process optimization, hiring delivery capacity,
      or scoping smaller engagements.
    </p>

    <H3>4. Hiring pipeline</H3>

    <p>
      The business needs to grow the team but can&apos;t hire
      fast enough. Open roles stay open for months.
    </p>

    <p>
      Symptoms: vacancy rate climbing, existing team overworked,
      growth opportunities turned down for lack of capacity.
    </p>

    <p>
      The fix: dedicated recruiting (often founder or outside
      partner), competitive compensation, clearer roles.
    </p>

    <H3>5. Customer concentration</H3>

    <p>
      A few customers represent most of the revenue. Growth
      requires diversifying acquisition - which is harder than
      it sounds when your business has been optimized for the
      existing customers.
    </p>

    <p>
      Symptoms: top customer is 25%+ of revenue, retention
      becomes existentially important, marketing has atrophied
      because it wasn&apos;t needed.
    </p>

    <p>
      The fix: deliberate acquisition investment, new channels,
      productization of services so they can scale beyond
      relationships.
    </p>

    <H2 id="diagnose">How to diagnose your bottleneck</H2>

    <p>
      One question: if you could double one capacity tomorrow,
      which would produce the biggest revenue jump?
    </p>

    <ul>
      <li>
        Double founder hours → founder time is the bottleneck
      </li>
      <li>
        Double sales pipeline → sales process is the bottleneck
      </li>
      <li>
        Double delivery capacity → fulfillment is the bottleneck
      </li>
      <li>
        Fill open roles → hiring is the bottleneck
      </li>
      <li>
        Double new customer acquisition → customer concentration
        or marketing is the bottleneck
      </li>
    </ul>

    <p>
      The answer is rarely all five. Pick the one that would
      move the needle most and focus there.
    </p>

    <Callout variant="info" title="The sequencing rule">
      Bottlenecks come in sequence. Fix the binding one and
      the next one becomes the constraint. Trying to fix all
      at once spreads effort thin and produces no movement on
      any.
    </Callout>

    <H2 id="bottlenecks-change">Bottlenecks change with stage</H2>

    <ul>
      <li>
        <strong>Pre-product-market-fit:</strong> demand and
        product
      </li>
      <li>
        <strong>Early traction ($100K-1M):</strong> founder time,
        repeatable sales
      </li>
      <li>
        <strong>Growth stage ($1-10M):</strong> hiring, processes,
        delivery capacity
      </li>
      <li>
        <strong>Scale ($10M+):</strong> leadership capacity,
        strategic clarity, organizational design
      </li>
    </ul>

    <p>
      Recognizing your stage helps you predict which bottleneck
      is coming next.
    </p>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Throwing money at the wrong bottleneck</H3>

    <p>
      Spending on marketing when fulfillment is the constraint
      just produces customer dissatisfaction.
    </p>

    <H3>2. Treating all bottlenecks as equal</H3>

    <p>
      One bottleneck dominates. Fix that one; the others can
      wait.
    </p>

    <H3>3. Avoiding the founder bottleneck</H3>

    <p>
      Owners often don&apos;t want to delegate because it feels
      like losing control. The business can&apos;t scale past
      the founder until they do.
    </p>

    <H3>4. Solving with cash instead of skill</H3>

    <p>
      Hiring a senior person to &quot;solve&quot; the bottleneck
      without doing the underlying work (process documentation,
      role clarity, clear success criteria) just adds an
      expensive person to a broken system.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-growth/how-to-scale-a-small-business">
          How to Scale a Small Business
        </ArticleLink>{" "}
        - the broader scaling playbook.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/sustainable-growth-explained">
          Sustainable Growth Explained
        </ArticleLink>{" "}
        - bottlenecks define what&apos;s sustainable.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/when-should-you-hire-your-next-employee">
          When Should You Hire Your Next Employee
        </ArticleLink>{" "}
        - often the answer to a bottleneck.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/delegation-frameworks-for-business-owners">
          Delegation Frameworks for Business Owners
        </ArticleLink>{" "}
        - the cure for the founder-time bottleneck.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/business-processes-explained">
          Business Processes Explained
        </ArticleLink>{" "}
        - the fix for fulfillment bottlenecks.
      </li>
    </ul>

    <KeyTakeaways items={[
      "Five common bottlenecks: founder time, sales process, fulfillment, hiring, customer concentration.",
      "Diagnose by asking: if I could double one capacity tomorrow, which gives the biggest revenue jump?",
      "Fix one at a time. Bottlenecks sequence; trying to fix all spreads effort thin.",
      "Bottlenecks change with stage. The constraint at $500K isn't the constraint at $5M.",
      "Throwing money at the wrong bottleneck wastes it. Diagnose first.",
      "The founder bottleneck is the most common and most avoided.",
    ]} />
  </>
);
