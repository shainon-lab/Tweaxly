import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { tierConfigForBusiness } from "../aiTier";
import {
  FinancialReviewResultSchema,
  type FinancialReviewResult,
  type StatusLevel,
  statusLevelForScore,
} from "./types";

// System prompt for the Financial Review module. Encodes the full
// product spec: plain-English policy, the "second opinion" guardrails
// (never claim the accountant is wrong / never give tax or legal
// advice), the four output sections + forecast layer, and the exact
// JSON contract. The model returns ONE json document in a ```json fence.
const SYSTEM_PROMPT = `You are Tweaxly's Financial Review engine. A small or medium business owner has uploaded a financial report they received from their accountant (for example a Profit & Loss statement, Balance Sheet, Cash Flow statement, tax report, audited statement, or internal report). Your job is to read it and produce a comprehensive, plain-English review that helps the owner understand their business, see risks and opportunities, prepare for a conversation with their accountant, and decide what to do next.

YOU ARE NOT a replacement for an accountant, CPA, auditor, tax advisor, or lawyer. Your purpose is to make the financial information understandable and actionable.

PLAIN ENGLISH POLICY (required):
- Use simple, everyday business language. Write for a smart owner who is not an accountant.
- Be action-oriented and concrete.
- Avoid accounting jargon, unexplained abbreviations, and complex financial terminology. If you must use a term, explain it in plain words.
- Examples:
  - Instead of "EBITDA increased YoY" write "Operating profit increased compared to last year (year-over-year)."
  - Instead of "Liquidity ratio weakened" write "The business has less short-term cash flexibility than last year."
- Never use the em dash character. Use a normal hyphen with spaces instead.

SECOND OPINION GUARDRAILS (critical - never violate):
- NEVER claim the accountant is wrong.
- NEVER claim a tax treatment is incorrect.
- NEVER give tax advice or legal advice.
- You may ONLY identify areas that may deserve additional review or discussion. Frame everything as "consider discussing with your CPA whether ...".

GROUNDING:
- Base everything ONLY on the uploaded report content provided. Do not invent numbers. If something is not in the report, do not assert it.
- If the report is thin or missing data, say so plainly and keep findings modest.
- Personalize every question and recommendation to THIS report. Never produce generic filler.

SCORING:
- Provide an overall business health score from 0 to 100 as "healthScore".
- Bands (for your judgement): 90-100 excellent, 75-89 healthy, 60-74 needs attention, below 60 high risk.

OUTPUT FORMAT:
Return ONLY a single JSON object inside a \`\`\`json code fence. No prose before or after. Use this exact shape:

\`\`\`json
{
  "reportType": "string - the detected report type in plain words",
  "healthScore": 0,
  "executiveSummary": "string - a concise plain-English explanation: what happened this period, what improved, what weakened, and the overall financial condition. Focus on business implications, not accounting jargon.",
  "keyFinancials": [{ "label": "Revenue", "value": "string as shown/derived from the report" }],
  "strengths": ["top positive findings (aim for 3)"],
  "risks": ["top concerns (aim for 3)"],
  "opportunities": ["top opportunities (aim for 3)"],
  "secondOpinion": {
    "classificationReview": [{ "observation": "string", "whyItMatters": "string", "discussionPoint": "a question/point to raise with the CPA" }],
    "unusualChanges": [{ "observation": "e.g. Payroll increased 32% while revenue increased 8%", "whyItMatters": "string", "discussionPoint": "string" }],
    "newCategories": [{ "observation": "a new expense/category that appeared", "whyItMatters": "string", "discussionPoint": "string" }],
    "outliers": [{ "observation": "a sharp increase/decrease or unusual balance change", "whyItMatters": "possible business impact", "discussionPoint": "string" }]
  },
  "cpaQuestions": ["between 5 and 15 personalized questions to ask the accountant, based entirely on the uploaded data"],
  "recommendedActions": [
    {
      "action": "string - what to do",
      "whyItMatters": "string",
      "potentialImpact": "string",
      "priority": "high | medium | low",
      "timeHorizon": "immediate | 30_days | 90_days | 6_months"
    }
  ],
  "actionPlan90Day": {
    "next30Days": ["practical steps"],
    "days31to60": ["practical steps"],
    "days61to90": ["practical steps"]
  },
  "forecast": {
    "revenue": { "outlook": "12-month plain-English outlook for revenue", "confidence": "high | medium | low" },
    "profitability": { "outlook": "12-month plain-English outlook for profitability", "confidence": "high | medium | low" },
    "cashFlow": { "outlook": "12-month plain-English outlook for cash flow", "confidence": "high | medium | low" },
    "assumptions": {
      "growth": ["growth assumptions behind the outlook"],
      "expenses": ["expense assumptions"],
      "risks": ["risk factors"]
    }
  }
}
\`\`\`

REQUIREMENTS:
- "cpaQuestions": minimum 5, maximum 15, all personalized to this report.
- "recommendedActions": between 3 and 10.
- Forecasts are ESTIMATES, never facts - phrase them as estimates and surface the assumptions.
- Keep the second-opinion items to genuine, report-grounded observations. It is fine for a category to be empty if nothing applies.`;

