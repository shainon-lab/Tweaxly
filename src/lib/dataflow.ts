// Data Flow aggregation: builds a category × month grid for a chosen time window.
// Rule: once a category appears anywhere in history, it persists with 0 for
// every subsequent month (within the window) where no transactions exist.

import { prisma } from "./db";
import { dateToYM, shiftYM, todayYM } from "./format";

export type DataFlowRange =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "all"
  | "custom";

export type DataFlowGrid = {
  range: DataFlowRange;
  fromYM: string;
  toYM: string;
  months: string[];                                // YYYY-MM, ascending
  categories: { name: string; kind: string; firstYM: string }[];
  // cells[ym][category] = signed amount (income +, expense −).
  // Missing → category not yet introduced. 0 → introduced earlier, no data.
  cells: Record<string, Record<string, number | null>>;
  totalsByMonth: Record<string, { income: number; expense: number; net: number }>;
  totalsByCategory: Record<string, number>; // signed sum across the window
};

export function rangeToYMs(
  range: DataFlowRange,
  customStart?: string,
  customEnd?: string,
): { fromYM: string; toYM: string } {
  const today = todayYM();
  const [yStr, mStr] = today.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (range === "this_month") return { fromYM: today, toYM: today };
  if (range === "last_month") {
    const ym = shiftYM(today, -1);
    return { fromYM: ym, toYM: ym };
  }
  if (range === "this_quarter") {
    const q = Math.ceil(m / 3);
    const startM = (q - 1) * 3 + 1;
    const endM = startM + 2;
    return {
      fromYM: `${y}-${String(startM).padStart(2, "0")}`,
      toYM: `${y}-${String(endM).padStart(2, "0")}`,
    };
  }
  if (range === "last_quarter") {
    // Previous calendar quarter — wrap to last year's Q4 when the current
    // quarter is Q1.
    const q = Math.ceil(m / 3);
    const prevQ = q - 1; // 0 means Q4 of prior year
    const lastQYear = prevQ === 0 ? y - 1 : y;
    const lastQNum = prevQ === 0 ? 4 : prevQ;
    const startM = (lastQNum - 1) * 3 + 1;
    return {
      fromYM: `${lastQYear}-${String(startM).padStart(2, "0")}`,
      toYM: `${lastQYear}-${String(startM + 2).padStart(2, "0")}`,
    };
  }
  if (range === "this_year") return { fromYM: `${y}-01`, toYM: `${y}-12` };
  if (range === "last_year") return { fromYM: `${y - 1}-01`, toYM: `${y - 1}-12` };
  if (range === "custom") {
    // Convert ISO date strings to YM. Fall back to today if dates are invalid.
    const sd = customStart ? new Date(customStart) : new Date();
    const ed = customEnd ? new Date(customEnd) : new Date();
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return { fromYM: today, toYM: today };
    }
    const sYM = `${sd.getUTCFullYear()}-${String(sd.getUTCMonth() + 1).padStart(2, "0")}`;
    const eYM = `${ed.getUTCFullYear()}-${String(ed.getUTCMonth() + 1).padStart(2, "0")}`;
    // Always normalize so fromYM ≤ toYM
    return sYM <= eYM
      ? { fromYM: sYM, toYM: eYM }
      : { fromYM: eYM, toYM: sYM };
  }
  // all → caller will replace with earliest-known YM
  return { fromYM: "0000-00", toYM: today };
}

function ymBetween(a: string, b: string): string[] {
  // returns YYYY-MMs from a..b inclusive, ascending
  if (a === b) return [a];
  const out: string[] = [];
  let cur = a;
  for (let i = 0; i < 240; i++) {
    out.push(cur);
    if (cur === b) break;
    cur = shiftYM(cur, 1);
  }
  return out;
}

