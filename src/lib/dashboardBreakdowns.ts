// Per-bucket currency breakdowns for the dashboard tiles.
//
// Mirrors the classifier in `src/lib/metrics.ts` → `buildMonthSnapshot`
// so the per-tile breakdowns use exactly the same membership rules
// the displayed totals do. One DB query per period instead of one per
// tile.

import { prisma } from "./db";
import {
  breakdownFromTxns,
  type BreakdownResult,
  type BreakdownTxn,
} from "./currencyBreakdown";

export interface DashboardBreakdowns {
  revenue:    BreakdownResult;
  expenses:   BreakdownResult;
  fixed:      BreakdownResult;
  variable:   BreakdownResult;
  payroll:    BreakdownResult;
  marketing:  BreakdownResult;
  fees:       BreakdownResult;
  taxes:      BreakdownResult;
  oneTime:    BreakdownResult;
  net:        BreakdownResult;
}

export async function buildDashboardBreakdowns(
  businessId: string,
  fromYM: string,
  toYM: string,
  baseCurrency: string,
): Promise<DashboardBreakdowns> {
  const rows = await prisma.transaction.findMany({
    where: {
      businessId,
      accountingMonth: { gte: fromYM, lte: toYM },
      isExcludedFromPnl: false,
    },
    select: {
      amount: true, currency: true,
      originalAmount: true, originalCurrency: true,
      baseCurrency: true, exchangeRate: true,
      conversionMethod: true,
      isOneTime: true, type: true,
      category: { select: { kind: true, name: true, isOneTime: true } },
    },
  });

  const isIncome  = (r: typeof rows[number]) => r.amount > 0 && r.category?.kind === "revenue";
  const isExpense = (r: typeof rows[number]) =>
    r.type !== "transfer" && (r.amount < 0 || (r.category?.kind ?? "other") !== "revenue") &&
    !isIncome(r);

  const buckets = {
    revenue:    [] as BreakdownTxn[],
    expenses:   [] as BreakdownTxn[],
    fixed:      [] as BreakdownTxn[],
    variable:   [] as BreakdownTxn[],
    payroll:    [] as BreakdownTxn[],
    marketing:  [] as BreakdownTxn[],
    fees:       [] as BreakdownTxn[],
    taxes:      [] as BreakdownTxn[],
    oneTime:    [] as BreakdownTxn[],
    net:        [] as BreakdownTxn[],
  };

  for (const r of rows) {
    if (r.type === "transfer") continue;
    const txn: BreakdownTxn = {
      amount: r.amount, currency: r.currency,
      originalAmount: r.originalAmount, originalCurrency: r.originalCurrency,
      baseCurrency: r.baseCurrency, exchangeRate: r.exchangeRate,
      conversionMethod: r.conversionMethod,
    };
    buckets.net.push(txn);
    if (isIncome(r)) {
      buckets.revenue.push(txn);
      continue;
    }
    if (!isExpense(r)) continue;
    buckets.expenses.push(txn);
    const kind = r.category?.kind ?? "other";
    if (kind === "fixed")    buckets.fixed.push(txn);
    if (kind === "variable") buckets.variable.push(txn);
    if (kind === "payroll")  buckets.payroll.push(txn);
    if (kind === "fee")      buckets.fees.push(txn);
    if (kind === "tax")      buckets.taxes.push(txn);
    if (/marketing|ads/i.test(r.category?.name ?? "")) buckets.marketing.push(txn);
    if (r.isOneTime || r.category?.isOneTime) buckets.oneTime.push(txn);
  }

  return {
    // `absolute: true` for the expense-side tiles so the breakdown
    // sum matches the magnitude shown on the tile (income/expenses are
    // reported as positive numbers on the dashboard).
    revenue:   breakdownFromTxns(buckets.revenue,   baseCurrency, { absolute: true }),
    expenses:  breakdownFromTxns(buckets.expenses,  baseCurrency, { absolute: true }),
    fixed:     breakdownFromTxns(buckets.fixed,     baseCurrency, { absolute: true }),
    variable:  breakdownFromTxns(buckets.variable,  baseCurrency, { absolute: true }),
    payroll:   breakdownFromTxns(buckets.payroll,   baseCurrency, { absolute: true }),
    marketing: breakdownFromTxns(buckets.marketing, baseCurrency, { absolute: true }),
    fees:      breakdownFromTxns(buckets.fees,      baseCurrency, { absolute: true }),
    taxes:     breakdownFromTxns(buckets.taxes,     baseCurrency, { absolute: true }),
    oneTime:   breakdownFromTxns(buckets.oneTime,   baseCurrency, { absolute: true }),
    // Net is signed — the tile shows income minus expenses, both signs
    // preserved so the breakdown matches the dashboard tile direction.
    net:       breakdownFromTxns(buckets.net,       baseCurrency),
  };
}
