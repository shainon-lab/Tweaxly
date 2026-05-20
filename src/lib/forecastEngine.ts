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
    monthsResolved: number;   // calendar months in the window
    monthsWithData: number;   // months that actually contain transactions — drives confidence
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
  const [fy, fm] = fromYM.slice(0, 7).split("-").map(Number);
  const [ty, tm] = toYM.slice(0, 7).split("-").map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm) + 1);
}

// Exact inclusive day count between two ISO-ish dates. Accepts either
// "YYYY-MM" (snapped to 1st-of for from, 28th-of for to as a safe
// approximation) or full "YYYY-MM-DD". Returned count is what the
// user sees in the "Selected range is N days" error message.
function countDaysExact(fromISO: string, toISO: string): number {
  const a = fromISO.length === 10 ? new Date(`${fromISO}T00:00:00Z`)
          : new Date(`${fromISO.slice(0, 7)}-01T00:00:00Z`);
  const b = toISO.length === 10   ? new Date(`${toISO}T00:00:00Z`)
          : new Date(`${toISO.slice(0, 7)}-28T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
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
    // Accept either YM ("YYYY-MM") or full ISO ("YYYY-MM-DD"). The
    // engine works on accountingMonth so we collapse to YM for
    // bucketing — but we count exact selected days for the error
    // message so the user sees their actual selection ("Selected
    // range is 89 days…") instead of a month-rounded count.
    const aRaw = customFromYM <= customToYM ? customFromYM : customToYM;
    const bRaw = customFromYM <= customToYM ? customToYM   : customFromYM;
    const a = aRaw.slice(0, 7);
    let   b = bRaw.slice(0, 7);
    if (b > anchor) b = anchor;
    const selectedDays = countDaysExact(aRaw, bRaw);
    if (selectedDays < 90) {
      return {
        error: "custom_range_too_short",
        message: `Selected range is ${selectedDays} day${selectedDays === 1 ? "" : "s"} — forecasts require at least 90 days of historical data. Please select a longer period to create a reliable forecast.`,
      };
    }
    return {
      id: "custom",
      fromYM: a,
      toYM: b,
      monthsResolved: monthsBetween(a, b),
      label: `Custom Range — ${aRaw} to ${bRaw}`,
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

// Recurring pattern detection — two sources fused into a single list:
//
//   1. EXPLICIT: every active ManualEntry tagged with a recurring
//      frequency (monthly/quarterly/yearly).
//   2. INFERRED: vendor-clustering on the baseline window's
//      transactions. A vendor that appears ≥ 3 times in the window
//      with amounts within ±15% of each other is treated as
//      recurring. Cadence (monthly / quarterly) is inferred from the
//      median date gap between occurrences.
//
// Inferred recurring is conservative on purpose — we don't want to
// promote a noisy vendor (e.g. coffee shop appearing weekly with
// varying amounts) to a "recurring forecast" item. The 3-occurrence
// minimum + amount-tolerance filter keeps the list tight.
async function detectRecurring(
  businessId: string,
  baselineFromYM: string,
  baselineToYM: string,
): Promise<ForecastResult["recurringDetected"]> {
  // (1) Explicit recurring manual entries.
  const entries = await prisma.manualEntry.findMany({
    where: {
      businessId,
      frequency: { in: ["monthly", "quarterly", "yearly"] },
    },
    include: { category: { select: { name: true, kind: true } } },
  });
  const explicit: ForecastResult["recurringDetected"] = entries.map((e) => ({
    kind: e.type === "income" ? "income" : "expense",
    description: `${e.category?.name ?? "Manual entry"} (${e.frequency})`,
    monthlyAmount:
      e.frequency === "monthly"   ? e.amount :
      e.frequency === "quarterly" ? e.amount / 3 :
      e.frequency === "yearly"    ? e.amount / 12 : 0,
  }));

  // (2) Inferred recurring from transactions in the baseline window.
  // We only consider vendor-tagged rows — untagged rows can't be
  // clustered. Source = "manual" rows are excluded because they
  // already appear via explicit entries.
  const txns = await prisma.transaction.findMany({
    where: {
      businessId,
      accountingMonth: { gte: baselineFromYM, lte: baselineToYM },
      isExcludedFromPnl: false,
      vendor: { not: null },
      source: { not: "manual" },
    },
    select: { vendor: true, amount: true, transactionDate: true, type: true },
  });

  type Group = { amounts: number[]; dates: Date[]; type: string };
  const byVendor = new Map<string, Group>();
  for (const t of txns) {
    if (!t.vendor) continue;
    const g = byVendor.get(t.vendor) ?? { amounts: [], dates: [], type: t.type };
    g.amounts.push(t.amount);
    g.dates.push(t.transactionDate);
    byVendor.set(t.vendor, g);
  }

  const inferred: ForecastResult["recurringDetected"] = [];
  for (const [vendor, g] of byVendor) {
    if (g.amounts.length < 3) continue;
    // Amount tightness: ratio of stdev to mean must be < 15%.
    const absAmounts = g.amounts.map((a) => Math.abs(a));
    const mean = absAmounts.reduce((s, v) => s + v, 0) / absAmounts.length;
    if (mean < 10) continue;  // ignore vendors with sub-$10 averages
    const variance = absAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / absAmounts.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv > 0.15) continue;

    // Cadence: median day-gap between consecutive sorted dates.
    const sorted = [...g.dates].sort((a, b) => a.getTime() - b.getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(Math.round((sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / 86_400_000));
    }
    if (gaps.length === 0) continue;
    gaps.sort((a, b) => a - b);
    const medianGap = gaps[Math.floor(gaps.length / 2)]!;
    const cadence =
      medianGap >= 20 && medianGap <= 40   ? "monthly"  :
      medianGap >= 80 && medianGap <= 100  ? "quarterly":
      medianGap >= 350 && medianGap <= 380 ? "yearly"   : null;
    if (!cadence) continue;

    const sign = g.amounts.reduce((s, v) => s + v, 0) >= 0 ? "income" : "expense";
    inferred.push({
      kind: sign,
      description: `${vendor} (${cadence}, detected)`,
      monthlyAmount:
        cadence === "monthly"   ? mean :
        cadence === "quarterly" ? mean / 3 :
                                  mean / 12,
    });
  }

  // De-dup against explicit entries by description prefix.
  const explicitKeys = new Set(explicit.map((e) => e.description.toLowerCase().split(" (")[0]));
  const filteredInferred = inferred.filter((i) => !explicitKeys.has(i.description.toLowerCase().split(" (")[0]));

  return [...explicit, ...filteredInferred].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

// ── Confidence scoring ───────────────────────────────────────────────

async function computeConfidence(
  businessId: string,
  monthsWithData: number,
  outlierCount: number,
  scenarioCount: number,
): Promise<{ confidence: Confidence; score: number; warnings: string[] }> {
  const dq = await buildDataConfidence(businessId);
  const warnings: string[] = [...dq.warnings];

  // Months-with-data is the primary determinant of forecast
  // confidence — same rule across every baseline path (predefined,
  // YTD, last_year, custom). The data-quality components from
  // dataConfidence still contribute warnings, but the score itself
  // anchors on the band the user's selected baseline lands in:
  //
  //   ≤ 6 months  → low    (50/100)
  //   7-8 months  → medium (70/100)
  //   ≥ 9 months  → high   (90/100)
  //
  // Outlier and scenario penalties apply on top of the band score so
  // a noisy baseline can still drop further inside its band.
  let score =
    monthsWithData >= 9 ? 90 :
    monthsWithData >= 7 ? 70 :
                          50;

  if (outlierCount > 0) {
    score -= 5 * Math.min(3, outlierCount);
    warnings.push(`${outlierCount} historical month${outlierCount === 1 ? " was" : "s were"} flagged as outliers — confidence reduced.`);
  }
  if (scenarioCount > 3) {
    score -= 5;
    warnings.push("More than 3 scenario assumptions stacked — projection complexity reduces confidence.");
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  // Display cap: forecasts are inherently uncertain, so we never
  // surface a perfect 100/100. Two rules per product intent:
  //   • Continuous cap at 98 — any score above that displays as 98.
  //   • Step-of-5 cap at 95 — when the raw score lands at exactly
  //     100, snap to 95 (the next multiple of 5 below) so the score
  //     stays consistent with bands that step in fives.
  if (score >= 100) score = 95;
  else if (score > 98) score = 98;
  // Thresholds aligned with the months-with-data bands so the
  // canonical 50/70/90 values land in low/medium/high exactly.
  // Outlier / scenario penalties may drop a score into a lower band
  // (e.g. 90 → 75 after 3 outliers becomes medium), which is intended.
  const confidence: Confidence =
    score >= 80 ? "high" : score >= 60 ? "medium" : "low";
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

  // Outlier-aware trend re-fit: refit the linear-growth slope after
  // removing flagged months, so a single outlier month doesn't drive
  // the projection. We only OVERRIDE the legacy baseline's growth
  // values when the difference is material — < 0.5% per month
  // difference isn't worth communicating.
  if (outliers.length > 0) {
    const flagged = new Set(outliers.map((o) => o.ym));
    const cleanRevenue  = monthlyHistory.filter((m) => !flagged.has(m.ym)).map((m) => m.income);
    const cleanExpenses = monthlyHistory.filter((m) => !flagged.has(m.ym)).map((m) => m.expenses);
    if (cleanRevenue.length >= 2) {
      const refittedRev = linearGrowthLocal(cleanRevenue);
      const refittedExp = linearGrowthLocal(cleanExpenses);
      // Mutate baseline's growth fields in-place (it's a local copy,
      // not persisted) so downstream summarizeForecast picks them up.
      const oldRev = baseline.revenueGrowthMoM;
      const oldExp = baseline.expenseGrowthMoM;
      baseline.revenueGrowthMoM = refittedRev;
      baseline.expenseGrowthMoM = refittedExp;
      // Note in the explanation when refit shifted growth meaningfully.
      if (Math.abs(oldRev - refittedRev) > 0.005 || Math.abs(oldExp - refittedExp) > 0.005) {
        outliers.push({
          ym: "trend_refit",
          metric: "expense",
          reason: `Growth slopes re-fit excluding outlier months: revenue ${(oldRev * 100).toFixed(1)}% → ${(refittedRev * 100).toFixed(1)}% MoM, expenses ${(oldExp * 100).toFixed(1)}% → ${(refittedExp * 100).toFixed(1)}% MoM.`,
        });
      }
    }
  }
  const recurring = await detectRecurring(businessId, resolved.fromYM, resolved.toYM);

  // Seasonality: 12+ months of data required. We compute a per-
  // calendar-month multiplier for revenue and expenses, then apply
  // those multipliers in-place on `projectedMonths`. A multiplier of
  // 1.0 means "matches the trailing average"; 1.2 means "this month
  // historically runs 20% above average". Multipliers cap at ±25% so
  // a single noisy month can't blow up the projection.
  const seasonalityApplied = resolved.monthsResolved >= 12;
  let seasonalityNote = seasonalityApplied
    ? "Seasonality applied based on historical monthly behavior."
    : "Seasonality was not applied because there is not enough historical data (12+ months required).";

  if (seasonalityApplied) {
    const revByMonth = new Map<number, number[]>();
    const expByMonth = new Map<number, number[]>();
    for (const m of monthlyHistory) {
      const monthIdx = Number(m.ym.split("-")[1]);
      (revByMonth.get(monthIdx) ?? revByMonth.set(monthIdx, []).get(monthIdx)!).push(m.income);
      (expByMonth.get(monthIdx) ?? expByMonth.set(monthIdx, []).get(monthIdx)!).push(m.expenses);
    }
    const meanRev = monthlyHistory.reduce((s, m) => s + m.income, 0) / Math.max(1, monthlyHistory.length);
    const meanExp = monthlyHistory.reduce((s, m) => s + m.expenses, 0) / Math.max(1, monthlyHistory.length);
    const revMult = new Map<number, number>();
    const expMult = new Map<number, number>();
    for (let i = 1; i <= 12; i++) {
      const r = revByMonth.get(i);
      const e = expByMonth.get(i);
      const rMean = r && r.length ? r.reduce((s, v) => s + v, 0) / r.length : meanRev;
      const eMean = e && e.length ? e.reduce((s, v) => s + v, 0) / e.length : meanExp;
      revMult.set(i, clamp(meanRev > 0 ? rMean / meanRev : 1, 0.75, 1.25));
      expMult.set(i, clamp(meanExp > 0 ? eMean / meanExp : 1, 0.75, 1.25));
    }
    // Apply to each projected month.
    for (const pm of projectedMonths) {
      const monthIdx = Number(pm.ym.split("-")[1]);
      const rm = revMult.get(monthIdx) ?? 1;
      const em = expMult.get(monthIdx) ?? 1;
      pm.baselineRevenue  *= rm;
      pm.scenarioRevenue  *= rm;
      pm.baselineExpenses *= em;
      pm.scenarioExpenses *= em;
      pm.baselineNet      = pm.baselineRevenue  - pm.baselineExpenses;
      pm.scenarioNet      = pm.scenarioRevenue  - pm.scenarioExpenses;
    }
    // Surface the strongest seasonality month in the note so users
    // know it was material.
    const strongestRev = [...revMult.entries()].sort((a, b) => Math.abs(b[1] - 1) - Math.abs(a[1] - 1))[0];
    if (strongestRev && Math.abs(strongestRev[1] - 1) > 0.05) {
      const monthName = new Date(Date.UTC(2024, strongestRev[0] - 1, 1)).toLocaleString("en-US", { month: "long" });
      const pct = ((strongestRev[1] - 1) * 100).toFixed(0);
      seasonalityNote = `Seasonality applied: ${monthName} historically runs ${strongestRev[1] >= 1 ? "+" : ""}${pct}% versus the trailing average; other months adjusted proportionally.`;
    }
  }

  // Confidence is anchored on months WITH actual data inside the
  // selected baseline window — not the calendar span. A YTD baseline
  // that resolves to 5 calendar months but only has 3 months of
  // uploaded transactions counts as 3 for confidence purposes.
  const monthsWithData = monthlyHistory.filter(
    (m) => Math.abs(m.income) > 0 || Math.abs(m.expenses) > 0,
  ).length;
  const { confidence, score, warnings } = await computeConfidence(
    businessId, monthsWithData, outliers.length, assumptions.length,
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
    `Forecast confidence: ${confidence.toUpperCase()} (${score}/100), based on ${monthsWithData} month${monthsWithData === 1 ? "" : "s"} of validated data inside the selected window.`,
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
      monthsWithData,
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

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

// Local copy of the linear-fit growth helper used for outlier-aware
// trend refit. Same formula as forecast.ts's `linearGrowth` —
// duplicated here so we don't expose internals.
function linearGrowthLocal(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  if (Math.abs(mean) < 1) return 0;
  // y = a + b*x → slope b via least squares on x = 0..n-1
  let sxy = 0, sxx = 0;
  const xMean = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    sxy += (i - xMean) * (values[i]! - mean);
    sxx += (i - xMean) * (i - xMean);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return slope / mean;
}
