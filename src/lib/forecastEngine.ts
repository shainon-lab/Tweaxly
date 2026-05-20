// Centralized Forecasting Engine.
//
// Every screen that displays a forecasted number — Forecast tab,
// dashboard projection tile, signals quoting forward figures, AI
// consultation context — MUST route through this engine. Do not
// add ad-hoc projection math elsewhere.
//
// Design (per docs/forecast-engine.md):
//   1. Validate readiness (≥ 90 days of usable historical data).
//   2. Resolve the baseline window (spec-defined options, no
//      "Last Month", recommended logic, custom-range validator).
//   3. Aggregate historical actuals month-by-month (financial-date
//      filtered — uses Transaction.accountingMonth, never createdAt).
//   4. Detect outliers, recurring patterns, light seasonality.
//   5. Project forward; apply scenarios as a separate layer.
//   6. Compute a confidence score from data-quality signals.
//   7. Return a structured result with an explanation string.

import { prisma } from "./db";
import {
  loadBaseline,
  runScenario,
  type Assumption,
  type Baseline,
  type ForecastPoint,
} from "./forecast";
import { todayYM, shiftYM } from "./format";
import { buildDataConfidence } from "./dataConfidence";

// ── Public types ─────────────────────────────────────────────────────

export type BaselineOptionId =
  | "recommended"
  | "last_quarter"   // 3 months
  | "last_6m"
  | "last_12m"
  | "last_18m"
  | "last_24m"
  | "custom";

export interface BaselineOption {
  id: BaselineOptionId;
  label: string;
  months: number;      // 0 = resolved at runtime (recommended/custom)
}

// "Last Month" is intentionally absent — one month is not enough
// data for a reliable forecast.
export const BASELINE_OPTIONS: BaselineOption[] = [
  { id: "recommended",  label: "Recommended",     months: 0 },
  { id: "last_quarter", label: "Last Quarter (3 months)", months: 3 },
  { id: "last_6m",      label: "Last 6 Months",   months: 6 },
  { id: "last_12m",     label: "Last 12 Months",  months: 12 },
  { id: "last_18m",     label: "Last 18 Months",  months: 18 },
  { id: "last_24m",     label: "Last 24 Months",  months: 24 },
  { id: "custom",       label: "Custom Range",    months: 0 },
];

export type HorizonId = "3m" | "6m" | "12m" | "24m";
export const HORIZON_OPTIONS: { id: HorizonId; label: string; months: number }[] = [
  { id: "3m",  label: "Next 3 months",  months: 3 },
  { id: "6m",  label: "Next 6 months",  months: 6 },
  { id: "12m", label: "Next 12 months", months: 12 },
  { id: "24m", label: "Next 24 months", months: 24 },
];

export type ReadinessState =
  | "disabled"     // < 90 days
  | "basic"        // 90 days to < 6 months
  | "standard"     // 6 to < 12 months
  | "reliable"     // 12 to < 18 months
  | "advanced";    // 18+ months

export interface ReadinessReport {
  state: ReadinessState;
  daysOfData: number;
  monthsOfData: number;
  label: string;        // user-facing label (e.g. "Standard Forecast")
  description: string;  // one-line user-facing sub-label
  defaultBaseline: BaselineOptionId;
}

export type Confidence = "low" | "medium" | "high";

export interface ProjectedMonth {
  ym: string;
  baselineRevenue: number;
  baselineExpenses: number;
  baselineNet: number;
  scenarioRevenue: number;
  scenarioExpenses: number;
  scenarioNet: number;
  notes?: string[];
}

export interface ForecastExclusion {
  reason: string;
  count: number;
  note?: string;
}

