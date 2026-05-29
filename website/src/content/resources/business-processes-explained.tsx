import {
  Lead, H2, H3, Callout, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "business-processes-explained",
  title: "Business Processes Explained",
  excerpt:
    "A business process is a repeated way of doing something. Writing yours down is what makes them shareable, improvable, and survivable when people change.",
  category: "small-business-operations",
  tags: ["Business Processes", "Documentation", "Operations"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "A business process is a repeated way of doing something - onboarding a customer, processing an invoice, hiring an employee.",
    "Most small businesses run on undocumented processes that live in the founder's head. This works at first; it breaks during growth.",
    "Documentation doesn't need to be elaborate. Bullet points + decision points + handoffs is enough for most processes.",
    "Start with the 3-5 most-repeated processes. Document them, then improve them.",
    "Process documentation pays off the third time you explain something. Build it after the second.",
  ],
  faq: [
    { q: "What's a business process in plain English?", a: "A repeated way of doing a specific thing. Customer onboarding is a process. Invoice processing is a process. Quarterly reporting is a process. Anything you do more than a few times benefits from being documented." },
    { q: "How elaborate should process documentation be?", a: "Most processes need bullet points, decision criteria, and handoffs - not a 20-page manual. The goal is that someone new can follow it and produce the right outcome. If a checklist gets you there, a checklist is enough." },
    { q: "When should I start documenting processes?", a: "When you've explained the same thing twice. Documentation pays off the third time and every time after." },
    { q: "Which processes should I document first?", a: "The 3-5 most-repeated. Usually: customer onboarding, sales process, billing, hiring, monthly reporting. The ones with the most repetition benefit most from documentation." },
    { q: "Who should own process documentation?", a: "The person who runs the process most often. They know how it actually works (vs how it's supposed to work). Founders documenting their own delegated processes is a useful exercise but secondary." },
    { q: "How often should I update process docs?", a: "When the process actually changes. Don't tweak documentation for the sake of polish; update when reality drifts from what's written." },
  ],
  seo: {
    title: "Business Processes Explained | Tweaxly",
    description:
      "A business process is a repeated way of doing something. A plain-English guide to documenting and improving the processes your business runs on.",
    keywords: [
      "business processes",
      "what is a business process",
      "process documentation",
      "operational processes",
      "process improvement",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Every business runs on processes, whether they&apos;re
      documented or not. Most small businesses run on
      undocumented processes that live in the founder&apos;s
      head - which works fine until growth, turnover, or
      complexity makes it impossible. Documentation is the
      cheap fix that almost nobody does early enough.
    </Lead>

    <DefinitionBlock term="Business process">
      a repeated, predictable way of doing a specific thing -
      customer onboarding, invoice processing, sales close,
      monthly close, hiring. Anything that happens more than
      a few times benefits from being explicit.
    </DefinitionBlock>

    <H2 id="why-document">Why documentation matters</H2>

    <p>
      Three reasons documenting processes pays back:
    </p>

    <ul>
      <li>
        <strong>Delegation.</strong> Undocumented processes
        can&apos;t be delegated - the person doing the work
        keeps having to ask. Documented processes can be handed
        off cleanly.
      </li>
      <li>
        <strong>Consistency.</strong> Undocumented processes
        drift - each person does them slightly differently.
        Documented processes produce predictable outcomes.
      </li>
      <li>
        <strong>Improvement.</strong> You can&apos;t improve
        what you can&apos;t see. Documented processes surface
        bottlenecks and waste; undocumented ones hide them.
      </li>
    </ul>

    <H2 id="what-to-document">What process documentation should include</H2>

    <p>
      Most processes need only a few elements:
    </p>

    <ul>
      <li>
        <strong>Trigger</strong> - what kicks the process off
      </li>
      <li>
        <strong>Steps</strong> - what happens, in order
      </li>
      <li>
        <strong>Decision points</strong> - where choices get
        made and what criteria
      </li>
      <li>
        <strong>Handoffs</strong> - when work transfers between
        people or systems
      </li>
      <li>
        <strong>Outcome</strong> - what &quot;done&quot; looks
        like
      </li>
      <li>
        <strong>Exceptions</strong> - what to do when the
        standard path doesn&apos;t apply
      </li>
    </ul>

    <p>
      Bullet points, decision trees, and checklists usually
      cover all of this. Elaborate flowcharts and 20-page
      manuals are usually overkill.
    </p>

    <H2 id="where-to-start">Where to start</H2>

    <p>
      Pick the 3-5 most-repeated processes:
    </p>

    <ol>
      <li>
        <strong>Customer onboarding</strong> - from sale closed
        to first value delivered
      </li>
      <li>
        <strong>Sales process</strong> - from lead to deal
        closed
      </li>
      <li>
        <strong>Billing and collections</strong> - invoicing,
        follow-up, escalation
      </li>
      <li>
        <strong>Hiring</strong> - sourcing through onboarding
      </li>
      <li>
        <strong>Monthly close and reporting</strong> - what
        gets done, by whom, when
      </li>
    </ol>

    <p>
      These five cover most of what a small business does
      repeatedly. Documenting them takes 1-2 days each;
      maintaining them takes minutes per month.
    </p>

    <Callout variant="info" title="The two-explanation rule">
      Document any process you&apos;ve had to explain to
      someone twice. The third time, the documentation should
      answer the question.
    </Callout>

    <H2 id="who-documents">Who should write it</H2>

    <p>
      The person who runs the process most often. They know how
      it actually works (vs how it&apos;s supposed to work).
      Founders documenting their own delegated processes is a
      useful exercise but secondary.
    </p>

    <p>
      A useful pattern: the person who runs the process writes
      the first draft. The person who&apos;ll learn it next
      reviews it - any question they have is a gap in the
      documentation.
    </p>

    <H2 id="improving">Document first, improve second</H2>

    <p>
      Don&apos;t try to improve a process while documenting it.
      Document what actually happens. Then, once it&apos;s on
      paper, look for improvements.
    </p>

    <p>
      Common patterns to look for:
    </p>

    <ul>
      <li>
        Steps that don&apos;t add value (could be removed)
      </li>
      <li>
        Duplicate work across steps
      </li>
      <li>
        Manual work that could be automated
      </li>
      <li>
        Handoffs that lose information
      </li>
      <li>
        Decision points without clear criteria
      </li>
    </ul>

    <H2 id="common-mistakes">Common mistakes</H2>

    <H3>1. Overdesigning the documentation</H3>

    <p>
      A 30-page manual nobody reads is worse than bullet points
      everyone uses. Match the documentation effort to the
      process complexity.
    </p>

    <H3>2. Documenting only the happy path</H3>

    <p>
      Exceptions and edge cases are where most processes break.
      Document them too.
    </p>

    <H3>3. Documenting once and forgetting</H3>

    <p>
      Stale documentation is worse than no documentation -
      people follow it and produce wrong outcomes. Update when
      reality changes.
    </p>

    <H3>4. Treating documentation as bureaucracy</H3>

    <p>
      Documentation isn&apos;t for show; it&apos;s for sharing
      knowledge and improving consistency. Treat it as a tool,
      not a deliverable.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/small-business-operations/operational-efficiency-basics">
          Operational Efficiency Basics
        </ArticleLink>{" "}
        - what to do once processes are documented.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/workflow-optimization">
          Workflow Optimization
        </ArticleLink>{" "}
        - the deeper improvement playbook.
      </li>
      <li>
        <ArticleLink href="/resources/small-business-operations/delegation-frameworks-for-business-owners">
          Delegation Frameworks for Business Owners
        </ArticleLink>{" "}
        - delegation requires documented processes.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/how-to-scale-a-small-business">
          How to Scale a Small Business
        </ArticleLink>{" "}
        - documentation is phase 1 of scaling.
      </li>
      <li>
        <ArticleLink href="/resources/business-growth/common-growth-bottlenecks">
          Common Growth Bottlenecks
        </ArticleLink>{" "}
        - undocumented processes are a common bottleneck.
      </li>
    </ul>

    <KeyTakeaways items={[
      "A business process is a repeated way of doing something. Anything you do more than a few times benefits from documentation.",
      "Documentation enables delegation, consistency, and improvement.",
      "Most processes need only: trigger, steps, decision points, handoffs, outcome, exceptions.",
      "Bullet points and checklists are usually enough. Don't overdesign.",
      "Document what actually happens, not what's supposed to happen. Improve after, not during.",
      "Update when reality changes. Stale documentation is worse than none.",
    ]} />
  </>
);
