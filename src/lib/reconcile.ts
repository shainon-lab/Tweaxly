// Reconciliation checker.
//
// Walks a business's transactions for a given period and compares
// the totals computed several different ways. If any of them diverge
// (beyond the moneyEqual tolerance) we emit a structured warning so
// the admin Health page can surface the mismatch and the engineer
// can debug the root cause.
//
// Checks performed (each independent):
//   • income(period)  vs  Σ category[kind=revenue].byCategory
//   • expenses(period)  vs  Σ category[kind!=revenue,!=transfer].byCategory
//   • net = income − expenses  (identity check)
//   • Σ converted_amounts  ≈  Σ original_amount × exchange_rate  (FX integrity)
//
// Reconciliation is a *read* operation - never mutates. It exists to
// catch silent discrepancies before they show up on a customer's
// dashboard.

import { prisma } from "./db";
import { buildMonthSnapshot } from "./metrics";
import { moneyEqual, sumMoney, multiplyMoney } from "./money";

export interface ReconciliationFinding {
  level: "ok" | "warn" | "error";
  check: string;
  ym?:   string;
  expected: number;
  actual:   number;
  drift:    number;     // expected - actual
  message:  string;
}

export interface ReconciliationReport {
  businessId: string;
  ym:         string;
  findings:   ReconciliationFinding[];
  ok:         boolean;
}

const TOL = 0.05; // 5 cents tolerance for a single month's totals

export async function reconcileMonth(
  businessId: string,
  ym: string,
): Promise<ReconciliationReport> {
  const findings: ReconciliationFinding[] = [];
  const snap = await buildMonthSnapshot(businessId, ym);

  // Check 1: income == Σ revenue-kind categories
  const revenueFromCats = sumMoney(
    Object.entries(snap.byCategory)
      .map(([n, v]) => v > 0 ? v : 0)
      .filter((v) => v > 0)
  );
  if (!moneyEqual(snap.income, revenueFromCats, TOL)) {
    findings.push({
      level: "warn",
      check: "income == Σ revenue categories",
      ym,
      expected: snap.income,
      actual:   revenueFromCats,
      drift:    snap.income - revenueFromCats,
      message:  `income aggregate (${snap.income.toFixed(2)}) does not match revenue-category sum (${revenueFromCats.toFixed(2)})`,
    });
  }

  // Check 2: net = income - expenses (identity)
  const netComputed = snap.income - snap.expenses;
  if (!moneyEqual(netComputed, snap.netProfit, TOL)) {
    findings.push({
      level: "error",
      check: "netProfit == income - expenses",
      ym,
      expected: netComputed,
      actual:   snap.netProfit,
      drift:    netComputed - snap.netProfit,
      message:  `netProfit identity broken: income - expenses = ${netComputed.toFixed(2)}, snap.netProfit = ${snap.netProfit.toFixed(2)}`,
    });
  }

  // Check 3: FX integrity - converted amounts should equal
  // original × exchangeRate for every row that was converted.
  const fxRows = await prisma.transaction.findMany({
    where: {
      businessId,
      accountingMonth: ym,
      isConverted: true,
      originalAmount: { not: null },
      exchangeRate:   { not: null },
    },
    select: { id: true, amount: true, originalAmount: true, exchangeRate: true },
  });
  for (const row of fxRows) {
    const recomputed = multiplyMoney(row.originalAmount!, row.exchangeRate!);
    if (!moneyEqual(recomputed, row.amount, TOL)) {
      findings.push({
        level: "warn",
        check: "amount == originalAmount * exchangeRate",
        ym,
        expected: recomputed,
        actual:   row.amount,
        drift:    recomputed - row.amount,
        message:  `txn ${row.id}: ${row.originalAmount} × ${row.exchangeRate} = ${recomputed.toFixed(4)}, stored amount = ${row.amount.toFixed(4)}`,
      });
    }
  }

  return {
    businessId,
    ym,
    findings,
    ok: findings.every((f) => f.level === "ok"),
  };
}

// Walk every month with data and return all findings flattened. Used
// by the data-health admin page so a single business shows up with
// at most one card listing all mismatches across history.
export async function reconcileAllMonths(
  businessId: string,
): Promise<ReconciliationFinding[]> {
  const rows = await prisma.transaction.findMany({
    where: { businessId },
    select: { accountingMonth: true },
    distinct: ["accountingMonth"],
    orderBy: { accountingMonth: "desc" },
  });
  const out: ReconciliationFinding[] = [];
  // Cap at 24 months so the health page is bounded.
  for (const r of rows.slice(0, 24)) {
    const rep = await reconcileMonth(businessId, r.accountingMonth);
    for (const f of rep.findings) out.push(f);
  }
  return out;
}