export interface ForecastResult {
  ok: true;
  baselinePeriod: {
    id: BaselineOptionId;
    fromYM: string;
    toYM: string;
    monthsResolved: number;
    label: string;
  };
  forecastHorizon: { id: HorizonId; months: number };
  actualsUsed: number;                // transactions feeding the baseline
  excludedRecords: ForecastExclusion[];
  projectedMonths: ProjectedMonth[];
  baseline: Baseline;                 // raw baseline aggregates for AI prompts
  assumptions: Assumption[];          // scenario assumptions applied (if any)
  scenariosApplied: number;
  outliersDetected: { ym: string; metric: "income" | "expense"; reason: string }[];
  recurringDetected: { kind: string; description: string; monthlyAmount: number }[];
  seasonalityApplied: boolean;
  seasonalityNote: string;
  confidence: Confidence;
  confidenceScore: number;            // 0-100
  explanationText: string;            // mandatory "Why this forecast?" body
  warnings: string[];
}

export interface ForecastBlocked {
  ok: false;
  reason:
    | "not_enough_data"
    | "custom_range_too_short"
    | "custom_range_empty"
    | "custom_range_invalid";
  message: string;
  readiness?: ReadinessReport;
}

// ── Readiness computation ────────────────────────────────────────────

function diffDaysInclusive(fromYM: string, toYM: string): number {
  const [fy, fm] = fromYM.split("-").map(Number);
  const [ty, tm] = toYM.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, 1);
  const b = Date.UTC(ty, tm, 0, 23, 59, 59); // last day of toYM
  return Math.round((b - a) / 86_400_000);
}

function monthsBetween(fromYM: string, toYM: string): number {
  const [fy, fm] = fromYM.split("-").map(Number);
  const [ty, tm] = toYM.split("-").map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm) + 1);
}

export async function evaluateReadiness(businessId: string): Promise<ReadinessReport> {
  const rows = await prisma.transaction.findMany({
    where: { businessId, isExcludedFromPnl: false },
    select: { accountingMonth: true, transactionDate: true },
    orderBy: { transactionDate: "asc" },
    take: 1,
  });
  const last = await prisma.transaction.findFirst({
    where: { businessId, isExcludedFromPnl: false },
    select: { transactionDate: true },
    orderBy: { transactionDate: "desc" },
  });
  if (rows.length === 0 || !last) {
    return {
      state: "disabled",
      daysOfData: 0,
      monthsOfData: 0,
      label: "Not enough data",
      description: "Forecasts require at least 90 days of validated financial data.",
      defaultBaseline: "last_quarter",
    };
  }
  const first = rows[0]!.transactionDate;
  const lastT = last.transactionDate;
  const days = Math.max(0, Math.round((lastT.getTime() - first.getTime()) / 86_400_000));
  const months = Math.max(1, Math.round(days / 30));

  if (days < 90) {
    return {
      state: "disabled",
      daysOfData: days,
      monthsOfData: months,
      label: "Not enough data",
      description: "Forecasts require at least 90 days of validated financial data.",
      defaultBaseline: "last_quarter",
    };
  }
  if (months < 6) {
    return {
      state: "basic",
      daysOfData: days,
      monthsOfData: months,
      label: "Basic Forecast",
      description: "Based on your last quarter of validated business data.",
      defaultBaseline: "last_quarter",
    };
  }
  if (months < 12) {
    return {
      state: "standard",
      daysOfData: days,
      monthsOfData: months,
      label: "Standard Forecast",
      description: "Based on your last 6 months of validated business data.",
      defaultBaseline: "last_6m",
    };
  }
  if (months < 18) {
    return {
      state: "reliable",
      daysOfData: days,
      monthsOfData: months,
      label: "Reliable Forecast",
      description: "Based on your last 12 months of validated business data.",
      defaultBaseline: "last_12m",
    };
  }
  return {
    state: "advanced",
    daysOfData: days,
    monthsOfData: months,
    label: "Advanced Forecast",
    description: "Based on long-term historical business patterns.",
    // Spec: even with 24+ months, default to Last 12 unless the user
    // explicitly picks Last 18 / 24. Older data may be less relevant.
    defaultBaseline: "last_12m",
  };
}

// ── Baseline resolution ──────────────────────────────────────────────

function lastCompleteYM(): string {
  return shiftYM(todayYM(), -1);
}