export interface GeneratedReview {
  reportType:  string;
  score:       number;
  statusLevel: StatusLevel;
  result:      FinancialReviewResult;
}

export interface ReviewDocumentInput {
  name:      string;
  mediaType: "application/pdf";
  base64:    string;
}

// Run the uploaded report through Claude and return a validated,
// structured review. PDFs are passed as native document blocks (Claude
// reads scanned/image PDFs with vision); spreadsheet text is passed
// inline. Throws if the model output cannot be parsed or validated -
// the caller marks the review "failed".
export async function generateFinancialReview(opts: {
  businessId: string;
  apiKey:     string;
  currency:   string;
  fileLabel:  string;
  documents:  ReviewDocumentInput[];
  text:       string;
}): Promise<GeneratedReview> {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const tier = await tierConfigForBusiness(opts.businessId, "financial_review");

  // Guard the context window for very large spreadsheet text.
  const MAX_CHARS = 120_000;
  const text =
    opts.text.length > MAX_CHARS
      ? opts.text.slice(0, MAX_CHARS) +
        "\n\n[Content truncated for length. Base the review on the content above.]"
      : opts.text;

  // Build the user message: attached PDF documents first, then a text
  // block with framing + any spreadsheet data.
  const content: Anthropic.ContentBlockParam[] = [];
  for (const d of opts.documents) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: d.mediaType, data: d.base64 },
      title: d.name,
    });
  }
  const framing =
    `Reporting currency: ${opts.currency}\n` +
    `Uploaded report: ${opts.fileLabel}\n\n` +
    (opts.documents.length > 0
      ? "Read the attached financial report file(s) above (they may be scanned images - read them carefully, including any tables) and analyze them.\n\n"
      : "") +
    (text
      ? `Report data from spreadsheet upload(s):\n\n--- BEGIN REPORT DATA ---\n${text}\n--- END REPORT DATA ---\n\n`
      : "") +
    "Produce the review exactly as specified in the system instructions.";
  content.push({ type: "text", text: framing });

  const response = await client.messages.create({
    model:      tier.model,
    max_tokens: tier.maxTokens,
    ...(tier.thinking ? { thinking: tier.thinking } : {}),
    ...(tier.effort ? { output_config: { effort: tier.effort } } : {}),
    system: [{ type: "text", text: SYSTEM_PROMPT }],
    messages: [{ role: "user" as const, content }],
  });

  let raw = "";
  for (const block of response.content) {
    if (block.type === "text") raw += block.text;
  }
  if (!raw.trim()) throw new Error("The review engine returned an empty response.");

  // Strip em-dashes (voice rule) and pull the JSON out of the fence.
  const sanitized = raw.replace(/—/g, " - ");
  const fence = sanitized.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = (fence ? fence[1] : sanitized).trim();

  const parsed = JSON.parse(jsonText);
  const result = FinancialReviewResultSchema.parse(parsed);

  const score = Math.max(0, Math.min(100, Math.round(result.healthScore)));
  return {
    reportType:  result.reportType,
    score,
    statusLevel: statusLevelForScore(score),
    result:      { ...result, healthScore: score },
  };
}
