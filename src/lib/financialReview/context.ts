import { z } from "zod";

// ── Audited-Statements Context Layer ─────────────────────────────
// Business-friendly context that materially improves the Business Story
// and multi-year analysis WITHOUT asking owners to behave like
// accountants. Two kinds of context:
//   1. Upload metadata - reporting country + currency (context only,
//      never used to recalculate; the audited statement is the source
//      of truth).
//   2. Contextual follow-up answers - plain-English questions the AI
//      asks ONLY when it detects a pattern in the statements that an
//      owner can clarify (seasonality, deferred revenue, inventory
//      reliance, project-based revenue).
//
// This module is intentionally free of server-only imports so the
// upload UI can reuse the dropdown lists.

// ── Reporting country / currency dropdowns ──
export interface Option { code: string; label: string }

export const COUNTRIES: Option[] = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "IL", label: "Israel" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "OTHER", label: "Other" },
];

export const CURRENCIES: Option[] = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "ILS", label: "ILS - Israeli Shekel" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "OTHER", label: "Other" },
];

export function countryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
export function currencyLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return CURRENCIES.find((c) => c.code === code)?.label ?? code;
}

// ── Contextual follow-up signals ──
// The catalog of patterns the AI may detect. The model returns only the
// ones it actually sees, with its own grounded observation; the UI falls
// back to this catalog's question/options if the model omits them.
export const CONTEXT_SIGNAL_KEYS = [
  "deferredRevenue",
  "seasonality",
  "inventory",
  "projectBased",
] as const;
export type ContextSignalKey = (typeof CONTEXT_SIGNAL_KEYS)[number];

export interface ContextSignalDef {
  key:      ContextSignalKey;
  title:    string;
  question: string;
  options:  string[];
}

export const CONTEXT_SIGNALS: Record<ContextSignalKey, ContextSignalDef> = {
  deferredRevenue: {
    key: "deferredRevenue",
    title: "Deferred revenue",
    question: "We noticed a significant deferred revenue balance. Which best describes your business?",
    options: ["Annual subscriptions", "Multi-year contracts", "Customer prepayments", "Retainers", "Not sure"],
  },
  seasonality: {
    key: "seasonality",
    title: "Seasonality",
    question: "Your numbers show strong fluctuations across the year. Is your business seasonal?",
    options: ["Yes", "No", "Not sure"],
  },
  inventory: {
    key: "inventory",
    title: "Inventory",
    question: "Inventory is a significant share of your assets. Does your business rely heavily on inventory?",
    options: ["Yes", "No", "Not sure"],
  },
  projectBased: {
    key: "projectBased",
    title: "Revenue model",
    question: "Your revenue and receivables look project-based. How do you typically generate revenue?",
    options: ["One-time projects", "Recurring subscriptions", "Product sales", "Services", "Mixed"],
  },
};

// ── Durable, business-level financial-analysis context ──
// Accumulated over time; feeds the Business Story and future
// benchmarking / forecasting / valuation features.
export const FinancialAnalysisContextSchema = z.object({
  reportCountry:           z.string().nullable().default(null),
  currency:                z.string().nullable().default(null),
  businessModel:           z.string().nullable().default(null),
  revenueModel:            z.string().nullable().default(null),
  seasonalBusiness:        z.boolean().nullable().default(null),
  deferredRevenueDetected: z.boolean().nullable().default(null),
  inventoryHeavyBusiness:  z.boolean().nullable().default(null),
  projectBasedBusiness:    z.boolean().nullable().default(null),
  // Raw plain-English answers keyed by signal key (e.g.
  // { deferredRevenue: "Annual subscriptions", seasonality: "No" }).
  answers:                 z.record(z.string(), z.string()).default({}),
  updatedAt:               z.string().nullable().default(null),
});
export type FinancialAnalysisContext = z.infer<typeof FinancialAnalysisContextSchema>;

// Map a tri-state answer to a boolean flag (Yes/No/Not sure).
function yesNo(answer: string | undefined): boolean | null {
  if (!answer) return null;
  const a = answer.trim().toLowerCase();
  if (a === "yes") return true;
  if (a === "no") return false;
  return null;
}

// Fold a set of contextual answers into the durable context structure,
// deriving the boolean flags + revenue model from the chosen options.
export function applyAnswersToContext(
  base: Partial<FinancialAnalysisContext> | null | undefined,
  answers: Record<string, string>,
  nowIso: string,
): FinancialAnalysisContext {
  const ctx = FinancialAnalysisContextSchema.parse(base ?? {});
  const merged = { ...ctx.answers, ...answers };

  const deferred = merged.deferredRevenue;
  const project = merged.projectBased;

  return FinancialAnalysisContextSchema.parse({
    ...ctx,
    answers: merged,
    seasonalBusiness:
      "seasonality" in answers ? yesNo(merged.seasonality) : ctx.seasonalBusiness,
    inventoryHeavyBusiness:
      "inventory" in answers ? yesNo(merged.inventory) : ctx.inventoryHeavyBusiness,
    deferredRevenueDetected:
      deferred ? deferred.toLowerCase() !== "not sure" : ctx.deferredRevenueDetected,
    projectBasedBusiness:
      project ? project === "One-time projects" : ctx.projectBasedBusiness,
    revenueModel: project && project !== "Mixed" ? project : ctx.revenueModel,
    updatedAt: nowIso,
  });
}
