// Forecast engine.
//
// Three layers:
//  - buildForecast(): per-month projection out to N months (1..60). Trailing-3-month
//    average for income/recurring expenses, employee schedule for payroll, manual
//    items applied at their monthsAhead. Optional annual growth rate for income.
//  - aggregateByQuarter(): collapse monthly forecast into quarter-buckets for display.
//  - aggregateByYear(): collapse into year-buckets.
//
// The page picks the right granularity based on the chosen horizon.

import { prisma } from "./db";
import { buildMonthSnapshot, activeEmployeeCost, type MonthBuckets } from "./metrics";
import { shiftYM, todayYM, fmtMoney as _fmtMoney } from "./format";

export type ForecastMonth = {
  ym: string;
  expectedIncome: number;
  expectedExpenses: number;
  expectedPayroll: number;
  expectedNet: number;
  notes: string[];
};

export type ForecastBucket = {
  label: string;            // e.g. "2026 Q3" or "2027"
  ym: string;               // first YM of the bucket
  expectedIncome: number;
  expectedExpenses: number;
  expectedPayroll: number;
  expectedNet: number;
  cumulativeNet: number;
  notes: string[];
};

export type BuildForecastOptions = {
  monthsAhead?: number;      // default 3
  annualGrowthRate?: number; // 0..1, applied to income only. default 0.
};

export const HORIZON_OPTIONS: { value: string; label: string; months: number }[] = [
  { value: "quarter", label: "Quarter (3 months)", months: 3 },
  { value: "year",    label: "Year (12 months)",   months: 12 },
  { value: "2y",      label: "2 years",            months: 24 },
  { value: "3y",      label: "3 years",            months: 36 },
  { value: "5y",      label: "5 years",            months: 60 },
];

export function horizonByValue(value: string | undefined): typeof HORIZON_OPTIONS[number] {
  return HORIZON_OPTIONS.find((h) => h.value === value) ?? HORIZON_OPTIONS[0];
}

