import {
  Lead, H2, ArticleLink,
  DefinitionBlock, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "burn-rate",
  title: "Burn Rate",
  excerpt:
    "Burn rate: the rate at which a business is spending cash, usually expressed as a monthly net cash outflow. Critical metric for unprofitable businesses.",
  category: "business-glossary",
  tags: ["Burn Rate", "Cash Management", "Startups"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  tldr: [
    "Definition: The rate at which a business is spending cash, usually quoted as a monthly net amount.",
    "Gross burn = total cash spent per month. Net burn = total cash spent minus cash collected.",
    "Net burn is the more useful number - it's the cash impact on your bank account.",
    "Pairs with runway (cash on hand ÷ net burn = months of operation remaining at current rate).",
    "Most relevant for unprofitable businesses; profitable ones have negative burn (positive cash flow).",
  ],
  faq: [
    { q: "What's burn rate in plain English?", a: "How fast a business is spending cash. Usually quoted as monthly net burn: total cash going out minus total cash coming in, per month." },
    { q: "What's the difference between gross and net burn?", a: "Gross burn = total cash spent per month. Net burn = total cash spent minus cash collected. Net burn is the more useful number because it's what hits the bank account." },
    { q: "Should a business have a burn rate?", a: "Profitable businesses don't have meaningful burn (they generate cash). Burn is most relevant for early-stage businesses investing ahead of profit, or for businesses in a temporary downturn." },
  ],
  seo: {
    title: "Burn Rate - Definition | Tweaxly Business Glossary",
    description:
      "Burn rate is the rate at which a business is spending cash, usually expressed as monthly net cash outflow. Critical for unprofitable businesses.",
    keywords: [
      "burn rate",
      "what is burn rate",
      "monthly burn",
      "net burn",
      "gross burn",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      A metric most relevant for early-stage or unprofitable
      businesses: how fast cash is leaving the bank account.
      Paired with runway, it tells you how long the business
      can operate before needing more cash.
    </Lead>

    <DefinitionBlock term="Burn rate">
      the rate at which a business is spending cash, typically
      quoted as a monthly figure. Gross burn = total cash
      spent. Net burn = total cash spent minus cash collected.
    </DefinitionBlock>

    <H2 id="how-to-calculate">How to calculate it</H2>

    <p>
      <strong>Net burn = Cash spent per month − Cash collected
      per month</strong>
    </p>

    <p>
      For most businesses, net burn is the useful number - it
      tells you the cash impact on your bank account.
    </p>

    <H2 id="common-use">Common uses</H2>

    <ul>
      <li>
        <strong>Runway calculation</strong> - cash ÷ net burn =
        months until cash runs out
      </li>
      <li>
        <strong>Investor conversations</strong> - the standard
        cash measurement for early-stage businesses
      </li>
      <li>
        <strong>Cost discipline</strong> - rising burn signals
        spending is outrunning revenue
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Burn rate is most meaningful for unprofitable or
      growth-stage businesses. Profitable businesses have
      negative burn (positive cash flow); they don&apos;t need
      the metric.
    </p>

    <p>
      Don&apos;t conflate burn with profit loss. A business can
      have positive profit and negative cash flow (high burn)
      because of working capital tied up or capital expenses.
      Cash flow ≠ profit.
    </p>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/runway">
          Runway
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/what-is-cash-flow">
          Cash Flow
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/why-profitable-businesses-run-out-of-cash">
          Why Profitable Businesses Run Out of Cash
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ebitda">
          EBITDA
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "Burn rate = how fast cash is leaving the business per month.",
      "Net burn (out minus in) is more useful than gross burn (just out).",
      "Pairs with runway (cash ÷ burn = months remaining).",
      "Most relevant for unprofitable businesses. Profitable ones generate cash, not burn it.",
    ]} />
  </>
);
