// Dashboard period resolution + aggregation.
//
// resolveDashboardRange  → translate a high-level range (this_month, last_year,
//                          custom...) into concrete fromYM/toYM strings, plus
//                          the matching "prior period" range for delta math.
// buildPeriodAggregate   → sum all MonthBuckets fields across a YM range and
//                          aggregate top categories over the same window.

import { buildMonthSnapshot, type MonthBuckets } from "./metrics";
import { dateToYM, shiftYM, todayYM, ymToLabel } from "./format";

export type DashboardRange =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export const DASHBOARD_RANGE_LABEL: Record<DashboardRange, string> = {
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  last_quarter: "Last quarter",
  this_year: "This year",
  last_year: "Last year",
  custom: "Custom",
};

export type ResolvedRange = {
  range: DashboardRange;
  fromYM: string;
  toYM: string;
  label: string;
  prevFromYM: string;
  prevToYM: string;
  prevLabel: string;
};

// Comparison mode chosen by the user. "none" leaves the dashboard with its
// default behaviour (subtitle deltas vs the immediately-prior period only,
// no extra columns). The other modes drive an explicit comparison column on
// the P&L breakdown and re-anchor the stat-tile deltas.
export type CompareMode =
  | "none"
  | "previous"        // immediately-prior period of the same length
  | "last_year"       // same period one year earlier
  | "two_years_ago";  // same period two years earlier

export type ResolvedCompare = {
  fromYM: string;
  toYM: string;
  label: string;
};

function ymRangeLength(fromYM: string, toYM: string): number {
  // inclusive count
  let n = 0;
  let cur = fromYM;
  while (cur <= toYM && n < 240) {
    n++;
    cur = shiftYM(cur, 1);
  }
  return n;
}

function shiftRange(
  fromYM: string,
  toYM: string,
  monthsBack: number,
): { fromYM: string; toYM: string } {
  return {
    fromYM: shiftYM(fromYM, -monthsBack),
    toYM: shiftYM(toYM, -monthsBack),
  };
}

function rangeLabel(fromYM: string, toYM: string): string {
  if (fromYM === toYM) return ymToLabel(fromYM);
  return `${ymToLabel(fromYM)} – ${ymToLabel(toYM)}`;
}

export function resolveDashboardRange(
  range: DashboardRange,
  customStart?: string,
  customEnd?: string,
): ResolvedRange {
  const today = todayYM();
  const [yStr, mStr] = today.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  let fromYM: string;
  let toYM: string;
  let prevFromYM: string;
  let prevToYM: string;

  if (range === "this_month") {
    fromYM = today;
    toYM = today;
    ({ fromYM: prevFromYM, toYM: prevToYM } = shiftRange(fromYM, toYM, 1));
  } else if (range === "last_month") {
    fromYM = shiftYM(today, -1);
    toYM = fromYM;
    ({ fromYM: prevFromYM, toYM: prevToYM } = shiftRange(fromYM, toYM, 1));
  } else if (range === "this_quarter") {
    const q = Math.ceil(m / 3);
    const startM = (q - 1) * 3 + 1;
    fromYM = `${y}-${String(startM).padStart(2, "0")}`;
    toYM = `${y}-${String(startM + 2).padStart(2, "0")}`;
    ({ fromYM: prevFromYM, toYM: prevToYM } = shiftRange(fromYM, toYM, 3));
  } else if (range === "last_quarter") {
    // Previous calendar quarter, with handling for crossing the year boundary.
    const q = Math.ceil(m / 3);
    const prevQ = q - 1; // 0 = Q4 of prior year
    const lastQYear = prevQ === 0 ? y - 1 : y;
    const lastQNum = prevQ === 0 ? 4 : prevQ;
    const startM = (lastQNum - 1) * 3 + 1;
    fromYM = `${lastQYear}-${String(startM).padStart(2, "0")}`;
    toYM = `${lastQYear}-${String(startM + 2).padStart(2, "0")}`;
    ({ fromYM: prevFromYM, toYM: prevToYM } = shiftRange(fromYM, toYM, 3));
  } else if (range === "this_year") {
    fromYM = `${y}-01`;
    toYM = `${y}-12`;
    prevFromYM = `${y - 1}-01`;
    prevToYM = `${y - 1}-12`;
  } else if (range === "last_year") {
    fromYM = `${y - 1}-01`;
    toYM = `${y - 1}-12`;
    prevFromYM = `${y - 2}-01`;
    prevToYM = `${y - 2}-12`;
  } else {
    // custom
    const start = customStart ? new Date(customStart) : new Date();
    const end = customEnd ? new Date(customEnd) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      // fall back to this_month
      return resolveDashboardRange("this_month");
    }
    const sYM = dateToYM(start);
    const eYM = dateToYM(end);
    fromYM = sYM <= eYM ? sYM : eYM;
    toYM = sYM <= eYM ? eYM : sYM;
    const len = ymRangeLength(fromYM, toYM);
    ({ fromYM: prevFromYM, toYM: prevToYM } = shiftRange(fromYM, toYM, len));
  }

  return {
    range,
    fromYM,
    toYM,
    label: rangeLabel(fromYM, toYM),
    prevFromYM,
    prevToYM,
    prevLabel: rangeLabel(prevFromYM, prevToYM),
  };
}

// Translate a CompareMode into a concrete YM range relative to the user's
// primary period. Returns null for "none".
export function resolveCompareRange(
  primary: ResolvedRange,
  mode: CompareMode,
): ResolvedCompare | null {
  if (mode === "none") return null;
  if (mode === "previous") {
    return {
      fromYM: primary.prevFromYM,
      toYM: primary.prevToYM,
      label: primary.prevLabel,
    };
  }
  const monthsBack = mode === "last_year" ? 12 : 24;
  const fromYM = shiftYM(primary.fromYM, -monthsBack);
  const toYM = shiftYM(primary.toYM, -monthsBack);
  return { fromYM, toYM, label: rangeLabel(fromYM, toYM) };
}

// Sum MonthBuckets across an inclusive YM range.
export type PeriodAggregate = MonthBuckets & {
  fromYM: string;
  toYM: string;
  monthCount: number;
};

export async function buildPeriodAggregate(
  businessId: string,
  fromYM: string,
  toYM: string,
): Promise<PeriodAggregate> {
  const acc: PeriodAggregate = {
    income: 0,
    expenses: 0,
    fixed: 0,
    variable: 0,
    payroll: 0,
    marketing: 0,
    fees: 0,
    oneTime: 0,
    taxes: 0,
    netProfit: 0,
    normalizedProfit: 0,
    byCategory: {},
    fromYM,
    toYM,
    monthCount: 0,
  };
  let cur = fromYM;
  // Cap at 60 months to defend against weird custom ranges
  for (let i = 0; i < 60 && cur <= toYM; i++) {
    const snap = await buildMonthSnapshot(businessId, cur);
    acc.income += snap.income;
    acc.expenses += snap.expenses;
    acc.fixed += snap.fixed;
    acc.variable += snap.variable;
    acc.payroll += snap.payroll;
    acc.marketing += snap.marketing;
    acc.fees += snap.fees;
    acc.oneTime += snap.oneTime;
    acc.taxes += snap.taxes;
    for (const [k, v] of Object.entries(snap.byCategory)) {
      acc.byCategory[k] = (acc.byCategory[k] ?? 0) + v;
    }
    acc.monthCount++;
    cur = shiftYM(cur, 1);
  }
  acc.netProfit = acc.income - acc.expenses;
  acc.normalizedProfit = acc.netProfit + acc.oneTime;
  return acc;
}