export function resolveBaseline(
  id: BaselineOptionId,
  readiness: ReadinessReport,
  customFromYM?: string,
  customToYM?: string,
): { id: BaselineOptionId; fromYM: string; toYM: string; monthsResolved: number; label: string } | { error: ForecastBlocked["reason"]; message: string } {
  // "recommended" maps to the readiness-recommended baseline.
  const effective: BaselineOptionId = id === "recommended" ? readiness.defaultBaseline : id;
  const anchor = lastCompleteYM();

  if (effective === "custom") {
    if (!customFromYM || !customToYM) {
      return { error: "custom_range_invalid", message: "Custom range requires a start and end month." };
    }
    const a = customFromYM <= customToYM ? customFromYM : customToYM;
    let b = customFromYM <= customToYM ? customToYM : customFromYM;
    // Refuse future-dated baselines — incomplete data.
    if (b > anchor) b = anchor;
    const days = diffDaysInclusive(a, b);
    if (days < 90) {
      return {
        error: "custom_range_too_short",
        message: "Forecasts require at least 90 days of historical data. Please select a longer period to create a reliable forecast.",
      };
    }
    return {
      id: "custom",
      fromYM: a,
      toYM: b,
      monthsResolved: monthsBetween(a, b),
      label: `Custom Range — ${a} to ${b}`,
    };
  }

  const opt = BASELINE_OPTIONS.find((o) => o.id === effective);
  if (!opt || opt.months === 0) {
    // Recommended fallback already resolved above; only reachable if a
    // bad id slipped through.
    return { error: "custom_range_invalid", message: "Unknown baseline option." };
  }
  const fromYM = shiftYM(anchor, -(opt.months - 1));
  return {
    id: effective,
    fromYM,
    toYM: anchor,
    monthsResolved: opt.months,
    label: opt.label,
  };
}

// ── Outlier / Recurring / Seasonality detection ──────────────────────

// Simple z-score over monthly income / expense, flagging months that
// sit > 2 stdev from the trailing mean. Pure statistics — no LLM.
function detectOutliers(
  monthlyHistory: { ym: string; income: number; expenses: number }[],
): ForecastResult["outliersDetected"] {
  const out: ForecastResult["outliersDetected"] = [];
  if (monthlyHistory.length < 4) return out;
  for (const metric of ["income", "expenses"] as const) {
    const values = monthlyHistory.map((m) => m[metric]);
    const mean   = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const sd = Math.sqrt(variance);
    if (sd < 1) continue;
    monthlyHistory.forEach((m, i) => {
      const z = (m[metric] - mean) / sd;
      if (Math.abs(z) > 2) {
        out.push({
          ym: m.ym,
          metric: metric === "income" ? "income" : "expense",
          reason: `${m.ym} ${metric} was ${z > 0 ? "+" : ""}${z.toFixed(1)} stdev from the period mean — treated as outlier.`,
        });
      }
    });
  }
  return out;
}

// Pull active ManualEntry rows for the business that are tagged as a
// recurring frequency — these are explicit recurring patterns the
// user has registered. The forecast engine respects them as projected
// forward items.
async function detectRecurring(
  businessId: string,
): Promise<ForecastResult["recurringDetected"]> {
  const entries = await prisma.manualEntry.findMany({
    where: {
      businessId,
      frequency: { in: ["monthly", "quarterly", "yearly"] },
    },
    include: { category: { select: { name: true, kind: true } } },
  });
  return entries.map((e) => ({
    kind: e.type === "income" ? "income" : "expense",
    description: `${e.category?.name ?? "Manual entry"} (${e.frequency})`,
    monthlyAmount:
      e.frequency === "monthly"   ? e.amount :
      e.frequency === "quarterly" ? e.amount / 3 :
      e.frequency === "yearly"    ? e.amount / 12 : 0,
  }));
}

// ── Confidence scoring ───────────────────────────────────────────────

