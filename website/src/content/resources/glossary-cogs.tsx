import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cogs",
  title: "COGS",
  excerpt:
    "COGS: Cost of Goods Sold. The direct costs of producing or delivering whatever was sold. Subtracted from revenue to get gross profit.",
  category: "business-glossary",
  tags: ["COGS", "Cost of Goods", "Direct Costs"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "beginner",
  tldr: [
    "Stands for: Cost of Goods Sold (sometimes Cost of Revenue or Cost of Sales).",
    "Definition: Direct costs required to produce or deliver whatever was sold.",
    "Includes: Raw materials, freight in, payment processing, direct production labor.",
    "Doesn't include: Rent, marketing, owner salary, general overhead.",
    "Used in: Gross profit calculation (Revenue − COGS = Gross Profit).",
  ],
  faq: [
    { q: "What does COGS stand for?", a: "Cost of Goods Sold. Sometimes also called Cost of Revenue or Cost of Sales." },
    { q: "What's included in COGS?", a: "Costs directly required to make or deliver what you sold - raw materials, freight in, payment processing fees, direct labor on production, packaging." },
    { q: "What's NOT in COGS?", a: "Rent, marketing, owner salary, software subscriptions, insurance, accounting fees - those are operating expenses, not direct costs." },
    { q: "How is COGS different for a service business?", a: "For services, COGS is the labor and materials directly billable to a client - contractor time on the project, project-specific software. NOT included: office, sales effort, owner overhead." },
    { q: "Where does payment processing belong?", a: "In COGS. The 2-3% Stripe or PayPal takes is a direct cost of every sale. Misclassifying it as overhead makes gross margin look better than it is." },
    { q: "How often should I review COGS?", a: "Monthly. A drifting COGS ratio (as % of revenue) is one of the earliest signs of margin compression." },
  ],
  seo: {
    title: "COGS - Cost of Goods Sold Definition | Tweaxly",
    description: "COGS stands for Cost of Goods Sold - the direct costs of producing what was sold. A plain-English definition with examples.",
    keywords: ["COGS", "cost of goods sold", "what is COGS", "cost of revenue", "direct costs"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The cost number that determines gross profit. COGS captures
      everything directly required to produce or deliver what was
      sold - the inputs that wouldn&apos;t exist without the sale.
    </Lead>

    <DefinitionBlock term="COGS (Cost of Goods Sold)">
      the direct costs required to produce or deliver the
      products or services sold during a period. Raw materials,
      freight in, payment processing, direct production labor.
      Sometimes called Cost of Revenue or Cost of Sales.
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Gross profit calculation</strong> - Revenue − COGS = Gross Profit</li>
      <li><strong>Margin analysis</strong> - COGS ratio (as % of revenue) tracks product-level economics</li>
      <li><strong>Pricing decisions</strong> - knowing direct cost per unit informs minimum viable pricing</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      The line between COGS and overhead trips up most owners. Rule of thumb: if you stopped selling, the cost would mostly go away (COGS) or stay (overhead). Get this right; everything downstream depends on it.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/gross-profit">Gross Profit</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/gross-margin">Gross Margin</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/variable-costs">Variable Costs</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/opex">Operating Expenses (OPEX)</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "COGS = direct costs of producing or delivering what was sold.",
      "Includes materials, freight, payment processing, direct labor.",
      "Doesn't include rent, marketing, owner salary, general overhead.",
      "Used to calculate gross profit (Revenue − COGS).",
    ]} />
  </>
);
