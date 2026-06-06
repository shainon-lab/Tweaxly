import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { tierConfigForBusiness } from "../aiTier";
import { parseModelJson } from "./jsonExtract";
import {
  EvolutionResultSchema,
  type EvolutionResult,
  type EvolutionMetrics,
  seriesForPrompt,
} from "./evolution";

const SYSTEM_PROMPT = `You are Tweaxly's Business Evolution engine. You are given a business's key financials across MULTIPLE financial years (extracted from the financial reports they uploaded), plus pre-computed trend metrics. Your job is to explain how the business has evolved over time, in plain English, and turn that into a long-term profile and strategy.

You are NOT a replacement for an accountant, CPA, auditor, tax advisor, or lawyer. This is decision-support, not advice.

PLAIN ENGLISH POLICY (required):
- Simple, everyday business language for a smart owner who is not an accountant.
- Explain financial concepts; avoid jargon; expand abbreviations (e.g. write "year-over-year" not "YoY").
- Never use the em dash character; use a normal hyphen with spaces.

GROUNDING:
- Use ONLY the numbers provided. Do not invent figures. If a metric is missing for some years, acknowledge the limitation and keep claims modest.
- Multi-year forecasts are ESTIMATES, never certainties. Phrase them as estimates and surface assumptions.

OUTPUT FORMAT:
Return ONLY one JSON object inside a \`\`\`json code fence. No prose outside it. Exact shape:

\`\`\`json
{
  "businessStory": "string - a clear plain-English narrative of how the business evolved across the years: revenue, profitability, costs, cash, debt, and what phase it appears to be in. Reference concrete numbers/changes.",
  "timeline": [
    { "period": "2021-2022", "phase": "Growth Phase", "description": "short plain-English description of this phase" }
  ],
  "trendAnalysis": {
    "strongestPositive": "the strongest positive trend, with the number",
    "strongestNegative": "the strongest negative trend, with the number",
    "largestChange": "the single largest business change over the period",
    "largestRisk": "the largest financial risk emerging from the trends",
    "mostImproved": "the most improved area"
  },
  "evolutionForecast": {
    "revenue":       { "outlook": "plain-English outlook grounded in the multi-year trend", "confidence": "high | medium | low" },
    "profitability": { "outlook": "...", "confidence": "high | medium | low" },
    "cashFlow":      { "outlook": "...", "confidence": "high | medium | low" },
    "risk":          { "outlook": "...", "confidence": "high | medium | low" }
  },
  "dna": {
    "growthOrientation": 0, "financialDiscipline": 0, "cashManagement": 0,
    "operationalEfficiency": 0, "riskExposure": 0, "stability": 0, "scalability": 0,
    "summary": "2-4 sentence plain-English Business DNA summary"
  },
  "strategic": {
    "mustFix":       ["what must be fixed"],
    "shouldProtect": ["what should be protected"],
    "shouldScale":   ["what should be scaled"],
    "whatNext":      ["what will likely happen next if nothing changes"]
  }
}
\`\`\`

THE BUSINESS STORY must combine three perspectives into one flowing plain-English narrative (do not label them as headings, weave them together):
- Financial perspective: how revenue, profitability, cash flow and the balance sheet evolved, and the key financial trends - with concrete numbers.
- Business perspective: how the business appears to make money, its growth pattern, where the risks are, and its operational strengths and weaknesses.
- Strategic perspective: what changed over time, what appears to be working, what appears to be declining, and what management should investigate next.

USING BUSINESS CONTEXT:
- You may be given business context (industry, business model, revenue model, seasonality, deferred revenue, inventory reliance, project-based revenue, country, stage, goals). Use it to INTERPRET the numbers - for example, reading seasonal swings or deferred revenue correctly - so the story fits how this specific business actually operates.
- Context NEVER changes the figures. The provided financial numbers are the source of truth. If context and numbers seem to disagree, trust the numbers and note the tension.

REQUIREMENTS:
- "dna" scores are integers 0-10 (10 = strongest). For "riskExposure", a higher score means MORE risk.
- "timeline": identify 2-4 phases that fit the data (e.g. Growth, Expansion, Margin Pressure, Stabilization).
- Keep every section grounded in the provided multi-year numbers.`;

// Business profile + durable financial context fed to the story so it
// reflects how this specific business actually operates. All optional.
export interface EvolutionBusinessContext {
  industry?:       string | null;
  country?:        string | null;
  businessStage?:  string | null;
  businessFormat?: string | null;
  goals?:          string | null;
  businessModel?:  string | null;
  revenueModel?:   string | null;
  seasonalBusiness?:        boolean | null;
  deferredRevenueDetected?: boolean | null;
  inventoryHeavyBusiness?:  boolean | null;
  projectBasedBusiness?:    boolean | null;
}

// Render only the context fields that carry a value, as compact bullets.
function contextBlock(ctx: EvolutionBusinessContext | undefined): string {
  if (!ctx) return "";
  const lines: string[] = [];
  const add = (label: string, v: unknown) => {
    if (v === null || v === undefined || v === "") return;
    const val = typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
    lines.push(`- ${label}: ${val}`);
  };
  add("Industry", ctx.industry);
  add("Country", ctx.country);
  add("Business stage", ctx.businessStage);
  add("Business format", ctx.businessFormat);
  add("Stated goals", ctx.goals);
  add("Business model", ctx.businessModel);
  add("Revenue model", ctx.revenueModel);
  add("Seasonal business", ctx.seasonalBusiness);
  add("Significant deferred revenue", ctx.deferredRevenueDetected);
  add("Inventory-heavy", ctx.inventoryHeavyBusiness);
  add("Project-based revenue", ctx.projectBasedBusiness);
  if (lines.length === 0) return "";
  return (
    `Business context (use to INTERPRET the numbers, never to change them):\n` +
    lines.join("\n") +
    `\n\n`
  );
}

export async function generateBusinessEvolution(opts: {
  businessId: string;
  apiKey:     string;
  currency:   string;
  metrics:    EvolutionMetrics;
  context?:   EvolutionBusinessContext;
}): Promise<EvolutionResult> {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const tier = await tierConfigForBusiness(opts.businessId, "business_evolution");

  const table = seriesForPrompt(opts.metrics.series);
  const userContent =
    `Reporting currency: ${opts.currency}\n\n` +
    contextBlock(opts.context) +
    `Per-year financials (oldest to newest):\n\`\`\`json\n${JSON.stringify(table, null, 2)}\n\`\`\`\n\n` +
    `Pre-computed trend metrics:\n\`\`\`json\n${JSON.stringify(opts.metrics.cards, null, 2)}\n\`\`\`\n\n` +
    `Analyze the evolution across these ${opts.metrics.years.length} years and produce the JSON exactly as specified.`;

  const response = await client.messages.create({
    model:      tier.model,
    max_tokens: tier.maxTokens,
    ...(tier.thinking ? { thinking: tier.thinking } : {}),
    ...(tier.effort ? { output_config: { effort: tier.effort } } : {}),
    system: [{ type: "text", text: SYSTEM_PROMPT }],
    messages: [{ role: "user" as const, content: userContent }],
  });

  let raw = "";
  for (const block of response.content) {
    if (block.type === "text") raw += block.text;
  }

  const parsed = parseModelJson(raw, {
    truncated: response.stop_reason === "max_tokens",
    engine: "evolution engine",
  });
  return EvolutionResultSchema.parse(parsed);
}