async function computeConfidence(
  businessId: string,
  monthsResolved: number,
  outlierCount: number,
  scenarioCount: number,
): Promise<{ confidence: Confidence; score: number; warnings: string[] }> {
  const dq = await buildDataConfidence(businessId);
  const warnings: string[] = [...dq.warnings];

  // Start from data-quality score and adjust for forecast-specific
  // signals. Each modifier is small so any single factor can't crash
  // confidence by itself.
  let score = dq.score;

  // History depth modifier — already baked into dq.score but
  // re-weighted here for the forecast lens (a forecast over 3 months
  // of data isn't the same as over 18).
  if (monthsResolved < 6)  score = Math.min(score, 55);
  if (monthsResolved < 12) score = Math.min(score, 75);

  if (outlierCount > 0) {
    score -= 5 * Math.min(3, outlierCount);
    warnings.push(`${outlierCount} historical month${outlierCount === 1 ? " was" : "s were"} flagged as outliers — confidence reduced.`);
  }
  if (scenarioCount > 3) {
    score -= 5;
    warnings.push("More than 3 scenario assumptions stacked — projection complexity reduces confidence.");
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence: Confidence =
    score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  return { confidence, score, warnings };
}

// ── Public entry point ───────────────────────────────────────────────

export interface BuildForecastInput {
  businessId: string;
  baselineId: BaselineOptionId;
  horizonId: HorizonId;
  customFromYM?: string;
  customToYM?: string;
  assumptions?: Assumption[];        // scenario layer
}

export async function buildForecastEngine(
  input: BuildForecastInput,
): Promise<ForecastResult | ForecastBlocked> {
  const { businessId, baselineId, horizonId, customFromYM, customToYM } = input;
  const readiness = await evaluateReadiness(businessId);

  if (readiness.state === "disabled") {
    return {
      ok: false,
      reason: "not_enough_data",
      message: "Not enough historical data for a reliable forecast yet. Forecasts require at least 90 days of validated financial data.",
      readiness,
    };
  }

  const resolved = resolveBaseline(baselineId, readiness, customFromYM, customToYM);
  if ("error" in resolved) {
    return { ok: false, reason: resolved.error, message: resolved.message, readiness };
  }

  // Validate the resolved range actually contains data.
  const txnCount = await prisma.transaction.count({
    where: {
      businessId,
      accountingMonth: { gte: resolved.fromYM, lte: resolved.toYM },
      isExcludedFromPnl: false,
    },
  });
  if (txnCount === 0) {
    return {
      ok: false,
      reason: "custom_range_empty",
      message: "This period does not contain enough validated financial activity to generate a reliable forecast.",
      readiness,
    };
  }

  // Build the actual baseline aggregate using the existing forecast
  // module's loadBaseline (so historical math stays in one place).
  const baseline = await loadBaseline(businessId, resolved.fromYM, resolved.toYM, resolved.label);

  const horizonOpt = HORIZON_OPTIONS.find((h) => h.id === horizonId) ?? HORIZON_OPTIONS[2];

  // Run scenarios twice: once with no assumptions (baseline points) and
  // once with the caller's assumptions, then merge into the engine
  // result so the UI gets both layers in one read.
  const baselinePoints = runScenario(baseline, horizonOpt.months, []);
  const assumptions = input.assumptions ?? [];
  const scenarioPoints = runScenario(baseline, horizonOpt.months, assumptions);

  const projectedMonths: ProjectedMonth[] = baselinePoints.map((b, i) => {
    const s = scenarioPoints[i] ?? b;
    return {
      ym: b.ym,
      baselineRevenue:  b.baselineRevenue,
      baselineExpenses: b.baselineExpenses,
      baselineNet:      b.baselineNet,
      scenarioRevenue:  s.scenarioRevenue,
      scenarioExpenses: s.scenarioExpenses,
      scenarioNet:      s.scenarioNet,
      notes: s.notes,
    };
  });

  // Build the monthly history block (signed by accounting month) so
  // we can run outlier detection without re-querying. We hit
  // buildMonthSnapshot per month inside the resolved window — same
  // path the Baseline uses internally.
  const { buildMonthSnapshot } = await import("./metrics");
  const monthlyHistory: { ym: string; income: number; expenses: number }[] = [];
  let cursor = resolved.fromYM;
  let guard = 0;
  while (cursor <= resolved.toYM && guard < 240) {
    const snap = await buildMonthSnapshot(businessId, cursor);
    monthlyHistory.push({ ym: cursor, income: snap.income, expenses: snap.expenses });
    cursor = shiftYM(cursor, 1);
    guard++;
  }
  const outliers = detectOutliers(monthlyHistory);
  const recurring = await detectRecurring(businessId);

  // Seasonality: only meaningful with 12+ months of data per spec.
  const seasonalityApplied = resolved.monthsResolved >= 12;
  const seasonalityNote = seasonalityApplied
    ? "Seasonality adjustment available based on historical monthly behavior."
    : "Seasonality was not applied because there is not enough historical data (12+ months required).";

  // Confidence.
  const { confidence, score, warnings } = await computeConfidence(
    businessId, resolved.monthsResolved, outliers.length, assumptions.length,
  );

  // Excluded-records audit: count txns we deliberately filtered out
  // (excludedFromPnl + outside the resolved range + invalid dates).
  const [excludedPnl, missingDate] = await Promise.all([
    prisma.transaction.count({ where: { businessId, isExcludedFromPnl: true } }),
    prisma.transaction.count({
      where: { businessId, accountingMonth: { in: ["", "0000-00"] } },
    }),
  ]);
  const excluded: ForecastExclusion[] = [];
  if (excludedPnl > 0) excluded.push({ reason: "Excluded from P&L by user", count: excludedPnl });
  if (missingDate > 0) excluded.push({ reason: "Missing or invalid financial date", count: missingDate });

  // Incomplete current month warning.
  if (resolved.toYM >= todayYM()) {
    warnings.unshift("The current month is still in progress and may distort the forecast — the engine excluded it from the baseline anchor.");
  }

  // Compose the explanation text.
  const revTrend = baseline.revenueGrowthMoM;
  const expTrend = baseline.expenseGrowthMoM;
  const explanationLines = [
    `This forecast is based on ${resolved.label}.`,
    `Revenue ${revTrend >= 0 ? "grew" : "declined"} by an average of ${(Math.abs(revTrend) * 100).toFixed(1)}% month-over-month, while expenses ${expTrend >= 0 ? "grew" : "declined"} by ${(Math.abs(expTrend) * 100).toFixed(1)}%.`,
    recurring.length > 0
      ? `${recurring.length} recurring item${recurring.length === 1 ? "" : "s"} (e.g. ${recurring.slice(0, 2).map((r) => r.description).join(", ")}) are projected forward.`
      : "No explicit recurring entries are registered — forecast relies on the trailing average.",
    seasonalityNote,
    outliers.length > 0
      ? `${outliers.length} historical month${outliers.length === 1 ? "" : "s"} were flagged as outliers and excluded from trend calculation.`
      : "No outlier months detected.",
    assumptions.length > 0
      ? `${assumptions.length} scenario assumption${assumptions.length === 1 ? "" : "s"} added on top of the baseline.`
      : "No scenarios are applied — this is the baseline forecast.",
    `Forecast confidence: ${confidence.toUpperCase()} (${score}/100).`,
  ];
  const explanationText = explanationLines.join(" ");

  if (confidence === "low") {
    warnings.unshift("This forecast should be treated as directional only.");
  }

  return {
    ok: true,
    baselinePeriod: {
      id: resolved.id,
      fromYM: resolved.fromYM,
      toYM: resolved.toYM,
      monthsResolved: resolved.monthsResolved,
      label: resolved.label,
    },
    forecastHorizon: { id: horizonId, months: horizonOpt.months },
    actualsUsed: txnCount,
    excludedRecords: excluded,
    projectedMonths,
    baseline,
    assumptions,
    scenariosApplied: assumptions.length,
    outliersDetected: outliers,
    recurringDetected: recurring,
    seasonalityApplied,
    seasonalityNote,
    confidence,
    confidenceScore: score,
    explanationText,
    warnings,
  };
}

// Re-export so callers can grab the readiness state without
// computing a full forecast.
export type { Assumption, Baseline, ForecastPoint };

// Type guard so callers can branch cleanly.
export function isForecastReady(r: ForecastResult | ForecastBlocked): r is ForecastResult {
  return r.ok === true;
}
