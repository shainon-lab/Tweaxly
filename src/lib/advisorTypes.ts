// Structured advisor output. Phase 1 of the Advisory UX overhaul:
// every Claude-mode response returns this shape (parsed from JSON the
// model is instructed to produce). The UI renders one card per
// section, instead of a single markdown bubble.
//
// Older messages, mock fallback messages, and Claude responses that
// fail to parse (network blip / model returned plain text) keep using
// the legacy `content: string` field on ConsultationAnswer. The
// renderer detects which shape is present and chooses accordingly.

export type AdvisoryStance =
  | "yes"           // green - clear go
  | "no"            // red   - clear stop
  | "conditional"   // amber - depends on missing inputs
  | "wait"          // amber - delay recommendation
  | "info";         // neutral - informational only

export type ConfidenceBand = "low" | "medium" | "high";

// Each driver/insight belongs to a reasoning category so we can
// surface a small "Reasoning type" chip on the card and group
// related insights visually.
export type ReasoningType =
  | "trend"               // Trend Analysis
  | "capacity"            // Capacity Analysis
  | "staffing"            // Staffing Analysis
  | "cashflow"            // Cash Flow Analysis
  | "forecast"            // Forecast Modeling
  | "operational_risk"    // Operational Risk
  | "profitability"       // Profitability Analysis
  | "seasonal"            // Seasonal Pattern Detection
  | "pricing"             // Pricing Strategy
  | "other";

export const REASONING_LABEL: Record<ReasoningType, string> = {
  trend:            "Trend Analysis",
  capacity:         "Capacity Analysis",
  staffing:         "Staffing Analysis",
  cashflow:         "Cash Flow Analysis",
  forecast:         "Forecast Modeling",
  operational_risk: "Operational Risk",
  profitability:    "Profitability Analysis",
  seasonal:         "Seasonal Pattern Detection",
  pricing:          "Pricing Strategy",
  other:            "General",
};

export interface AdvisoryDriver {
  category:      string;          // human label, e.g. "Revenue Growth"
  detail:        string;          // 1-2 sentences of reasoning
  reasoningType: ReasoningType;
  // Concrete data points this driver was inferred from. Each anchor
  // is a short factual citation like "Repair revenue 2025-01: $1,800 → 2026-12: $7,400"
  // or "Trailing-3 net margin: 14%". Renders as small "📊 data" chips
  // beneath the driver detail. When omitted/empty, the driver is
  // pure business reasoning (no data backing) - the UI shows no chips.
  dataAnchors?:  string[];
}

export interface AdvisoryRisk {
  label:  string;                 // short headline ("Q1 seasonal slowdown")
  detail: string;                 // single-sentence explanation
}

export interface AdvisoryConfidence {
  overall:             number;            // 0-100
  dataCoverage:        ConfidenceBand;
  forecastReliability: ConfidenceBand;
  // The signals the recommendation was built on. Renders as chips
  // under a "Based on" header.
  basedOn:             string[];
  // Data the model would have liked but didn't have. Renders as chips
  // under a "Important missing data" header. Empty array if nothing.
  missingInputs:       string[];
}

export interface AdvisoryExecutiveDecision {
  headline: string;               // very short - large type. e.g. "Hire within 30-60 days"
  stance:   AdvisoryStance;
}

export interface StructuredAdvice {
  // High-level reasoning category for the answer as a whole. Drives
  // the chip at the top of the answer ("Staffing Analysis").
  reasoningCategory: ReasoningType;
  executiveDecision: AdvisoryExecutiveDecision;
  confidence:        AdvisoryConfidence;
  drivers:           AdvisoryDriver[];       // 2-6 items
  risks:             AdvisoryRisk[];         // 1-4 items
  recommendation:    string;                 // concrete actionable line
}

// ────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────
//
// Minimal runtime check that a Claude response actually conforms to
// the schema. We're strict on required fields but permissive on
// optional shape - missing arrays default to empty.

const STANCES: AdvisoryStance[] = ["yes", "no", "conditional", "wait", "info"];
const BANDS:   ConfidenceBand[] = ["low", "medium", "high"];
const REASONS  = Object.keys(REASONING_LABEL) as ReasoningType[];

function asStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : null;
}

export function parseStructuredAdvice(raw: unknown): StructuredAdvice | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const reasoningCategory = oneOf(r.reasoningCategory, REASONS) ?? "other";

  const decisionRaw = r.executiveDecision as Record<string, unknown> | undefined;
  if (!decisionRaw) return null;
  const headline = asStr(decisionRaw.headline);
  const stance   = oneOf(decisionRaw.stance, STANCES);
  if (!headline || !stance) return null;

  const confRaw = r.confidence as Record<string, unknown> | undefined;
  if (!confRaw) return null;
  const overall  = asNum(confRaw.overall);
  const cov      = oneOf(confRaw.dataCoverage, BANDS);
  const fcast    = oneOf(confRaw.forecastReliability, BANDS);
  if (overall == null || !cov || !fcast) return null;

  const basedOn = Array.isArray(confRaw.basedOn)
    ? confRaw.basedOn.map((s) => asStr(s)).filter((s): s is string => !!s)
    : [];
  const missing = Array.isArray(confRaw.missingInputs)
    ? confRaw.missingInputs.map((s) => asStr(s)).filter((s): s is string => !!s)
    : [];

  const driversRaw = Array.isArray(r.drivers) ? r.drivers : [];
  const drivers: AdvisoryDriver[] = [];
  for (const d of driversRaw) {
    if (!d || typeof d !== "object") continue;
    const dr = d as Record<string, unknown>;
    const cat    = asStr(dr.category);
    const detail = asStr(dr.detail);
    const rType  = oneOf(dr.reasoningType, REASONS) ?? "other";
    const anchors = Array.isArray(dr.dataAnchors)
      ? dr.dataAnchors.map((s) => asStr(s)).filter((s): s is string => !!s)
      : [];
    if (cat && detail) drivers.push({
      category: cat, detail, reasoningType: rType,
      ...(anchors.length ? { dataAnchors: anchors } : {}),
    });
  }
  if (drivers.length === 0) return null;

  const risksRaw = Array.isArray(r.risks) ? r.risks : [];
  const risks: AdvisoryRisk[] = [];
  for (const r2 of risksRaw) {
    if (!r2 || typeof r2 !== "object") continue;
    const rr = r2 as Record<string, unknown>;
    const label  = asStr(rr.label);
    const detail = asStr(rr.detail);
    if (label && detail) risks.push({ label, detail });
  }

  const recommendation = asStr(r.recommendation);
  if (!recommendation) return null;

  return {
    reasoningCategory,
    executiveDecision: { headline, stance },
    confidence: {
      overall:             Math.max(0, Math.min(100, Math.round(overall))),
      dataCoverage:        cov,
      forecastReliability: fcast,
      basedOn,
      missingInputs:       missing,
    },
    drivers,
    risks,
    recommendation,
  };
}
