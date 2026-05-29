import { Lead, H2, ArticleLink, DefinitionBlock, Formula, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "customer-payback-period",
  title: "Customer Payback Period",
  excerpt:
    "Customer Payback Period: how many months of customer gross profit it takes to recover the cost of acquiring that customer. The other half of CAC analysis.",
  category: "business-glossary",
  tags: ["Payback Period", "CAC", "Unit Economics"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Months of customer gross profit required to recover Customer Acquisition Cost.",
    "Formula: CAC ÷ Monthly Gross Profit per Customer.",
    "Healthy range: Under 12 months for most subscription businesses.",
    "Why it matters: Long paybacks tie up capital; short paybacks free it for more acquisition.",
    "Pairs with: LTV:CAC ratio. Both should be healthy.",
  ],
  faq: [
    { q: "What's customer payback period?", a: "The number of months of customer gross profit needed to recover what it cost to acquire that customer." },
    { q: "How is payback period calculated?", a: "Payback = CAC ÷ Monthly Gross Profit per Customer. A $1,200 CAC with $150 monthly gross profit per customer = 8-month payback." },
    { q: "What's a good payback period?", a: "Under 12 months is healthy for most subscription businesses. Under 6 months is excellent. Over 18 months ties up significant capital and creates risk." },
    { q: "How is payback different from LTV:CAC?", a: "LTV:CAC measures the total value relative to cost. Payback measures the time to recover cost. A business can have great LTV:CAC but bad payback if customer lifetime is very long but revenue per period is small." },
    { q: "Why does payback period matter?", a: "Because growth requires reinvesting cash. Faster payback means cash recycles faster, funding more growth without external capital." },
    { q: "Should I use revenue or gross profit?", a: "Gross profit. Revenue overstates payback speed by ignoring the cost to serve each customer. Always use gross profit for honest unit economics." },
  ],
  seo: {
    title: "Customer Payback Period - Definition | Tweaxly",
    description: "Customer Payback Period is months of gross profit needed to recover Customer Acquisition Cost. Plain English with formula.",
    keywords: ["payback period", "customer payback period", "CAC payback", "unit economics", "what is payback period"],
  },
};

export const Body = () => (
  <>
    <Lead>
      Half of the unit economics conversation. LTV:CAC tells you
      whether customers eventually pay back; payback period tells
      you when. Both matter - and a business can have great
      LTV:CAC but problematic payback if customer revenue is
      thin relative to acquisition cost.
    </Lead>

    <DefinitionBlock term="Customer Payback Period">
      the number of months of customer gross profit required to
      recover the cost of acquiring that customer. CAC divided
      by monthly gross profit per customer.
    </DefinitionBlock>

    <Formula formula={"Payback Period (months) = CAC ÷ Monthly Gross Profit per Customer\n\nExample: $1,200 CAC, $200/month revenue, 75% gross margin = $150 monthly gross profit. Payback = $1,200 ÷ $150 = 8 months."} />

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Cash recycling</strong> - faster payback funds more acquisition without external capital</li>
      <li><strong>Investor conversations</strong> - one of the headline SaaS metrics</li>
      <li><strong>Channel comparison</strong> - some acquisition channels have faster payback than others</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Always use gross profit, not revenue. Revenue-based payback overstates how quickly you actually recover acquisition spend.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cac">CAC</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/ltv">LTV</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/roas">ROAS</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/mrr">MRR</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Payback Period = CAC ÷ Monthly Gross Profit per Customer.",
      "Under 12 months is healthy for most subscription businesses.",
      "Faster payback frees cash for more growth.",
      "Use gross profit, not revenue.",
    ]} />
  </>
);
