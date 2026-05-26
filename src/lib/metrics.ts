// Aggregations used by dashboard, monthly report, and forecast.
import { prisma } from "./db";
import { dateToYM, shiftYM, todayYM } from "./format";

export type MonthBuckets = {
  income: number;
  expenses: number; // positive number, sum of |amount| for outflows
  fixed: number;
  variable: number;
  payroll: number;
  marketing: number;
  fees: number;
  oneTime: number;
  taxes: number;
  netProfit: number;
  normalizedProfit: number; // excludes one-time items
  byCategory: Record<string, number>;
};

export async function buildMonthSnapshot(businessId: string, ym: string): Promise<MonthBuckets> {
  const txns = await prisma.transaction.findMany({
    where: { businessId, accountingMonth: ym, isExcludedFromPnl: false },
    include: { category: true },
  });
  const buckets: MonthBuckets = {
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
  };
  for (const t of txns) {
    if (t.type === "transfer") continue;
    const kind = t.category?.kind ?? "other";
    const catName = t.category?.name ?? "Uncategorized";
    if (t.amount > 0 && kind === "revenue") {
      buckets.income += t.amount;
    } else if (t.amount < 0 || kind !== "revenue") {
      const abs = Math.abs(t.amount);
      buckets.expenses += abs;
      if (kind === "fixed") buckets.fixed += abs;
      else if (kind === "variable") buckets.variable += abs;
      else if (kind === "payroll") buckets.payroll += abs;
      else if (kind === "fee") buckets.fees += abs;
      else if (kind === "tax") buckets.taxes += abs;
      if (/marketing|ads/i.test(catName)) buckets.marketing += abs;
      if (t.isOneTime || t.category?.isOneTime) buckets.oneTime += abs;
    }
    buckets.byCategory[catName] = (buckets.byCategory[catName] ?? 0) + t.amount;
  }
  buckets.netProfit = buckets.income - buckets.expenses;
  buckets.normalizedProfit = buckets.netProfit + buckets.oneTime;
  return buckets;
}

export async function trailingMonthsSummary(
  businessId: string,
  n = 6,
  endYM?: string,
) {
  // When `endYM` is provided, the trail ends on that month. Otherwise we
  // anchor on the latest month that actually has data so the chart never
  // shows trailing empty months from uploads not yet imported.
  let anchor = endYM;
  if (!anchor) {
    const months = await listAccountingMonths(businessId);
    anchor = months[0] ?? todayYM();
  }
  // Walk backwards from the anchor to collect the month keys, then run
  // every snapshot in parallel. Was sequential - added latency that
  // stacked on every dashboard render.
  const yms: string[] = [];
  let cursor = anchor;
  for (let i = 0; i < n; i++) {
    yms.unshift(cursor);
    cursor = shiftYM(cursor, -1);
  }
  const snaps = await Promise.all(yms.map((ym) => buildMonthSnapshot(businessId, ym)));
  return yms.map((ym, i) => ({
    ym,
    income:   snaps[i].income,
    expenses: snaps[i].expenses,
    net:      snaps[i].netProfit,
  }));
}

export async function listAccountingMonths(businessId: string): Promise<string[]> {
  const rows = await prisma.transaction.findMany({
    where: { businessId },
    distinct: ["accountingMonth"],
    select: { accountingMonth: true },
    orderBy: { accountingMonth: "desc" },
  });
  return rows.map((r) => r.accountingMonth);
}

export async function activeEmployeeCost(businessId: string, ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const endExclusive = new Date(Date.UTC(y, m, 1));
  const employees = await prisma.employee.findMany({
    where: {
      businessId,
      startDate: { lt: endExclusive },
      OR: [{ endDate: null }, { endDate: { gte: start } }],
    },
  });
  let total = 0;
  for (const e of employees) {
    // Use explicit breakdown fields when set; otherwise fall back to the
    // legacy gross * multiplier so older records still cost something
    // reasonable. Mirrors computeEmployeeCost() in lib/workforce.ts.
    const hasBreakdown =
      e.employerTaxes != null || e.pension != null ||
      e.benefits != null || e.additionalCosts != null;
    if (hasBreakdown) {
      total += e.grossMonthlySalary
        + (e.employerTaxes ?? 0)
        + (e.pension ?? 0)
        + (e.benefits ?? 0)
        + (e.additionalCosts ?? 0);
    } else {
      total += e.grossMonthlySalary * (e.employerCostMultiplier || 1);
    }
  }
  // Add one-time / bonus events that fall inside this month.
  const events = await prisma.employeeEvent.findMany({
    where: { businessId, effectiveDate: { gte: start, lt: endExclusive } },
  });
  let oneTime = 0;
  for (const ev of events) {
    if (ev.type === "bonus" || ev.type === "one_time") oneTime += ev.amount ?? 0;
  }
  return { recurring: total, oneTime, total: total + oneTime, employeeCount: employees.length };
}

export function dateToYMUtil(d: Date) { return dateToYM(d); }
