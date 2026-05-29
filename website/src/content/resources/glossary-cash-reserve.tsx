import { Lead, H2, ArticleLink, DefinitionBlock, KeyTakeaways } from "@/components/article";
import type { ArticleModule } from "./types";

export const meta: ArticleModule["meta"] = {
  slug: "cash-reserve",
  title: "Cash Reserve",
  excerpt:
    "Cash Reserve: cash set aside as a safety buffer for emergencies. Typically 3-6 months of fixed operating expenses, kept liquid and separate.",
  category: "business-glossary",
  tags: ["Cash Reserve", "Risk Management", "Liquidity"],
  author: { name: "Tweaxly Team", role: "Learning Center" },
  publishedAt: "2026-05-29",
  readingTime: 2,
  kind: "glossary",
  difficulty: "intermediate",
  tldr: [
    "Definition: Cash kept separate as a safety buffer for emergencies.",
    "Standard target: 3-6 months of fixed operating expenses.",
    "Higher for: Volatile, concentrated, or seasonal businesses (6-12+ months).",
    "Held in: Liquid, safe accounts (savings, money market, short-term treasuries).",
    "Critical rule: Always separate from operating cash - mixed cash gets used.",
  ],
  faq: [
    { q: "What's a cash reserve?", a: "Cash held separately as a safety buffer for genuine emergencies - a major customer leaving, economic downturn, unexpected lump-sum expense." },
    { q: "How much cash reserve should I have?", a: "Conventional rule: 3-6 months of fixed operating expenses. Volatile or concentrated businesses should target 6-12 months." },
    { q: "Where should I keep cash reserve?", a: "Liquid, safe accounts - business savings, money market, short-term treasuries. The goal is access on demand, not return." },
    { q: "Should reserve be in a separate account?", a: "Yes. If mixed with operating cash, it gets used. The psychological wall of separation is what makes reserve actually function." },
    { q: "When should I use the reserve?", a: "Genuine emergencies only - major customer loss, economic downturn, unexpected major expense. Not normal slow months or growth investment." },
    { q: "How do I build a reserve when I don't have one?", a: "Set a monthly contribution (1-2% of revenue, automated), use windfalls (tax refunds, one-time gains), and don't touch it until you hit the target. Building a 3-month reserve takes 18-24 months for most businesses." },
  ],
  seo: {
    title: "Cash Reserve - Definition | Tweaxly Business Glossary",
    description: "Cash Reserve is cash set aside as a safety buffer. Typically 3-6 months of fixed expenses. Plain English with sizing guidance.",
    keywords: ["cash reserve", "business emergency fund", "cash buffer", "how much cash should a business have", "liquidity"],
  },
};

export const Body = () => (
  <>
    <Lead>
      The financial cushion that lets a business survive
      unexpected events. Without reserve, every bad quarter
      becomes existential; with it, you have time to respond
      thoughtfully.
    </Lead>

    <DefinitionBlock term="Cash Reserve">
      cash held separately as a safety buffer for emergencies,
      typically targeting 3-6 months of fixed operating expenses
      (higher for volatile, concentrated, or seasonal businesses).
    </DefinitionBlock>

    <H2 id="common-use">Common uses</H2>
    <ul>
      <li><strong>Risk management</strong> - the buffer against unexpected events</li>
      <li><strong>Strategic flexibility</strong> - reserves enable decisions that would otherwise be off the table</li>
      <li><strong>Lender comfort</strong> - banks evaluate creditworthiness against reserve levels</li>
    </ul>

    <H2 id="watch-out">Watch out</H2>
    <p>
      Reserve in the same account as operating cash isn&apos;t really reserve - it gets used. Move it to a separate account and treat it as untouchable.
    </p>

    <H2 id="related">Related terms</H2>
    <ul>
      <li><ArticleLink href="/resources/business-glossary/cash-flow">Cash Flow</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/working-capital">Working Capital</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/liquidity">Liquidity</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/runway">Runway</ArticleLink></li>
      <li><ArticleLink href="/resources/business-glossary/fixed-costs">Fixed Costs</ArticleLink></li>
    </ul>

    <KeyTakeaways items={[
      "Cash Reserve = safety buffer for emergencies.",
      "Standard target: 3-6 months of fixed operating expenses.",
      "Held in liquid, safe accounts; separate from operating cash.",
      "Use only for genuine emergencies, not normal variability.",
    ]} />
  </>
);
