import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { tierConfigForBusiness } from "../aiTier";
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

REQUIREMENTS:
- "dna" scores are integers 0-10 (10 = strongest). For "riskExposure", a higher score means MORE risk.
- "timeline": identify 2-4 phases that fit the data (e.g. Growth, Expansion, Margin Pressure, Stabilization).
- Keep every section grounded in the provided multi-year numbers.`;

export async function generateBusinessEvolution(opts: {
  businessId: string;
  apiKey:     string;
  currency:   string;
  metrics:    EvolutionMetrics;
}): Promise<EvolutionResult> {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const tier = await tierConfigForBusiness(opts.businessId, "business_evolution");

  const table = seriesForPrompt(opts.metrics.series);
  const userContent =
    `Reporting currency: ${opts.currency}\n\n` +
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
  if (!raw.trim()) throw new Error("The evolution engine returned an empty response.");

  const sanitized = raw.replace(/—/g, " - ");
  const fence = sanitized.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = (fence ? fence[1] : sanitized).trim();
  const parsed = JSON.parse(jsonText);
  return EvolutionResultSchema.parse(parsed);
}
