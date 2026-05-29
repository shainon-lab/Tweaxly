import {
  Lead, H2, ArticleLink,
  DefinitionBlock, Formula, KeyTakeaways,
} from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "runway",
  title: "Runway",
  excerpt:
    "Runway: the number of months a business can operate at its current burn rate before running out of cash. Critical metric for cash management.",
  category: "business-glossary",
  tags: ["Runway", "Cash Management", "Startups"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 3,
  kind: "glossary",
  tldr: [
    "Definition: The number of months a business can operate at its current cash burn rate before running out of money.",
    "Formula: Cash on hand ÷ Monthly net burn = Runway in months.",
    "Below 6 months of runway: urgent attention required. Below 3 months: crisis territory.",
    "Most relevant for unprofitable businesses. Profitable businesses have effectively infinite runway as long as they stay profitable.",
    "Don't include uncertain future revenue when calculating runway - use conservative assumptions.",
  ],
  faq: [
    { q: "What's runway in plain English?", a: "How many months your business can keep operating with the cash you have, assuming you keep spending at the current rate." },
    { q: "How is runway calculated?", a: "Cash on hand divided by monthly net burn (cash going out minus cash coming in). $300K cash with $30K monthly burn = 10 months of runway." },
    { q: "How much runway should I have?", a: "12+ months is comfortable. 9-12 months means you should be actively planning. 6-9 months: act now. 3-6 months: urgent. Less than 3 months: crisis territory requiring daily attention." },
    { q: "Should I include expected future revenue in runway?", a: "Only conservatively. Optimistic revenue assumptions stretch runway artificially. Use known committed revenue (signed contracts, recurring subscriptions); leave optimistic forecasts out." },
    { q: "What if my burn rate is increasing?", a: "Runway is shorter than the simple math suggests. Use a rolling forward calculation with expected burn for each month, not just current burn. A business with $300K cash and rising burn might have 6 months effective runway even if current math says 10." },
    { q: "When should I start raising money?", a: "When you don't urgently need it - typically when you have 9-12 months of runway. Fundraising takes 3-6 months in good conditions, longer in bad. Securing financing when you're under 6 months of runway is much more expensive and uncertain." },
    { q: "Does runway only matter for startups?", a: "Mostly. Profitable established businesses have effectively infinite runway as long as they stay profitable. Runway is most relevant for early-stage, growth-stage burning cash, or any business in a temporary downturn." },
  ],
  seo: {
    title: "Runway - Definition | Tweaxly Business Glossary",
    description:
      "Runway is the number of months a business can operate at its current cash burn rate before running out. Cash ÷ burn = runway.",
    keywords: [
      "runway",
      "what is runway",
      "business runway",
      "cash runway",
      "startup runway",
    ],
  },
};

export const Body = () => (
  <>
    <Lead>
      The single most-watched cash metric for early-stage
      businesses: how long can the business operate before
      running out of money. Calculated as cash on hand divided
      by monthly net burn rate.
    </Lead>

    <DefinitionBlock term="Runway">
      the number of months a business can continue operating
      at its current cash burn rate before running out of
      money, calculated by dividing cash on hand by monthly
      net burn.
    </DefinitionBlock>

    <Formula
      formula={"Runway (months) = Cash on hand ÷ Monthly net burn"}
      example={
        <>
          A business has $300K cash in the bank and is burning
          $30K per month net. Runway ={" "}
          <strong>$300K ÷ $30K = 10 months</strong>.
        </>
      }
    />

    <H2 id="how-to-read">How to read runway</H2>

    <ul>
      <li>
        <strong>12+ months</strong> - comfortable position
      </li>
      <li>
        <strong>9-12 months</strong> - start planning next
        steps (revenue acceleration, cost discipline, or
        financing)
      </li>
      <li>
        <strong>6-9 months</strong> - act now; the time to
        secure financing is when you don&apos;t urgently need
        it
      </li>
      <li>
        <strong>3-6 months</strong> - urgent. Take action this
        quarter
      </li>
      <li>
        <strong>Less than 3 months</strong> - crisis territory.
        Daily attention required
      </li>
    </ul>

    <H2 id="watch-out">Watch out</H2>

    <p>
      Two common mistakes:
    </p>

    <ul>
      <li>
        <strong>Counting uncertain future revenue.</strong>{" "}
        Optimistic revenue assumptions stretch runway artificially.
        Use conservative inputs.
      </li>
      <li>
        <strong>Ignoring lumpy expenses.</strong> Quarterly
        taxes, annual renewals, equipment purchases all consume
        cash without showing in average monthly burn. Build them
        into the calculation.
      </li>
    </ul>

    <H2 id="related">Related terms</H2>

    <ul>
      <li>
        <ArticleLink href="/resources/business-glossary/burn-rate">
          Burn Rate
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/ebitda">
          EBITDA
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/business-glossary/net-profit">
          Net Profit
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/cash-flow-forecasting">
          Cash Flow Forecasting (article)
        </ArticleLink>
      </li>
      <li>
        <ArticleLink href="/resources/cash-flow-management/how-much-cash-reserve">
          How Much Cash Reserve Should a Business Have (article)
        </ArticleLink>
      </li>
    </ul>

    <KeyTakeaways items={[
      "Runway = Cash on hand ÷ Monthly net burn = months of operation remaining.",
      "12+ months is comfortable. Below 6 months: urgent action required.",
      "Use conservative revenue assumptions - don't stretch runway with optimism.",
      "Include lumpy expenses (taxes, annual renewals) in the burn calculation.",
      "Secure financing when you don't urgently need it - it's cheaper and faster.",
    ]} />
  </>
);