export async function buildDataFlow(
  businessId: string,
  range: DataFlowRange,
  categoryFilter: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<DataFlowGrid> {
  // Determine YM window
  let { fromYM, toYM } = rangeToYMs(range, customStart, customEnd);
  if (range === "all") {
    const earliest = await prisma.transaction.findFirst({
      where: { businessId },
      orderBy: { accountingMonth: "asc" },
      select: { accountingMonth: true },
    });
    fromYM = earliest?.accountingMonth ?? todayYM();
  }
  const grid = await buildDataFlowGrid(businessId, fromYM, toYM, categoryFilter);
  return { ...grid, range };
}

// Same grid builder as buildDataFlow but takes explicit fromYM/toYM. Used
// by the unified Reports page where the period is chosen via granularity +
// anchor instead of the DataFlowRange enum.
export async function buildDataFlowGrid(
  businessId: string,
  fromYM: string,
  toYM: string,
  categoryFilter: string | null,
): Promise<Omit<DataFlowGrid, "range">> {
  const months = ymBetween(fromYM, toYM);

  // Pull all transactions ever, grouped by category & accountingMonth.
  // We need history before the window to compute "firstYM" per category.
  const all = await prisma.transaction.findMany({
    where: {
      businessId,
      isExcludedFromPnl: false,
    },
    include: { category: true },
  });

  // Aggregate by (categoryName, ym)
  const aggMap = new Map<string, Map<string, number>>(); // category -> ym -> signed sum
  const categoryKind = new Map<string, string>();
  const firstYMByCategory = new Map<string, string>();
  for (const t of all) {
    if (t.type === "transfer") continue;
    const name = t.category?.name ?? "Uncategorized";
    const kind = t.category?.kind ?? "other";
    if (!categoryKind.has(name)) categoryKind.set(name, kind);
    if (categoryFilter && categoryFilter !== "__all__" && name !== categoryFilter) continue;
    let inner = aggMap.get(name);
    if (!inner) {
      inner = new Map();
      aggMap.set(name, inner);
    }
    inner.set(t.accountingMonth, (inner.get(t.accountingMonth) ?? 0) + t.amount);
    const cur = firstYMByCategory.get(name);
    if (!cur || t.accountingMonth < cur) firstYMByCategory.set(name, t.accountingMonth);
  }

  const allCategoryNames = Array.from(aggMap.keys()).sort();
  const categories = allCategoryNames.map((name) => ({
    name,
    kind: categoryKind.get(name) ?? "other",
    firstYM: firstYMByCategory.get(name) ?? fromYM,
  }));

  // Build cells with carry-forward-0 rule
  const cells: Record<string, Record<string, number | null>> = {};
  const totalsByMonth: DataFlowGrid["totalsByMonth"] = {};
  const totalsByCategory: Record<string, number> = {};
  for (const ym of months) {
    cells[ym] = {};
    let income = 0;
    let expense = 0;
    for (const cat of categories) {
      const introduced = ym >= cat.firstYM;
      if (!introduced) {
        cells[ym][cat.name] = null;
        continue;
      }
      const value = aggMap.get(cat.name)?.get(ym) ?? 0;
      cells[ym][cat.name] = value;
      totalsByCategory[cat.name] = (totalsByCategory[cat.name] ?? 0) + value;
      if (value > 0) income += value;
      else if (value < 0) expense += -value;
    }
    totalsByMonth[ym] = { income, expense, net: income - expense };
  }

  return {
    fromYM,
    toYM,
    months,
    categories,
    cells,
    totalsByMonth,
    totalsByCategory,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary aggregation: a P&L-shaped table.
//   Row 1 = Revenue (sum of revenue-kind categories, signed; usually positive)
//   Rows 2..N = Outcome categories (one per non-revenue, non-transfer category)
//   Final row = P&L (revenue − sum of outcomes) with margin %
// ─────────────────────────────────────────────────────────────────────────────

export type DataFlowSummary = {
  range: DataFlowRange;
  fromYM: string;
  toYM: string;
  monthCount: number;
  revenue: number;             // signed sum of all revenue-kind categories
  // Per-category breakdown of revenue (one row per income category). The UI
  // renders each as its own line, mirroring how outcomes are displayed.
  revenues: {
    name: string;
    kind: string;              // always "revenue"
    total: number;             // signed (typically positive)
    categoryId: string;
  }[];
  outcomes: {
    name: string;
    kind: string;
    total: number;             // absolute outflow magnitude
    categoryId: string;        // category id, for inline kind-toggle UI
  }[];
  // Lightweight projection of `revenues` kept for backward-compat with the
  // existing UI banner that lists revenue categories alongside the row.
  revenueCategories: { id: string; name: string }[];
  totalOutcome: number;        // sum of |outcome rows|
  pnl: number;                 // revenue − totalOutcome
  marginPct: number | null;    // pnl / revenue (null when revenue ≤ 0)
};

export async function buildDataFlowSummary(
  businessId: string,
  range: DataFlowRange,
  categoryFilter: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<DataFlowSummary> {
  const grid = await buildDataFlow(
    businessId,
    range,
    categoryFilter,
    customStart,
    customEnd,
  );
  // Pull category IDs so the UI can target a specific category row when the
  // user clicks "→ Income" / "→ Outcome" to flip its kind.
  const dbCats = await prisma.category.findMany({
    where: { businessId },
    select: { id: true, name: true, kind: true },
  });
  const idByName = new Map(dbCats.map((c) => [c.name, c.id]));

  let revenue = 0;
  const revenuesMap = new Map<
    string,
    { kind: string; total: number; categoryId: string }
  >();
  const outcomesMap = new Map<
    string,
    { kind: string; total: number; categoryId: string }
  >();
  for (const cat of grid.categories) {
    const total = grid.totalsByCategory[cat.name] ?? 0;
    const id = idByName.get(cat.name);
    if (cat.kind === "transfer") continue;
    if (cat.kind === "revenue") {
      revenue += total;
      if (id) {
        revenuesMap.set(cat.name, { kind: cat.kind, total, categoryId: id });
      }
      continue;
    }
    const outflow = -total;
    if (!id) continue;
    outcomesMap.set(cat.name, { kind: cat.kind, total: outflow, categoryId: id });
  }
  const revenues = Array.from(revenuesMap.entries())
    .map(([name, v]) => ({
      name,
      kind: v.kind,
      total: v.total,
      categoryId: v.categoryId,
    }))
    // Hide categories that net to zero in this window (carry-forward-0 rule).
    .filter((r) => Math.abs(r.total) >= 0.5)
    .sort((a, b) => b.total - a.total);
  const revenueCategories = revenues.map((r) => ({
    id: r.categoryId,
    name: r.name,
  }));
  const outcomes = Array.from(outcomesMap.entries())
    .map(([name, v]) => ({
      name,
      kind: v.kind,
      total: v.total,
      categoryId: v.categoryId,
    }))
    // Hide categories that net to zero in this window (typically the
    // carry-forward-0 rule introducing a row with no actual movement).
    .filter((o) => Math.abs(o.total) >= 0.5)
    .sort((a, b) => b.total - a.total); // largest outflow first
  const totalOutcome = outcomes.reduce((s, o) => s + o.total, 0);
  const pnl = revenue - totalOutcome;
  const marginPct = revenue > 0 ? pnl / revenue : null;

  return {
    range: grid.range,
    fromYM: grid.fromYM,
    toYM: grid.toYM,
    monthCount: grid.months.length,
    revenue,
    revenues,
    outcomes,
    revenueCategories,
    totalOutcome,
    pnl,
    marginPct,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-month line items for the Monthly Report.
//
// Returns one row per category that has appeared anywhere on or before the
// selected month (carry-forward-0 rule), plus revenue + total-outcome + P&L
// rollups. Each row carries current-month and previous-month values so the UI
// can render a Δ column. Revenue is treated as income/profit; everything else
// is outcome.
// ─────────────────────────────────────────────────────────────────────────────

export type MonthLineItemRow = {
  name: string;
  kind: string;
  type: "income" | "outcome";
  cur: number;          // signed; income positive, outcome negative
  prev: number;         // signed
  curOutflow: number;   // for outcomes: |cur|; for income: 0 (so totalOutcome ignores income)
  prevOutflow: number;  // for outcomes: |prev|; for income: 0
};

export type MonthLineItems = {
  ym: string;
  prevYM: string;
  rows: MonthLineItemRow[];           // every category, revenue first
  revenue: { cur: number; prev: number };
  totalOutcome: { cur: number; prev: number };
  pnl: { cur: number; prev: number };
  marginPct: { cur: number | null; prev: number | null };
};

export async function buildMonthLineItems(
  businessId: string,
  ym: string,
): Promise<MonthLineItems> {
  const prevYM = shiftYM(ym, -1);

  // Pull transactions for ym, prev ym, and all history up to and including ym
  // so we can apply the carry-forward-0 rule for categories that appeared in
  // earlier months but not in the current one.
  const all = await prisma.transaction.findMany({
    where: {
      businessId,
      isExcludedFromPnl: false,
      accountingMonth: { lte: ym },
    },
    include: { category: true },
  });

  // Aggregate per (categoryName, ym).
  type Agg = Map<string, { kind: string; cur: number; prev: number }>;
  const agg: Agg = new Map();
  for (const t of all) {
    if (t.type === "transfer") continue;
    const name = t.category?.name ?? "Uncategorized";
    const kind = t.category?.kind ?? "other";
    let entry = agg.get(name);
    if (!entry) {
      entry = { kind, cur: 0, prev: 0 };
      agg.set(name, entry);
    }
    if (t.accountingMonth === ym) entry.cur += t.amount;
    else if (t.accountingMonth === prevYM) entry.prev += t.amount;
    // Other months count as "presence" only — they make the category eligible
    // to appear in the report row even with 0 values in cur/prev.
  }

  const revenueRows: MonthLineItemRow[] = [];
  const outcomeRows: MonthLineItemRow[] = [];
  for (const [name, e] of agg) {
    if (e.kind === "revenue") {
      revenueRows.push({
        name,
        kind: e.kind,
        type: "income",
        cur: e.cur,
        prev: e.prev,
        curOutflow: 0,
        prevOutflow: 0,
      });
      continue;
    }
    outcomeRows.push({
      name,
      kind: e.kind,
      type: "outcome",
      cur: e.cur,
      prev: e.prev,
      curOutflow: e.cur < 0 ? -e.cur : 0,
      prevOutflow: e.prev < 0 ? -e.prev : 0,
    });
  }
  // Sort revenues: current amount desc; then previous; then alpha
  revenueRows.sort((a, b) => {
    if (a.cur !== b.cur) return b.cur - a.cur;
    if (a.prev !== b.prev) return b.prev - a.prev;
    return a.name.localeCompare(b.name);
  });
  // Sort outcomes: current outflow desc; then previous outflow desc; then alpha
  outcomeRows.sort((a, b) => {
    if (a.curOutflow !== b.curOutflow) return b.curOutflow - a.curOutflow;
    if (a.prevOutflow !== b.prevOutflow) return b.prevOutflow - a.prevOutflow;
    return a.name.localeCompare(b.name);
  });

  // Revenue rows first, then outcome rows. Each revenue category appears as
  // its own line — same shape as outcomes.
  const rows: MonthLineItemRow[] = [...revenueRows, ...outcomeRows];

  const revenueCur = revenueRows.reduce((s, r) => s + r.cur, 0);
  const revenuePrev = revenueRows.reduce((s, r) => s + r.prev, 0);
  const totalOutcomeCur = outcomeRows.reduce((s, r) => s + r.curOutflow, 0);
  const totalOutcomePrev = outcomeRows.reduce((s, r) => s + r.prevOutflow, 0);
  const pnlCur = revenueCur - totalOutcomeCur;
  const pnlPrev = revenuePrev - totalOutcomePrev;

  return {
    ym,
    prevYM,
    rows,
    revenue: { cur: revenueCur, prev: revenuePrev },
    totalOutcome: { cur: totalOutcomeCur, prev: totalOutcomePrev },
    pnl: { cur: pnlCur, prev: pnlPrev },
    marginPct: {
      cur: revenueCur > 0 ? pnlCur / revenueCur : null,
      prev: revenuePrev > 0 ? pnlPrev / revenuePrev : null,
    },
  };
}

// Helper for the time-range select label on the page header
export const RANGE_LABEL: Record<DataFlowRange, string> = {
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  last_quarter: "Last quarter",
  this_year: "This year",
  last_year: "Last year",
  all: "All time",
  custom: "Custom",
};

// Avoid unused-import warnings — dateToYM is exported for future use elsewhere
void dateToYM;