export async function buildForecast(
  businessId: string,
  monthsAheadOrOpts: number | BuildForecastOptions = 3,
): Promise<ForecastMonth[]> {
  const opts: BuildForecastOptions =
    typeof monthsAheadOrOpts === "number"
      ? { monthsAhead: monthsAheadOrOpts }
      : monthsAheadOrOpts;
  const monthsAhead = Math.max(1, Math.min(60, opts.monthsAhead ?? 3));
  const annualGrowthRate = opts.annualGrowthRate ?? 0;

  const baseYM = todayYM();

  // Trailing 3 months for income / recurring (non-payroll) expenses.
  const lookback: { income: number; recurring: number }[] = [];
  for (let i = 1; i <= 3; i++) {
    const snap = await buildMonthSnapshot(businessId, shiftYM(baseYM, -i));
    lookback.push({
      income: snap.income,
      recurring: snap.fixed + snap.variable + snap.fees + snap.taxes,
    });
  }
  const avg = (key: "income" | "recurring") => {
    const nz = lookback.filter((m) => m[key] > 0);
    if (nz.length === 0) return 0;
    return nz.reduce((s, m) => s + m[key], 0) / nz.length;
  };
  const baseIncome = avg("income");
  const baseRecurring = avg("recurring");

  // Manual items keyed by monthsAhead — single query.
  const manuals = await prisma.forecastItem.findMany({
    where: { businessId, monthsAhead: { gte: 1, lte: monthsAhead } },
  });
  const manualByMonth = new Map<number, typeof manuals>();
  for (const m of manuals) {
    const list = manualByMonth.get(m.monthsAhead) ?? [];
    list.push(m);
    manualByMonth.set(m.monthsAhead, list);
  }

  const monthlyGrowth = annualGrowthRate > 0 ? Math.pow(1 + annualGrowthRate, 1 / 12) - 1 : 0;

  const out: ForecastMonth[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const ym = shiftYM(baseYM, i);
    const payroll = await activeEmployeeCost(businessId, ym);
    const monthManuals = manualByMonth.get(i) ?? [];
    let manualIncome = 0;
    let manualExpense = 0;
    const notes: string[] = [];
    for (const m of monthManuals) {
      if (m.kind === "income") {
        manualIncome += m.amount;
        notes.push(`+${m.label}`);
      } else {
        manualExpense += m.amount;
        notes.push(`−${m.label}`);
      }
    }
    if (payroll.oneTime > 0) notes.push(`one-time payroll: ${payroll.oneTime.toFixed(0)}`);
    if (payroll.employeeCount === 0 && payroll.recurring === 0 && i === 1) {
      notes.push("no active employees on record");
    }

    const growthFactor = monthlyGrowth > 0 ? Math.pow(1 + monthlyGrowth, i) : 1;
    const expectedIncome = baseIncome * growthFactor + manualIncome;
    const expectedExpenses = baseRecurring + payroll.total + manualExpense;
    out.push({
      ym,
      expectedIncome,
      expectedExpenses,
      expectedPayroll: payroll.total,
      expectedNet: expectedIncome - expectedExpenses,
      notes,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bucket aggregation for display
// ─────────────────────────────────────────────────────────────────────────────

function ymToParts(ym: string): { year: number; month: number } {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

export function aggregateByMonth(months: ForecastMonth[]): ForecastBucket[] {
  let cum = 0;
  return months.map((m) => {
    cum += m.expectedNet;
    const { year, month } = ymToParts(m.ym);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return {
      label: date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
      ym: m.ym,
      expectedIncome: m.expectedIncome,
      expectedExpenses: m.expectedExpenses,
      expectedPayroll: m.expectedPayroll,
      expectedNet: m.expectedNet,
      cumulativeNet: cum,
      notes: m.notes,
    };
  });
}

export function aggregateByQuarter(months: ForecastMonth[]): ForecastBucket[] {
  const out: ForecastBucket[] = [];
  let cur: ForecastBucket | null = null;
  let cum = 0;
  for (const m of months) {
    const { year, month } = ymToParts(m.ym);
    const q = Math.ceil(month / 3);
    const key = `${year}-Q${q}`;
    if (!cur || cur.label !== `${year} Q${q}`) {
      if (cur) {
        cum += cur.expectedNet;
        cur.cumulativeNet = cum;
        out.push(cur);
      }
      cur = {
        label: `${year} Q${q}`,
        ym: m.ym,
        expectedIncome: 0,
        expectedExpenses: 0,
        expectedPayroll: 0,
        expectedNet: 0,
        cumulativeNet: 0,
        notes: [],
      };
    }
    cur.expectedIncome += m.expectedIncome;
    cur.expectedExpenses += m.expectedExpenses;
    cur.expectedPayroll += m.expectedPayroll;
    cur.expectedNet += m.expectedNet;
    cur.notes.push(...m.notes);
    void key;
  }
  if (cur) {
    cum += cur.expectedNet;
    cur.cumulativeNet = cum;
    out.push(cur);
  }
  return out;
}

export function aggregateByYear(months: ForecastMonth[]): ForecastBucket[] {
  const out: ForecastBucket[] = [];
  let cur: ForecastBucket | null = null;
  let cum = 0;
  for (const m of months) {
    const { year } = ymToParts(m.ym);
    if (!cur || cur.label !== String(year)) {
      if (cur) {
        cum += cur.expectedNet;
        cur.cumulativeNet = cum;
        out.push(cur);
      }
      cur = {
        label: String(year),
        ym: m.ym,
        expectedIncome: 0,
        expectedExpenses: 0,
        expectedPayroll: 0,
        expectedNet: 0,
        cumulativeNet: 0,
        notes: [],
      };
    }
    cur.expectedIncome += m.expectedIncome;
    cur.expectedExpenses += m.expectedExpenses;
    cur.expectedPayroll += m.expectedPayroll;
    cur.expectedNet += m.expectedNet;
    cur.notes.push(...m.notes);
  }
  if (cur) {
    cum += cur.expectedNet;
    cur.cumulativeNet = cum;
    out.push(cur);
  }
  return out;
}

// Granularity choice for a given horizon: quarter ≤ 12 months → monthly,
// 13..36 → quarterly, > 36 → yearly.
export function bucketForHorizon(months: ForecastMonth[]): {
  granularity: "month" | "quarter" | "year";
  buckets: ForecastBucket[];
} {
  if (months.length <= 12) return { granularity: "month", buckets: aggregateByMonth(months) };
  if (months.length <= 36) return { granularity: "quarter", buckets: aggregateByQuarter(months) };
  return { granularity: "year", buckets: aggregateByYear(months) };
}

// ═════════════════════════════════════════════════════════════════════════════
// Scenario forecast engine (Baseline vs Scenario)
// ═════════════════════════════════════════════════════════════════════════════
//
// loadBaseline()       — averages + trend + recurring base from a historical window
// runScenario()        — applies an array of assumptions to the baseline projection
// summarizeForecast()  — totals for the summary cards
// generateForecastInsights() — plain-English insights comparing the two
//
// The shapes intentionally match the spec in the product brief: a "baseline"
// line (business as-is) vs a "scenario" line (with user assumptions on top).

export const HISTORICAL_PERIOD_OPTIONS = [
  { value: "3m",        label: "Last 3 months",      months: 3 },
  { value: "6m",        label: "Last 6 months",      months: 6 },
  { value: "12m",       label: "Last 12 months",     months: 12 },
  { value: "ytd",       label: "Year to date",       months: 0 }, // resolved at runtime
  { value: "last_year", label: "Last year",          months: 0 }, // resolved at runtime
  { value: "custom",    label: "Custom range",       months: 0 },
] as const;

export type HistoricalPeriodValue = (typeof HISTORICAL_PERIOD_OPTIONS)[number]["value"];

export const FORECAST_HORIZON_OPTIONS = [
  { value: "3m",  label: "Next 3 months",  months: 3 },
  { value: "6m",  label: "Next 6 months",  months: 6 },
  { value: "12m", label: "Next 12 months", months: 12 },
  { value: "24m", label: "Next 24 months", months: 24 },
  { value: "36m", label: "Next 36 months", months: 36 },
  { value: "60m", label: "Next 60 months", months: 60 },
] as const;

export type ForecastHorizonValue = (typeof FORECAST_HORIZON_OPTIONS)[number]["value"];

// Historical windows always END at the last *completed* month — never the
// current calendar month, because that month is still in progress and any
// partial data would skew the averages downward. So in mid-May, the anchor
// is April; "Last 3 months" = Feb-Apr, "YTD" = Jan-Apr.
function lastCompleteYM(): string {
  return shiftYM(todayYM(), -1);
}

export function resolveHistoricalRange(
  value: HistoricalPeriodValue,
  customFrom?: string, // YYYY-MM
  customTo?: string,
): { fromYM: string; toYM: string; monthCount: number; label: string } {
  const anchor = lastCompleteYM();
  if (value === "custom" && customFrom && customTo) {
    const a = customFrom <= customTo ? customFrom : customTo;
    let b = customFrom <= customTo ? customTo : customFrom;
    // Never let the historical window run into an in-progress month.
    if (b > anchor) b = anchor;
    return {
      fromYM: a,
      toYM: b,
      monthCount: monthsBetween(a, b),
      label: `${a} → ${b}`,
    };
  }
  if (value === "ytd") {
    const [y] = anchor.split("-");
    const fromYM = `${y}-01`;
    return {
      fromYM,
      toYM: anchor,
      monthCount: monthsBetween(fromYM, anchor),
      label: `${y} YTD`,
    };
  }
  if (value === "last_year") {
    const [yStr] = anchor.split("-");
    const prevY = Number(yStr) - 1;
    const fromYM = `${prevY}-01`;
    const toYM = `${prevY}-12`;
    return {
      fromYM,
      toYM,
      monthCount: 12,
      label: `${prevY}`,
    };
  }
  const opt = HISTORICAL_PERIOD_OPTIONS.find((o) => o.value === value);
  const months = opt?.months ?? 6;
  const fromYM = shiftYM(anchor, -(months - 1));
  return {
    fromYM,
    toYM: anchor,
    monthCount: months,
    label: opt?.label ?? "Last 6 months",
  };
}

export function horizonByForecastValue(
  value: string | undefined,
): (typeof FORECAST_HORIZON_OPTIONS)[number] {
  return FORECAST_HORIZON_OPTIONS.find((h) => h.value === value) ?? FORECAST_HORIZON_OPTIONS[2];
}

function monthsBetween(fromYM: string, toYM: string): number {
  const [fy, fm] = fromYM.split("-").map(Number);
  const [ty, tm] = toYM.split("-").map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

// Historical averages + simple trend, used as the "business as-is" baseline.
export type Baseline = {
  fromYM: string;
  toYM: string;
  monthCount: number;
  label: string;
  avgRevenue: number;
  avgExpenses: number;
  avgNet: number;
  avgPayroll: number;
  avgMarketing: number;
  avgFixed: number;
  avgVariable: number;
  avgFees: number;
  avgTaxes: number;
  avgOneTime: number;
  // simple linear-fit monthly growth in revenue across the window (as a
  // fraction, e.g. 0.012 = +1.2%/month). 0 if not enough data.
  revenueGrowthMoM: number;
  expenseGrowthMoM: number;
  // a "recurring expense base" — the average minus one-time spikes.
  recurringExpenseBase: number;
};

export async function loadBaseline(
  businessId: string,
  fromYM: string,
  toYM: string,
  label: string,
): Promise<Baseline> {
  const snaps: { ym: string; snap: MonthBuckets }[] = [];
  let ym = fromYM;
  let guard = 0;
  while (ym <= toYM && guard < 240) {
    const snap = await buildMonthSnapshot(businessId, ym);
    snaps.push({ ym, snap });
    ym = shiftYM(ym, 1);
    guard++;
  }
  const n = Math.max(snaps.length, 1);
  const sum = snaps.reduce(
    (a, { snap }) => ({
      income: a.income + snap.income,
      expenses: a.expenses + snap.expenses,
      payroll: a.payroll + snap.payroll,
      marketing: a.marketing + snap.marketing,
      fixed: a.fixed + snap.fixed,
      variable: a.variable + snap.variable,
      fees: a.fees + snap.fees,
      taxes: a.taxes + snap.taxes,
      oneTime: a.oneTime + snap.oneTime,
    }),
    {
      income: 0, expenses: 0, payroll: 0, marketing: 0,
      fixed: 0, variable: 0, fees: 0, taxes: 0, oneTime: 0,
    },
  );
  const avgRevenue = sum.income / n;
  const avgExpenses = sum.expenses / n;
  return {
    fromYM, toYM, monthCount: snaps.length, label,
    avgRevenue,
    avgExpenses,
    avgNet: avgRevenue - avgExpenses,
    avgPayroll: sum.payroll / n,
    avgMarketing: sum.marketing / n,
    avgFixed: sum.fixed / n,
    avgVariable: sum.variable / n,
    avgFees: sum.fees / n,
    avgTaxes: sum.taxes / n,
    avgOneTime: sum.oneTime / n,
    revenueGrowthMoM: linearGrowth(snaps.map((s) => s.snap.income)),
    expenseGrowthMoM: linearGrowth(snaps.map((s) => s.snap.expenses)),
    recurringExpenseBase: Math.max(0, avgExpenses - sum.oneTime / n),
  };
}

// Fits y = a + b*x and returns b/mean(y) (relative monthly growth). Defensive
// against tiny windows (returns 0 if < 2 points or mean ≈ 0).
function linearGrowth(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  if (mean < 1) return 0;
  let num = 0;
  let den = 0;
  const xMean = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (values[i] - mean);
    den += dx * dx;
  }
  if (den === 0) return 0;
  const slope = num / den;
  return slope / mean;
}

export type Assumption = {
  id: string;
  family: "revenue" | "expense" | "payroll" | string;
  type: string;
  label: string;
  category?: string | null;
  amount: number;
  percentage: number;
  startMonth: number;
  endMonth: number | null;
  isRecurring: boolean;
  notes?: string | null;
};

export type ForecastPoint = {
  ym: string;
  index: number;             // 1-based forecast month index
  baselineRevenue: number;
  baselineExpenses: number;
  baselinePayroll: number;
  baselineNet: number;
  scenarioRevenue: number;
  scenarioExpenses: number;
  scenarioPayroll: number;
  scenarioNet: number;
  notes: string[];
};

// Builds both the baseline projection AND the scenario projection over
// `monthsAhead`. Baseline = pure trend extrapolation of the historical window.
// Scenario = baseline + every assumption applied per its rules.
export function runScenario(
  baseline: Baseline,
  monthsAhead: number,
  assumptions: Assumption[],
): ForecastPoint[] {
  // Forecast starts at the current calendar month (e.g. May when we're in
  // May) and runs forward N months. Historical baseline ends the month
  // before, so the chart picks up exactly where the past leaves off.
  const startYM = todayYM();
  const points: ForecastPoint[] = [];
  // Cap trend extrapolation so we don't compound into absurd territory for
  // long horizons.
  const cappedRevGrowth = clamp(baseline.revenueGrowthMoM, -0.05, 0.05);
  const cappedExpGrowth = clamp(baseline.expenseGrowthMoM, -0.05, 0.05);
  for (let i = 1; i <= monthsAhead; i++) {
    const ym = shiftYM(startYM, i - 1);
    const revFactor = Math.pow(1 + cappedRevGrowth, i);
    const expFactor = Math.pow(1 + cappedExpGrowth, i);
    const baselineRevenue = baseline.avgRevenue * revFactor;
    const baselineExpenses = baseline.recurringExpenseBase * expFactor + baseline.avgPayroll;
    const baselinePayroll = baseline.avgPayroll;
    const baselineNet = baselineRevenue - baselineExpenses;

    let scRevenue = baselineRevenue;
    let scExpenses = baselineExpenses;
    let scPayroll = baselinePayroll;
    const notes: string[] = [];

    for (const a of assumptions) {
      const active = i >= a.startMonth && (a.endMonth == null || i <= a.endMonth);
      if (!active) continue;
      const oneTimeMonth = !a.isRecurring && i === a.startMonth;
      const hit = a.isRecurring || oneTimeMonth;
      if (!hit) continue;

      const pctOnRevenue = a.percentage * scRevenue;
      const pctOnExpenses = a.percentage * scExpenses;

      switch (a.type) {
        // ── Revenue ─────────────────────────────────────────────────────
        case "revenue_growth":
          scRevenue += pctOnRevenue;
          notes.push(`+${(a.percentage * 100).toFixed(0)}% revenue`);
          break;
        case "revenue_decline":
          scRevenue -= pctOnRevenue;
          notes.push(`−${(a.percentage * 100).toFixed(0)}% revenue`);
          break;
        case "new_recurring_revenue":
        case "one_time_revenue":
          scRevenue += a.amount;
          notes.push(`+${a.label}`);
          break;
        case "lose_recurring_revenue":
          scRevenue -= a.amount;
          notes.push(`−${a.label}`);
          break;
        // ── Payroll ─────────────────────────────────────────────────────
        case "hire":
        case "contractor_add":
          scPayroll += a.amount;
          scExpenses += a.amount;
          notes.push(`hire ${a.label}`);
          break;
        case "terminate":
        case "contractor_remove":
          scPayroll -= a.amount;
          scExpenses -= a.amount;
          notes.push(`end ${a.label}`);
          break;
        case "salary_increase":
          scPayroll += a.amount;
          scExpenses += a.amount;
          notes.push(`raise ${a.label}`);
          break;
        case "salary_increase_overall": {
          // Overall raise applies to the whole roster. Two flavors:
          //   - percentage: scaled against the historical payroll baseline
          //   - flat amount: added wholesale every active month
          // Whichever is non-zero takes effect; if both, the percent wins.
          const delta = a.percentage > 0
            ? baseline.avgPayroll * a.percentage
            : a.amount;
          scPayroll += delta;
          scExpenses += delta;
          notes.push(a.label || `overall raise +${(a.percentage * 100).toFixed(1)}%`);
          break;
        }
        case "bonus":
          if (oneTimeMonth || a.isRecurring) {
            scPayroll += a.amount;
            scExpenses += a.amount;
            notes.push(`bonus ${a.label}`);
          }
          break;
        // ── Expense ─────────────────────────────────────────────────────
        case "expense_growth":
          scExpenses += pctOnExpenses;
          notes.push(`+${(a.percentage * 100).toFixed(0)}% expenses`);
          break;
        case "expense_decline":
          scExpenses -= pctOnExpenses;
          notes.push(`−${(a.percentage * 100).toFixed(0)}% expenses`);
          break;
        case "marketing_change":
        case "software_change":
        case "rent_increase":
          // amount is the monthly delta (positive = more spend, negative = less).
          scExpenses += a.amount;
          if (a.amount >= 0) notes.push(`+${a.label}`);
          else notes.push(`cut ${a.label}`);
          break;
        case "one_time_expense":
          scExpenses += a.amount;
          notes.push(`one-time ${a.label}`);
          break;
        case "remove_recurring":
          scExpenses -= a.amount;
          notes.push(`remove ${a.label}`);
          break;
        case "custom":
        default:
          // Custom: amount is signed and applied to revenue/expenses by family.
          if (a.family === "revenue") {
            scRevenue += a.amount;
          } else if (a.family === "payroll") {
            scPayroll += a.amount;
            scExpenses += a.amount;
          } else {
            scExpenses += a.amount;
          }
          notes.push(a.label);
          break;
      }
    }

    points.push({
      ym,
      index: i,
      baselineRevenue,
      baselineExpenses,
      baselinePayroll,
      baselineNet,
      scenarioRevenue: scRevenue,
      scenarioExpenses: scExpenses,
      scenarioPayroll: scPayroll,
      scenarioNet: scRevenue - scExpenses,
      notes,
    });
  }
  return points;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export type ForecastSummary = {
  baselineRevenueTotal: number;
  baselineExpensesTotal: number;
  baselineNetTotal: number;
  scenarioRevenueTotal: number;
  scenarioExpensesTotal: number;
  scenarioNetTotal: number;
  scenarioAvgMonthlyNet: number;
  scenarioCumulativeNet: number;
  scenarioRunwayMonths: number | null; // null when net is positive or no cash
};

export function summarizeForecast(
  points: ForecastPoint[],
  startingCash = 0,
): ForecastSummary {
  const out: ForecastSummary = {
    baselineRevenueTotal: 0,
    baselineExpensesTotal: 0,
    baselineNetTotal: 0,
    scenarioRevenueTotal: 0,
    scenarioExpensesTotal: 0,
    scenarioNetTotal: 0,
    scenarioAvgMonthlyNet: 0,
    scenarioCumulativeNet: 0,
    scenarioRunwayMonths: null,
  };
  let cash = startingCash;
  let runway: number | null = null;
  for (const p of points) {
    out.baselineRevenueTotal += p.baselineRevenue;
    out.baselineExpensesTotal += p.baselineExpenses;
    out.baselineNetTotal += p.baselineNet;
    out.scenarioRevenueTotal += p.scenarioRevenue;
    out.scenarioExpensesTotal += p.scenarioExpenses;
    out.scenarioNetTotal += p.scenarioNet;
    cash += p.scenarioNet;
    if (runway == null && startingCash > 0 && cash < 0) runway = p.index;
  }
  out.scenarioCumulativeNet = out.scenarioNetTotal;
  out.scenarioAvgMonthlyNet = out.scenarioNetTotal / Math.max(points.length, 1);
  out.scenarioRunwayMonths = runway;
  return out;
}

export function generateForecastInsights(
  baseline: Baseline,
  points: ForecastPoint[],
  assumptions: Assumption[],
  currency = "USD",
): string[] {
  const out: string[] = [];
  const months = points.length;
  if (months === 0) return out;

  // Baseline trend insight.
  const annualGrowth = baseline.revenueGrowthMoM * 12;
  if (Math.abs(annualGrowth) > 0.005) {
    out.push(
      `Based on the last ${baseline.monthCount} month${baseline.monthCount === 1 ? "" : "s"}, ` +
      `revenue is projected to ${annualGrowth >= 0 ? "grow" : "decline"} ` +
      `${(Math.abs(annualGrowth) * 100).toFixed(1)}% over the next year.`,
    );
  } else if (baseline.avgRevenue > 0) {
    out.push(
      `Based on the last ${baseline.monthCount} month${baseline.monthCount === 1 ? "" : "s"}, ` +
      `revenue is flat — no meaningful trend detected.`,
    );
  }

  // Baseline vs scenario monthly delta.
  const baselineMonthlyNet = points.reduce((s, p) => s + p.baselineNet, 0) / months;
  const scenarioMonthlyNet = points.reduce((s, p) => s + p.scenarioNet, 0) / months;
  const monthlyDelta = scenarioMonthlyNet - baselineMonthlyNet;
  if (Math.abs(monthlyDelta) > 1) {
    const direction = monthlyDelta >= 0 ? "improves" : "worsens";
    out.push(
      `Scenario forecast ${direction} profitability by ${_fmtMoney(Math.abs(monthlyDelta), currency)} per month compared to baseline.`,
    );
  }

  // Per-assumption impact — only show the biggest absolute hitters.
  const ranked = [...assumptions]
    .map((a) => ({ a, mag: estimateAssumptionAnnualImpact(a) }))
    .filter((x) => Math.abs(x.mag) > 1)
    .sort((x, y) => Math.abs(y.mag) - Math.abs(x.mag))
    .slice(0, 3);
  for (const { a, mag } of ranked) {
    const direction = mag >= 0 ? "increases" : "reduces";
    out.push(
      `${displayAssumption(a)} ${direction} projected annual profit by ${_fmtMoney(Math.abs(mag), currency)}.`,
    );
  }

  // One-time exclusion note.
  if (baseline.avgOneTime > 0) {
    out.push(
      `One-time expenses in the selected historical period were excluded from the recurring baseline.`,
    );
  }

  // Total scenario net.
  const totalScenarioNet = points.reduce((s, p) => s + p.scenarioNet, 0);
  if (months >= 3) {
    out.push(
      `Over the next ${months} months, projected scenario net is ${_fmtMoney(totalScenarioNet, currency)}.`,
    );
  }

  return out;
}

function displayAssumption(a: Assumption): string {
  switch (a.type) {
    case "hire":             return `Hiring ${a.label}`;
    case "terminate":        return `Terminating ${a.label}`;
    case "salary_increase":  return `Salary increase for ${a.label}`;
    case "salary_increase_overall": return a.percentage > 0
      ? `Overall salary increase of ${(a.percentage * 100).toFixed(1)}%`
      : `Overall salary increase of ${a.label}`;
    case "bonus":            return `Bonus for ${a.label}`;
    case "contractor_add":   return `Adding contractor ${a.label}`;
    case "contractor_remove":return `Removing contractor ${a.label}`;
    case "revenue_growth":   return `${(a.percentage * 100).toFixed(0)}% revenue growth`;
    case "revenue_decline":  return `${(a.percentage * 100).toFixed(0)}% revenue decline`;
    case "new_recurring_revenue": return `New recurring revenue (${a.label})`;
    case "one_time_revenue": return `One-time revenue (${a.label})`;
    case "lose_recurring_revenue": return `Lost revenue (${a.label})`;
    case "expense_growth":   return `${(a.percentage * 100).toFixed(0)}% expense growth`;
    case "expense_decline":  return `${(a.percentage * 100).toFixed(0)}% expense decline`;
    case "marketing_change": return `Marketing change (${a.label})`;
    case "software_change":  return `Software cost change (${a.label})`;
    case "rent_increase":    return `Rent change (${a.label})`;
    case "one_time_expense": return `One-time expense (${a.label})`;
    case "remove_recurring": return `Removing recurring expense (${a.label})`;
    default:                 return a.label;
  }
}

function estimateAssumptionAnnualImpact(a: Assumption): number {
  // Annualized $ impact on net (positive = better profit, negative = worse).
  // Used purely for ranking insights, not for the actual forecast math.
  const months = a.isRecurring ? 12 : 1;
  switch (a.type) {
    case "hire":
    case "contractor_add":
    case "salary_increase":
      return -a.amount * months;
    case "salary_increase_overall":
      // Both legs of the overall raise hurt profit by `amount × months`.
      // When stored as a percent we don't know the dollar value here
      // (engine reconstructs it against baseline.avgPayroll) — return 0
      // so the ranking falls back to other signals.
      return -a.amount * months;
    case "terminate":
    case "contractor_remove":
    case "remove_recurring":
      return a.amount * months;
    case "bonus":
    case "one_time_expense":
      return -a.amount;
    case "one_time_revenue":
      return a.amount;
    case "new_recurring_revenue":
      return a.amount * months;
    case "lose_recurring_revenue":
      return -a.amount * months;
    case "marketing_change":
    case "software_change":
    case "rent_increase":
      return -a.amount * months;
    case "revenue_growth":
      return 0; // depends on revenue, handled in chart, skip ranking
    case "revenue_decline":
      return 0;
    case "expense_growth":
      return 0;
    case "expense_decline":
      return 0;
    default:
      if (a.family === "revenue") return a.amount * months;
      return -a.amount * months;
  }
}

