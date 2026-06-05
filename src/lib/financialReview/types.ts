// Financial Review - shared types + validation schema.
//
// The AI returns one structured JSON document with four sections plus a
// forecast layer. We validate it with zod (already a project dep) so a
// malformed model response is caught and the review is marked failed
// rather than rendering a broken page. Arrays that the UI can tolerate
// being empty default to [].

import { z } from "zod";

export const STATUS_LEVELS = ["excellent", "healthy", "needs_attention", "high_risk"] as const;
export type StatusLevel = (typeof STATUS_LEVELS)[number];

export const PRIORITIES = ["high", "medium", "low"] as const;
export const TIME_HORIZONS = ["immediate", "30_days", "90_days", "6_months"] as const;
export const CONFIDENCE = ["high", "medium", "low"] as const;

// The model occasionally emits a sensible-but-off-list enum value (e.g.
// timeHorizon "60_days", priority "critical"). A single stray value used
// to throw and discard an entire 30-90s review. These tolerant schemas
// snap such values to the nearest canonical bucket instead of failing.

// Snap any time horizon to one of the four canonical buckets. Understands
// "60_days", "2_months", "12 months", "now", etc.
const timeHorizonSchema = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.trim().toLowerCase().replace(/\s+/g, "_");
  if ((TIME_HORIZONS as readonly string[]).includes(s)) return s;
  if (["now", "asap", "urgent", "immediately"].includes(s)) return "immediate";
  const m = s.match(/(\d+)_?(day|days|week|weeks|month|months|year|years)/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const days = unit.startsWith("week") ? n * 7
      : unit.startsWith("month") ? n * 30
      : unit.startsWith("year") ? n * 365
      : n;
    if (days <= 1) return "immediate";
    if (days <= 30) return "30_days";
    if (days <= 90) return "90_days";
    return "6_months";
  }
  return s; // fall through to enum().catch() below
}, z.enum(TIME_HORIZONS).catch("90_days"));

// Priority / confidence: snap unknowns to "medium".
const prioritySchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.enum(PRIORITIES).catch("medium"),
);
const confidenceSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.enum(CONFIDENCE).catch("medium"),
);

const ReviewFlag = z.object({
  observation:     z.string(),
  whyItMatters:    z.string(),
  discussionPoint: z.string(),
});
export type ReviewFlag = z.infer<typeof ReviewFlag>;

const ForecastLine = z.object({
  outlook:    z.string(),
  confidence: confidenceSchema,
});
export type ForecastLine = z.infer<typeof ForecastLine>;

const RecommendedAction = z.object({
  action:         z.string(),
  whyItMatters:   z.string(),
  potentialImpact: z.string(),
  priority:       prioritySchema,
  timeHorizon:    timeHorizonSchema,
});
export type RecommendedAction = z.infer<typeof RecommendedAction>;

// Normalised numeric financials (report currency). All nullable - a
// given report may not contain every line. Used for cross-year trend
// math in V2 Business Evolution.
export const NormalizedFinancialsSchema = z.object({
  revenue:          z.number().nullable().default(null),
  expenses:         z.number().nullable().default(null),
  grossProfit:      z.number().nullable().default(null),
  operatingProfit:  z.number().nullable().default(null),
  netProfit:        z.number().nullable().default(null),
  cashPosition:     z.number().nullable().default(null),
  totalAssets:      z.number().nullable().default(null),
  totalLiabilities: z.number().nullable().default(null),
  equity:           z.number().nullable().default(null),
});
export type NormalizedFinancials = z.infer<typeof NormalizedFinancialsSchema>;

export const FINANCIALS_LABELS: Record<keyof NormalizedFinancials, string> = {
  revenue:          "Revenue",
  expenses:         "Expenses",
  grossProfit:      "Gross profit",
  operatingProfit:  "Operating profit",
  netProfit:        "Net profit",
  cashPosition:     "Cash position",
  totalAssets:      "Total assets",
  totalLiabilities: "Total liabilities",
  equity:           "Equity",
};

export const FinancialReviewResultSchema = z.object({
  // Auto-detected report type, e.g. "Profit & Loss Statement".
  reportType: z.string(),
  // Financial year the report covers, detected from the content (e.g.
  // 2024). Null if it cannot be determined.
  detectedYear: z.number().int().nullable().default(null),
  // Normalised numeric financials for cross-year analysis.
  financials: NormalizedFinancialsSchema.default({
    revenue: null, expenses: null, grossProfit: null, operatingProfit: null,
    netProfit: null, cashPosition: null, totalAssets: null, totalLiabilities: null, equity: null,
  }),
  // 0-100 overall business health. Tolerant of a numeric string or an
  // out-of-range value from the model; the caller clamps to 0-100.
  healthScore: z.coerce.number().catch(0),

  // ── Section 1: Business Health Assessment ──
  executiveSummary: z.string(),
  keyFinancials: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .default([]),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),

  // ── Section 2: AI Second Opinion ──
  secondOpinion: z.object({
    classificationReview: z.array(ReviewFlag).default([]),
    unusualChanges:       z.array(ReviewFlag).default([]),
    newCategories:        z.array(ReviewFlag).default([]),
    outliers:             z.array(ReviewFlag).default([]),
  }),

  // ── Section 3: Questions To Ask Your CPA (5-15) ──
  cpaQuestions: z.array(z.string()).default([]),

  // ── Section 4: Action Plan (3-10 recommendations) ──
  recommendedActions: z.array(RecommendedAction).default([]),
  actionPlan90Day: z.object({
    next30Days: z.array(z.string()).default([]),
    days31to60: z.array(z.string()).default([]),
    days61to90: z.array(z.string()).default([]),
  }),

  // ── Forecast layer: 12-month outlook ──
  forecast: z.object({
    revenue:       ForecastLine,
    profitability: ForecastLine,
    cashFlow:      ForecastLine,
    assumptions: z.object({
      growth:   z.array(z.string()).default([]),
      expenses: z.array(z.string()).default([]),
      risks:    z.array(z.string()).default([]),
    }),
  }),
});

export type FinancialReviewResult = z.infer<typeof FinancialReviewResultSchema>;

// Health score → status band (per spec thresholds). Derived in code so
// the badge always matches the number, regardless of the model.
export function statusLevelForScore(score: number): StatusLevel {
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 60) return "needs_attention";
  return "high_risk";
}

export function statusLabel(level: StatusLevel | string | null | undefined): string {
  switch (level) {
    case "excellent":       return "Excellent";
    case "healthy":         return "Healthy";
    case "needs_attention": return "Needs Attention";
    case "high_risk":       return "High Risk";
    default:                return "—";
  }
}

// pill-* class for a status band (maps to the app's good/warn/bad tokens).
export function statusPillClass(level: StatusLevel | string | null | undefined): string {
  switch (level) {
    case "excellent":
    case "healthy":         return "pill-good";
    case "needs_attention": return "pill-warn";
    case "high_risk":       return "pill-bad";
    default:                return "pill";
  }
}

export function priorityLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function timeHorizonLabel(t: string): string {
  switch (t) {
    case "immediate": return "Immediate";
    case "30_days":   return "30 Days";
    case "90_days":   return "90 Days";
    case "6_months":  return "6 Months";
    default:          return t;
  }
}

// Shared disclaimer text shown throughout the module.
export const FINANCIAL_REVIEW_DISCLAIMER =
  "This review is generated by AI for informational purposes only. It does not constitute accounting, tax, legal, audit, or financial advice. Always consult your CPA, accountant, tax advisor, or other qualified professional before making financial decisions.";
