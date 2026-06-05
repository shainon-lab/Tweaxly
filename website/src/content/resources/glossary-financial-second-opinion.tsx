import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "financial-second-opinion",
  title: "Financial Second Opinion",
  excerpt:
    "Financial Second Opinion: an independent, plain-English read of the financial report your accountant prepared - aimed at helping the owner understand it.",
  category: "business-glossary",
  tags: ["Financial Second Opinion", "Financial Review", "Financial Reports", "CPA"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-06-05",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Definition: an independent read of financial statements aimed at the owner, not the accountant.",
    "Goal: understand what the numbers mean and what to ask next.",
    "It flags unusual changes, outliers, new categories and classifications worth discussing.",
    "Hard limits: never claims the accountant is wrong, never gives tax or legal advice.",
    "Best output: a short list of personalized questions for your next CPA meeting.",
  ],
  faq: [
    { q: "What is a financial second opinion?", a: "An independent, plain-English read of the financial statements your accountant prepared, aimed squarely at the owner. It explains what changed, what it means for the business, and what deserves a closer look - without questioning whether the accounting is correct." },
    { q: "Is a second opinion saying my accountant made a mistake?", a: "No. A responsible second opinion never claims your accountant is wrong and never gives tax or legal advice. It surfaces items worth discussing - unusual changes, large one-off items, classifications - and frames each as a question for your CPA." },
    { q: "What does a financial second opinion look for?", a: "Unusual changes (a cost rising far faster than revenue), outliers (a sharp jump or drop), categories that appeared for the first time this year, and classifications worth a conversation. Each is framed as a discussion point, not a correction." },
    { q: "What is the most useful output of a second opinion?", a: "A short, personalized list of questions built from your actual numbers - five to fifteen of them - to take into your next accountant meeting. You walk in with an agenda instead of a blank page." },
    { q: "Does a second opinion replace my accountant?", a: "No. It is decision-support that helps you understand your reports and prepare better questions. Your accountant prepares the statements, handles tax and compliance, and gives professional advice. The two work together." },
  ],
  seo: {
    title: "Financial Second Opinion - Definition | Tweaxly Business Glossary",
    description: "A Financial Second Opinion is an independent, plain-English read of your accountant's report, aimed at the owner. Plain English with its hard limits.",
    keywords: ["financial second opinion", "second opinion financial report", "independent financial review", "questions to ask your accountant", "review financial statements"],
  },
};

export const Body = () => (
  <>
    <Lead>
      Not an audit of your accountant - a translation for you. A second
      opinion takes a correct report and explains what it means for the
      business, what changed, and what is worth raising in your next
      meeting.
    </Lead>

    <DefinitionBlock term="Financial Second Opinion">
      an independent, plain-English read of the financial statements an
      accountant prepared, aimed at helping the business owner understand
      the numbers and decide what to ask about - never at re-checking the
      accounting.
    </DefinitionBlock>

    <H2 id="common-use">What it looks for</H2>
    <ul>
      <li><strong>Unusual changes</strong> - a cost growing far faster than revenue</li>
      <li><strong>Outliers</strong> - a sharp increase or decrease worth explaining</li>
      <li><strong>New categories</strong> - an expense line that appeared this year</li>
      <li><strong>Classification</strong> - an item whose treatment is worth a conversation</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      A responsible second opinion has hard limits: it must never claim your
      accountant is wrong, never give tax advice, and never give legal
      advice. Its only job is to flag what deserves review and hand you the
      question to ask. It pairs naturally with a{" "}
      <ArticleLink href="/resources/business-glossary/business-health-score">business health score</ArticleLink>{" "}
      for the headline and the detail together.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/business-health-score">Business Health Score</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/profit-and-loss-statement">Profit and Loss Statement</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/balance-sheet">Balance Sheet</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/cash-flow-statement">Cash Flow Statement</ArticleLink></li>
    </ul>

    <p>
      Read the full method in{" "}
      <ArticleLink href="/resources/business-intelligence/ai-second-opinion-financial-reports">How to Get a Second Opinion on Your Financial Reports</ArticleLink>, see the{" "}
      <ArticleLink href="/features/financial-review">Financial Review feature</ArticleLink>, and browse{" "}
      <ArticleLink href="/resources/business-intelligence">Business Intelligence &amp; Analytics</ArticleLink>.
    </p>

    <KeyTakeaways items={[
      "An independent read for the owner, not a check on the accountant.",
      "Flags unusual changes, outliers, new categories, classifications.",
      "Never claims the accountant is wrong; never gives tax or legal advice.",
      "Best output: personalized questions for your next CPA meeting.",
    ]} />
  </>
);
