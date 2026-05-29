import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "opex",
  title: "OPEX",
  excerpt:
    "OPEX: Operating Expenses. The day-to-day cost of running the business - rent, salaries, software, utilities. Distinct from COGS and CAPEX.",
  category: "business-glossary",
  tags: ["OPEX", "Operating Expenses", "Overhead"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Stands for: Operating Expenses.",
    "Definition: Costs of running the business that aren't directly tied to producing a specific product.",
    "Includes: Rent, salaries not in COGS, marketing, software, insurance, utilities.",
    "Distinct from: COGS (direct production cost) and CAPEX (capital purchases).",
    "Hits the P&L: As expenses in the period incurred.",
  ],
  faq: [
    { q: "What does OPEX stand for?", a: "Operating Expenses - the day-to-day costs of running the business." },
    { q: "What's the difference between OPEX and COGS?", a: "COGS is the direct cost of producing what was sold (materials, direct labor). OPEX is the cost of running the business in general (rent, marketing, overhead). Both are expenses but they sit on different lines of the P&L." },
    { q: "What's the difference between OPEX and CAPEX?", a: "OPEX hits the P&L immediately (rent paid this month is an expense this month). CAPEX is for long-lived assets and gets depreciated over years (equipment, vehicles, buildings)." },
    { q: "What goes in OPEX?", a: "Salaries not directly billable, rent, utilities, software subscriptions, marketing, insurance, professional services, office supplies, travel." },
    { q: "How does OPEX relate to operating profit?", a: "Operating Profit = Gross Profit − OPEX. OPEX is the second layer of costs subtracted to get to the operating margin." },
    { q: "Should I try to minimize OPEX?", a: "Minimize waste, not OPEX overall. Some OPEX is necessary for the business to run; cutting too aggressively damages operations. Look at OPEX as a percentage of revenue and benchmark against your industry." },
  ],
  seo: {
    title: "OPEX - Operating Expenses Definition | Tweaxly",
    description: "OPEX stands for Operating Expenses - the day-to-day cost of running the business. Distinct from COGS and CAPEX.",
    keywords: ["OPEX", "operating expenses", "what is OPEX", "overhead", "OPEX vs CAPEX"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The second layer of costs on a profit and loss statement.
      OPEX captures the day-to-day cost of running the business -
      everything that keeps the lights on, regardless of how much
      product you ship.
    </Lead>

    <DefinitionBlock term="OPEX (Operating Expenses)">
      the day-to-day costs of running the business that aren&apos;t
      directly tied to producing a specific product or service.
      Includes rent, salaries, marketing, software, insurance,
      and general overhead.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Operating profit calculation</strong> - Gross Profit − OPEX = Operating Profit</li>
      <li><strong>OPEX ratio</strong> - OPEX as % of revenue is a standard efficiency metric</li>
      <li><strong>Budgeting</strong> - most budget categories are OPEX line items</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      OPEX has a way of growing quietly - subscription creep, headcount expansion, vendor cost increases. An annual review of every OPEX category usually finds 5-15% of recoverable spend.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cogs">Cost of Goods Sold (COGS)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/capex">Capital Expenditure (CAPEX)</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/operating-profit">Operating Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variable-costs">Variable Costs</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "OPEX = day-to-day cost of running the business.",
      "Distinct from COGS (direct production) and CAPEX (capital assets).",
      "Hits the P&L immediately in the period incurred.",
      "Subtracted from gross profit to get operating profit.",
    ]} />
  </>
);
