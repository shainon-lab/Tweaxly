import {
  Lead, H2, H3, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "what-is-business-intelligence",
  title: "What Is Business Intelligence?",
  excerpt:
    "Business intelligence is the practice of turning the data your business already generates into decisions you can act on. Plain-English explanation, no enterprise jargon.",
  category: "business-intelligence",
  tags: ["Business Intelligence", "Data", "Decision Making"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 5,
  tldr: [
    "Business intelligence (BI) is the practice of using the data your business already collects to answer questions that drive better decisions.",
    "Three layers: collect data, transform it into something readable, surface it where decisions happen.",
    "For small businesses, BI usually means spreadsheets, accounting software reports, and a clear weekly review habit - not enterprise platforms.",
    "Good BI answers specific questions; bad BI produces dashboard wallpaper nobody opens twice.",
    "Start with 3-5 questions you want answered. Build the BI to answer those, not to display every available metric.",
  ],
  faq: [
    { q: "What's business intelligence in one sentence?", a: "Using the data your business already collects (sales, expenses, customers) to answer specific questions and make better decisions." },
    { q: "Do I need expensive software for BI?", a: "Usually no. For small businesses, spreadsheets, your accounting software's built-in reports, and a disciplined weekly review cover most needs. Dedicated tools earn their cost when you're combining data from multiple systems." },
    { q: "What's the difference between data and intelligence?", a: "Data is raw numbers. Intelligence is data that's been organized, contextualized, and surfaced to support a decision. Most businesses have plenty of data and very little intelligence." },
    { q: "What questions should BI answer?", a: "Start with 3-5 questions you actually want answered: Are we growing the right customers? Where are margins dropping? Which marketing channel pays back? Build BI to answer those - not to display every metric." },
    { q: "What's a dashboard?", a: "A single view that displays the key metrics you watch regularly. Good dashboards show 5-10 numbers; bad ones show 50 and nobody reads them." },
    { q: "How is BI different from analytics?", a: "Largely interchangeable in casual use. Strictly: analytics is the deeper analysis (why is churn up?); BI is the surfacing of metrics (churn is X% this month). Both useful; different scope." },
  ],
  seo: {
    title: "What Is Business Intelligence? | Tweaxly",
    description:
      "Business intelligence is the practice of using your business data to make better decisions. A plain-English explanation, no enterprise jargon.",
    keywords: [
      "what is business intelligence",
      "business intelligence",
      "BI",
      "data analytics",
      "business analytics",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      Business intelligence has a fancy name and a long history of
      enterprise software. For small businesses, the concept is
      simpler than the marketing suggests: take the data you
      already have, organize it so people can use it, and surface
      it where decisions get made. The discipline matters more
      than the platform.
    </Lead>

    <DefinitionBlock term="Business Intelligence (BI)">
      the practice of collecting, organizing, and surfacing
      business data in ways that support better decisions. Less
      about technology than about discipline - what questions
      get asked, what data is trusted, what changes get
      noticed.
    </DefinitionBlock>

    <H2 id="three-layers">Three layers</H2>

    <H3>1. Collect</H3>

    <p>
      The data you already generate - sales transactions, expense
      records, customer logs, payroll, vendor invoices. Most
      small businesses have more data than they look at.
    </p>

    <H3>2. Transform</H3>

    <p>
      Raw data isn&apos;t useful. Transformation means cleaning,
      aggregating, joining, and structuring data into formats
      that answer questions. Spreadsheets, reports, charts.
    </p>

    <H3>3. Surface</H3>

    <p>
      The transformed data needs to be where decisions happen.
      Dashboards on the office wall, weekly review meetings,
      automated reports in email. The mechanics matter less than
      the habit.
    </p>

    <H2 id="small-business-bi">What BI looks like for small businesses</H2>

    <p>
      Forget enterprise tools. For most small businesses, BI is:
    </p>

    <ul>
      <li>
        <strong>A weekly metrics review</strong> - same numbers,
        same time, same order
      </li>
      <li>
        <strong>A monthly close + dashboard</strong> - revenue,
        margin, expenses, cash
      </li>
      <li>
        <strong>A few key spreadsheets</strong> - customer
        cohorts, channel performance, sales pipeline
      </li>
      <li>
        <strong>Accounting software reports</strong> - P&L,
        balance sheet, cash flow
      </li>
      <li>
        <strong>Variance analysis</strong> - actuals vs forecast
        each month
      </li>
    </ul>

    <p>
      That stack costs little and works well for businesses up
      to ~$10M revenue. Dedicated BI tools earn their cost when
      you&apos;re combining data from 3+ systems regularly or
      when teams beyond the founder need self-serve access.
    </p>

    <H2 id="questions-first">Start with questions, not tools</H2>

    <p>
      The most common BI mistake is buying a tool and trying to
      figure out what to display. Reverse it: start with the
      questions you want answered.
    </p>

    <p>
      Useful starter questions:
    </p>

    <ul>
      <li>Are we growing the right customers?</li>
      <li>Where are margins dropping?</li>
      <li>Which marketing channel actually pays back?</li>
      <li>What&apos;s the trend in customer engagement?</li>
      <li>What expenses are growing faster than revenue?</li>
    </ul>

    <p>
      Build BI to answer those questions. Anything beyond is
      decoration.
    </p>

    <H2 id="leading-vs-lagging">Mix leading and lagging</H2>

    <p>
      Good BI mixes lagging indicators (what already happened -
      revenue, profit) with leading indicators (what&apos;s
      coming - pipeline, signups). Lagging confirms; leading
      warns. See{" "}
      <ArticleLink href="/resources/business-intelligence/leading-vs-lagging-indicators">
        Leading vs Lagging Indicators
      </ArticleLink>.
    </p>

    <H2 id="common-mistakes">Common BI mistakes</H2>

    <H3>1. Dashboard wallpaper</H3>

    <p>
      A 30-metric dashboard isn&apos;t a dashboard - it&apos;s a
      list. Pick 5-10 metrics that drive decisions.
    </p>

    <H3>2. Building tools before discipline</H3>

    <p>
      A beautiful dashboard nobody opens isn&apos;t useful.
      Discipline (regular review, action on signals) matters
      more than the tooling.
    </p>

    <H3>3. Analysis paralysis</H3>

    <p>
      Some owners use data to delay decisions instead of make
      them. Data narrows the range of reasonable decisions;
      judgment picks between them.
    </p>

    <H3>4. Trusting unverified data</H3>

    <p>
      Garbage in, garbage out. A monthly close that includes
      bookkeeping errors produces confidently wrong BI.
    </p>

    <H2 id="related">Related concepts</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-intelligence/business-dashboards-explained">
          Business Dashboards Explained
        </ArticleLink>{" "}
        - the practical surfacing layer.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/leading-vs-lagging-indicators">
          Leading vs Lagging Indicators
        </ArticleLink>{" "}
        - the distinction that powers useful BI.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/spreadsheets-not-enough">
          Why Spreadsheets Are No Longer Enough for Financial Planning
        </ArticleLink>{" "}
        - when small business BI outgrows the spreadsheet.
      </li>
      <li>
        <ArticleLink href="/resources/business-metrics-kpis/mom-vs-yoy-growth">
          Month-over-Month vs Year-over-Year Growth
        </ArticleLink>{" "}
        - the standard time comparisons.
      </li>
      <li>
        <ArticleLink href="/resources/business-intelligence/what-is-ai-financial-advisor">
          What Is an AI Financial Advisor for Businesses?
        </ArticleLink>{" "}
        - the AI-powered BI evolution.
      </li>
    </ul>

    <KeyTakeaways items={[
      "BI = collecting data, transforming it, surfacing it for decisions.",
      "For most small businesses: spreadsheets + accounting reports + weekly review covers it.",
      "Start with 3-5 questions you want answered. Build BI to answer those.",
      "Mix leading (predictive) and lagging (historical) indicators.",
      "Discipline (regular review, action) matters more than tooling.",
      "Beautiful dashboards nobody opens aren't BI - they're decoration.",
    ]} />
  </>
);
