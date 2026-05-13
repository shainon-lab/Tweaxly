// Yearly summary engine — used by the /insights/yearly tab.
//
// Given a business and a calendar year, compute:
//   • headline financial metrics (revenue, expenses, P&L, margin, ...)
//   • workforce stats (avg headcount, hires, terminations, payroll ratio)
//   • a ranked list of plain-English insights, each paired with a tip the
//     owner can act on
//   • a coverage descriptor (which months in the year had data) so partial
//     years are handled honestly with a banner
//
// All computations are pure-ish (one DB read, then in-memory math). The
// insight ranking is deterministic so re-renders don't shuffle the list.

import { prisma } from "./db";
import { buildMonthSnapshot, listAccountingMonths, type MonthBuckets } from "./metrics";
import { computeEmployeeCost, type EmployeeRow } from "./workforce";
import { fmtMoney, fmtPct, ymToLabel } from "./format";

function pad2(n: number) { return String(n).padStart(2, "0"); }

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type YearlyCoverage = {
  year: number;
  monthCount: number;
  firstMonth: number; // 1-12 (or 0 if no data at all)
  lastMonth: number;
  isPartial: boolean;
  partialNote: string | null;
};

export type YearlyStats = {
  year: number;
  coverage: YearlyCoverage;
  prior: { year: number; revenue: number; expenses: number; netProfit: number } | null;

  // Headline financials
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPct: number | null;
  avgMonthlyRevenue: number;
  avgMonthlyExpenses: number;
  avgMonthlyNet: number;

  // Month extremes
  bestRevenueMonth: { ym: string; amount: number } | null;
  worstRevenueMonth: { ym: string; amount: number } | null;
  bestNetMonth: { ym: string; amount: number } | null;
  worstNetMonth: { ym: string; amount: number } | null;
  monthsInRed: number;

  // Cost composition
  totalPayroll: number;
  payrollPctRevenue: number | null;
  totalMarketing: number;
  marketingPctRevenue: number | null;
  totalFees: number;
  totalTaxes: number;
  totalFixed: number;
  totalVariable: number;
  totalOneTime: number;
  oneTimeShareOfExpenses: number | null;

  // Top observations
  topCategoryByExpense: { name: string; amount: number } | null;
  topVendorByExpense: { vendor: string; amount: number } | null;
  uniqueVendorCount: number;

  // Workforce
  avgHeadcount: number;
  startHeadcount: number;
  endHeadcount: number;
  peakHeadcount: number;
  newHires: number;
  terminations: number;
  avgCostPerEmployee: number;

  // YoY deltas (null when no prior year)
  revenueYoYPct: number | null;
  expensesYoYPct: number | null;
  netYoYPct: number | null;
};

export type Insight = {
  text: string;
  tip: string;
  importance: number; // larger = more important
};

// Build the per-month series for a year, plus pre-computed extremes.
async function buildYearMonths(
  businessId: string,
  year: number,
): Promise<{ months: { ym: string; snap: MonthBuckets }[]; coverage: YearlyCoverage }> {
  const dataMonths = await listAccountingMonths(businessId);
  const inYear = dataMonths.filter((m) => m.startsWith(`${year}-`)).sort();
  const months: { ym: string; snap: MonthBuckets }[] = [];
  for (const ym of inYear) {
    months.push({ ym, snap: await buildMonthSnapshot(businessId, ym) });
  }
  let coverage: YearlyCoverage;
  if (months.length === 0) {
    coverage = { year, monthCount: 0, firstMonth: 0, lastMonth: 0, isPartial: true, partialNote: `${year} has no transactions yet.` };
  } else {
    const firstMonth = Number(months[0].ym.split("-")[1]);
    const lastMonth = Number(months[months.length - 1].ym.split("-")[1]);
    const isPartial = firstMonth !== 1 || lastMonth !== 12;
    const partialNote = isPartial
      ? `${year} data covers ${months.length} month${months.length === 1 ? "" : "s"} — from ${MONTH_NAMES[firstMonth - 1]} ${year} through ${MONTH_NAMES[lastMonth - 1]} ${year}. Yearly figures are calculated on those months only.`
      : null;
    coverage = { year, monthCount: months.length, firstMonth, lastMonth, isPartial, partialNote };
  }
  return { months, coverage };
}

// Compute the headline stats for the year (no insights yet).
export async function computeYearlyStats(
  businessId: string,
  year: number,
): Promise<YearlyStats> {
  const { months, coverage } = await buildYearMonths(businessId, year);

  // Aggregate roll-ups
  const agg = {
    income: 0, expenses: 0, payroll: 0, marketing: 0,
    fees: 0, taxes: 0, fixed: 0, variable: 0, oneTime: 0,
    byCategory: {} as Record<string, number>,
  };
  for (const { snap } of months) {
    agg.income     += snap.income;
    agg.expenses   += snap.expenses;
    agg.payroll    += snap.payroll;
    agg.marketing  += snap.marketing;
    agg.fees       += snap.fees;
    agg.taxes      += snap.taxes;
    agg.fixed      += snap.fixed;
    agg.variable   += snap.variable;
    agg.oneTime    += snap.oneTime;
    for (const [k, v] of Object.entries(snap.byCategory)) {
      agg.byCategory[k] = (agg.byCategory[k] ?? 0) + v;
    }
  }
  const netProfit = agg.income - agg.expenses;
  const n = Math.max(months.length, 1);

  // Monthly extremes
  let bestRevenueMonth: YearlyStats["bestRevenueMonth"] = null;
  let worstRevenueMonth: YearlyStats["worstRevenueMonth"] = null;
  let bestNetMonth: YearlyStats["bestNetMonth"] = null;
  let worstNetMonth: YearlyStats["worstNetMonth"] = null;
  let monthsInRed = 0;
  for (const { ym, snap } of months) {
    if (!bestRevenueMonth || snap.income > bestRevenueMonth.amount) bestRevenueMonth = { ym, amount: snap.income };
    if (!worstRevenueMonth || snap.income < worstRevenueMonth.amount) worstRevenueMonth = { ym, amount: snap.income };
    if (!bestNetMonth || snap.netProfit > bestNetMonth.amount) bestNetMonth = { ym, amount: snap.netProfit };
    if (!worstNetMonth || snap.netProfit < worstNetMonth.amount) worstNetMonth = { ym, amount: snap.netProfit };
    if (snap.netProfit < 0) monthsInRed++;
  }

  // Top category by outcome (most-negative byCategory entry)
  let topCategoryByExpense: YearlyStats["topCategoryByExpense"] = null;
  for (const [name, signed] of Object.entries(agg.byCategory)) {
    if (signed >= 0) continue;
    const amount = Math.abs(signed);
    if (!topCategoryByExpense || amount > topCategoryByExpense.amount) {
      topCategoryByExpense = { name, amount };
    }
  }

  // Top vendor by total outflow within the year
  const vendorRows = await prisma.transaction.groupBy({
    by: ["vendor"],
    where: {
      businessId,
      accountingMonth: { gte: `${year}-01`, lte: `${year}-12` },
      isExcludedFromPnl: false,
      type: { in: ["expense", "fee", "tax"] },
      vendor: { not: null },
    },
    _sum: { amount: true },
  });
  let topVendorByExpense: YearlyStats["topVendorByExpense"] = null;
  const seenVendors = new Set<string>();
  for (const r of vendorRows) {
    if (!r.vendor) continue;
    seenVendors.add(r.vendor);
    const amt = Math.abs(r._sum.amount ?? 0);
    if (amt <= 0) continue;
    if (!topVendorByExpense || amt > topVendorByExpense.amount) {
      topVendorByExpense = { vendor: r.vendor, amount: amt };
    }
  }

  // Workforce — fetch the roster and compute month-by-month coverage
  const employees = await prisma.employee.findMany({ where: { businessId } });
  const rows: EmployeeRow[] = employees.map((e) => ({
    id: e.id, name: e.name, role: e.role,
    employmentType: e.employmentType, department: e.department,
    employerTaxes: e.employerTaxes, pension: e.pension,
    benefits: e.benefits, additionalCosts: e.additionalCosts,
    status: e.status,
    grossMonthlySalary: e.grossMonthlySalary,
    employerCostMultiplier: e.employerCostMultiplier,
    startDate: e.startDate, endDate: e.endDate, notes: e.notes,
  }));
  let totalHeadcountSum = 0;
  let peakHeadcount = 0;
  let firstHeadcount = 0;
  let lastHeadcount = 0;
  let totalEmployeeCostSum = 0;
  let employeeCostMonths = 0;
  for (let i = 0; i < months.length; i++) {
    const { ym } = months[i];
    const [, mStr] = ym.split("-");
    const m = Number(mStr);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const endExclusive = new Date(Date.UTC(year, m, 1));
    const activeRows = rows.filter((r) =>
      r.startDate < endExclusive && (!r.endDate || r.endDate >= start),
    );
    totalHeadcountSum += activeRows.length;
    peakHeadcount = Math.max(peakHeadcount, activeRows.length);
    if (i === 0) firstHeadcount = activeRows.length;
    if (i === months.length - 1) lastHeadcount = activeRows.length;
    for (const e of activeRows) {
      totalEmployeeCostSum += computeEmployeeCost(e).total;
    }
    employeeCostMonths++;
  }
  const avgHeadcount = months.length > 0 ? totalHeadcountSum / months.length : 0;
  const avgCostPerEmployee = totalHeadcountSum > 0
    ? totalEmployeeCostSum / totalHeadcountSum
    : 0;

  // Hires & terminations in this year
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEndExclusive = new Date(Date.UTC(year + 1, 0, 1));
  const newHires = rows.filter((r) => r.startDate >= yearStart && r.startDate < yearEndExclusive).length;
  const terminations = rows.filter((r) => r.endDate && r.endDate >= yearStart && r.endDate < yearEndExclusive).length;

  // Prior year (raw totals, used for YoY)
  let prior: YearlyStats["prior"] = null;
  const priorYM = `${year - 1}-`;
  const priorMonthsExist = (await listAccountingMonths(businessId)).some((m) => m.startsWith(priorYM));
  if (priorMonthsExist) {
    const priorMonths = (await listAccountingMonths(businessId)).filter((m) => m.startsWith(priorYM));
    let pRev = 0, pExp = 0;
    for (const ym of priorMonths) {
      const snap = await buildMonthSnapshot(businessId, ym);
      pRev += snap.income; pExp += snap.expenses;
    }
    prior = { year: year - 1, revenue: pRev, expenses: pExp, netProfit: pRev - pExp };
  }

  return {
    year,
    coverage,
    prior,
    totalRevenue: agg.income,
    totalExpenses: agg.expenses,
    netProfit,
    netMarginPct: agg.income > 0 ? netProfit / agg.income : null,
    avgMonthlyRevenue: agg.income / n,
    avgMonthlyExpenses: agg.expenses / n,
    avgMonthlyNet: netProfit / n,
    bestRevenueMonth, worstRevenueMonth, bestNetMonth, worstNetMonth,
    monthsInRed,
    totalPayroll: agg.payroll,
    payrollPctRevenue: agg.income > 0 ? agg.payroll / agg.income : null,
    totalMarketing: agg.marketing,
    marketingPctRevenue: agg.income > 0 ? agg.marketing / agg.income : null,
    totalFees: agg.fees,
    totalTaxes: agg.taxes,
    totalFixed: agg.fixed,
    totalVariable: agg.variable,
    totalOneTime: agg.oneTime,
    oneTimeShareOfExpenses: agg.expenses > 0 ? agg.oneTime / agg.expenses : null,
    topCategoryByExpense,
    topVendorByExpense,
    uniqueVendorCount: seenVendors.size,
    avgHeadcount,
    startHeadcount: firstHeadcount,
    endHeadcount: lastHeadcount,
    peakHeadcount,
    newHires,
    terminations,
    avgCostPerEmployee,
    revenueYoYPct: prior && prior.revenue > 0 ? (agg.income - prior.revenue) / prior.revenue : null,
    expensesYoYPct: prior && prior.expenses > 0 ? (agg.expenses - prior.expenses) / prior.expenses : null,
    netYoYPct: prior && prior.netProfit !== 0 ? (netProfit - prior.netProfit) / Math.abs(prior.netProfit) : null,
  };
}

// Generate a ranked list of plain-English insights + tips for the given
// year's stats. Each insight has an importance score so the consumer can
// show the top N first.
export function generateYearlyInsights(s: YearlyStats, ccy: string): Insight[] {
  const out: Insight[] = [];
  const yr = s.year;

  // 1. Headline P&L summary
  out.push({
    importance: 10,
    text: `${yr} closed with ${fmtMoney(s.netProfit, ccy)} in net profit on ${fmtMoney(s.totalRevenue, ccy)} of revenue (margin ${s.netMarginPct == null ? "n/a" : fmtPct(s.netMarginPct)}).`,
    tip: s.netProfit >= 0
      ? "Lock in what worked: identify the 2-3 line items that contributed most to profit and protect them in next year's budget."
      : "Run a line-by-line review of the largest expense categories and decide what's structural versus discretionary before next year's plan.",
  });

  // 2. YoY revenue
  if (s.revenueYoYPct != null) {
    const sign = s.revenueYoYPct >= 0 ? "grew" : "declined";
    out.push({
      importance: s.revenueYoYPct >= 0.15 ? 9 : s.revenueYoYPct <= -0.05 ? 9.5 : 7,
      text: `Revenue ${sign} ${fmtPct(Math.abs(s.revenueYoYPct))} versus ${yr - 1} (${fmtMoney(s.totalRevenue, ccy)} vs ${fmtMoney(s.prior!.revenue, ccy)}).`,
      tip: s.revenueYoYPct >= 0
        ? "Make sure the customer mix that drove growth is durable — overconcentration in one channel or contract is the most common reason for a flat next year."
        : "Diagnose the drop by channel: was it churn, lost deals, pricing, or seasonality? Targeted action depends on which.",
    });
  }

  // 3. YoY expense growth
  if (s.expensesYoYPct != null) {
    const sign = s.expensesYoYPct >= 0 ? "rose" : "fell";
    out.push({
      importance: s.expensesYoYPct >= 0.20 ? 9 : 7,
      text: `Expenses ${sign} ${fmtPct(Math.abs(s.expensesYoYPct))} versus ${yr - 1}.`,
      tip: s.expensesYoYPct > (s.revenueYoYPct ?? 0)
        ? "Expense growth outpaced revenue growth — review which categories drove the gap and whether they unlock future revenue or just add overhead."
        : "Healthy: expense growth came in below revenue growth. Confirm the savings weren't from one-off cuts that have to be repeated.",
    });
  }

  // 4. Net margin classification
  if (s.netMarginPct != null) {
    const pct = s.netMarginPct;
    out.push({
      importance: pct < 0 ? 9.5 : pct < 0.05 ? 8 : 6,
      text: `Net margin landed at ${fmtPct(pct)}.`,
      tip: pct < 0
        ? "Unprofitable year — model a 12-month path to break-even on the Forecast tab using cuts and revenue moves."
        : pct < 0.10
          ? "Margin is thin — a single bad quarter could flip the year. Build a 3-month cash cushion before increasing fixed spend."
          : "Healthy margin gives you room to invest. Decide where the next dollar should go before the next budget cycle.",
    });
  }

  // 5. Months in red
  if (s.coverage.monthCount > 0) {
    out.push({
      importance: s.monthsInRed > s.coverage.monthCount / 2 ? 9 : s.monthsInRed > 0 ? 7 : 5,
      text: `${s.monthsInRed} of ${s.coverage.monthCount} month${s.coverage.monthCount === 1 ? "" : "s"} closed in the red.`,
      tip: s.monthsInRed === 0
        ? "Every month positive — strong sign. Identify the structural reasons (mix of recurring revenue, expense discipline) and document them."
        : "Pinpoint the loss months and check whether they were seasonal dips, one-time hits, or warning signs of an underlying pattern.",
    });
  }

  // 6. Best/worst month spread
  if (s.bestRevenueMonth && s.worstRevenueMonth && s.bestRevenueMonth.amount > 0) {
    const ratio = s.bestRevenueMonth.amount / Math.max(s.worstRevenueMonth.amount, 1);
    out.push({
      importance: ratio > 2 ? 8 : 6,
      text: `Revenue peaked in ${ymToLabel(s.bestRevenueMonth.ym)} at ${fmtMoney(s.bestRevenueMonth.amount, ccy)} and bottomed in ${ymToLabel(s.worstRevenueMonth.ym)} at ${fmtMoney(s.worstRevenueMonth.amount, ccy)}.`,
      tip: ratio > 2
        ? "Strong seasonality — make sure cash from the peak months is reserved to cover the troughs."
        : "Revenue is relatively even — predictable cashflow is an asset; use it to negotiate longer terms with vendors.",
    });
  }

  // 7. Payroll ratio
  if (s.payrollPctRevenue != null) {
    const r = s.payrollPctRevenue;
    out.push({
      importance: r > 0.5 ? 9 : r > 0.35 ? 7 : 5,
      text: `Payroll consumed ${fmtPct(r)} of revenue this year (${fmtMoney(s.totalPayroll, ccy)}).`,
      tip: r > 0.5
        ? "Heavy payroll-to-revenue ratio leaves little room for overheads or downturns. Either grow revenue or rebalance the team."
        : r > 0.35
          ? "Workable but watch the slope — if payroll keeps growing faster than revenue you'll be in the same conversation a year from now."
          : "Comfortable ratio — you have room to make a strategic hire if there's a clear ROI case.",
    });
  }

  // 8. Marketing intensity
  if (s.marketingPctRevenue != null && s.totalMarketing > 0) {
    out.push({
      importance: s.marketingPctRevenue > 0.20 ? 8 : 6,
      text: `Marketing spend hit ${fmtMoney(s.totalMarketing, ccy)} — ${fmtPct(s.marketingPctRevenue)} of revenue.`,
      tip: s.marketingPctRevenue > 0.20
        ? "Above 20% of revenue is aggressive. Confirm payback period and CAC trend before committing the same intensity next year."
        : "Below the typical 15–20% band for growth-stage SMBs. If revenue growth is healthy, this is efficient marketing; if growth is flat, may signal under-investment.",
    });
  }

  // 9. Top expense category
  if (s.topCategoryByExpense && s.totalExpenses > 0) {
    const share = s.topCategoryByExpense.amount / s.totalExpenses;
    out.push({
      importance: share > 0.30 ? 8 : 6,
      text: `${s.topCategoryByExpense.name} was the largest cost center — ${fmtMoney(s.topCategoryByExpense.amount, ccy)} (${fmtPct(share)} of total expenses).`,
      tip: share > 0.30
        ? "Concentrated cost. A 10% efficiency gain here moves the P&L more than effort spent on smaller categories."
        : "Worth a once-a-year review even if it's not concentrated — every line above 10% of expenses deserves a fresh look.",
    });
  }

  // 10. Top vendor concentration
  if (s.topVendorByExpense && s.totalExpenses > 0) {
    const share = s.topVendorByExpense.amount / s.totalExpenses;
    out.push({
      importance: share > 0.15 ? 8 : 5,
      text: `${s.topVendorByExpense.vendor} was your largest vendor — ${fmtMoney(s.topVendorByExpense.amount, ccy)} (${fmtPct(share)} of expenses).`,
      tip: share > 0.15
        ? "Concentrated dependency. Renegotiation, multi-vendor sourcing, or volume discount conversations are all on the table."
        : "Diversified vendor mix — preserve it. Long-term single-vendor dependencies show up later as pricing pressure.",
    });
  }

  // 11. Headcount trajectory
  if (s.endHeadcount > 0 || s.startHeadcount > 0) {
    const delta = s.endHeadcount - s.startHeadcount;
    out.push({
      importance: 6,
      text: `Headcount moved from ${s.startHeadcount} to ${s.endHeadcount} (peaked at ${s.peakHeadcount}, averaged ${s.avgHeadcount.toFixed(1)}).`,
      tip: delta > 0
        ? "Growing team — confirm each role has a clear contribution to revenue or a load you couldn't cover otherwise."
        : delta < 0
          ? "Team shrank — review where work redistributed and whether anyone is at risk of burnout."
          : "Stable headcount — predictable payroll planning. Consider whether new roles unlock revenue you're leaving on the table.",
    });
  }

  // 12. Hiring pace
  if (s.newHires > 0 || s.terminations > 0) {
    out.push({
      importance: s.terminations > 1 ? 7 : 5,
      text: `${s.newHires} hire${s.newHires === 1 ? "" : "s"} and ${s.terminations} departure${s.terminations === 1 ? "" : "s"} during ${yr}.`,
      tip: s.terminations > s.newHires
        ? "Net negative — diagnose whether departures were planned (reorg) or attrition you didn't intend."
        : s.newHires > 3
          ? "Aggressive hiring year. Plan the next year's payroll baseline carefully — the full annualized cost of these hires won't be visible until next year."
          : "Measured talent activity — fine. Use the Workforce tab to model the impact of one more hire before committing.",
    });
  }

  // 13. One-time expense share
  if (s.oneTimeShareOfExpenses != null && s.totalOneTime > 0) {
    out.push({
      importance: 5,
      text: `${fmtMoney(s.totalOneTime, ccy)} of expenses (${fmtPct(s.oneTimeShareOfExpenses)}) were tagged one-time.`,
      tip: "Strip these out when calculating run-rate. The recurring expense base — what repeats every month — is what matters for budgeting next year.",
    });
  }

  // 14. Avg cost per employee
  if (s.avgCostPerEmployee > 0) {
    out.push({
      importance: 5,
      text: `Average fully-loaded cost per employee: ${fmtMoney(s.avgCostPerEmployee, ccy)}/month.`,
      tip: "Use this number as a quick sanity check when evaluating new hires — anyone significantly above it should have a clear revenue or productivity case attached.",
    });
  }

  // 15. Variable vs fixed
  if (s.totalFixed + s.totalVariable > 0) {
    const fixedShare = s.totalFixed / (s.totalFixed + s.totalVariable);
    out.push({
      importance: 4,
      text: `Fixed costs were ${fmtMoney(s.totalFixed, ccy)} versus ${fmtMoney(s.totalVariable, ccy)} variable (fixed share ${fmtPct(fixedShare)}).`,
      tip: fixedShare > 0.6
        ? "High fixed-cost base — review which fixed lines could be renegotiated to a variable or usage-based deal."
        : "Healthy balance — variable costs flex with revenue, giving you breathing room in slow periods.",
    });
  }

  // 16. Marketing efficiency proxy
  if (s.totalMarketing > 0 && s.revenueYoYPct != null && s.prior) {
    const incrRevenue = s.totalRevenue - s.prior.revenue;
    const efficiency = incrRevenue / s.totalMarketing;
    if (Math.abs(efficiency) > 0.05) {
      out.push({
        importance: 6,
        text: `Marketing efficiency proxy: every ${fmtMoney(1, ccy)} of marketing produced ${fmtMoney(efficiency, ccy)} of incremental revenue versus ${yr - 1}.`,
        tip: efficiency >= 2
          ? "Strong efficiency — keep funding what's working and consider raising the budget."
          : efficiency >= 0.5
            ? "OK efficiency — there's likely a better-converting channel mix worth testing."
            : "Weak efficiency — review which campaigns / channels drove the spend and whether any can be cut cleanly.",
      });
    }
  }

  // 17. Cashflow consistency
  if (s.bestNetMonth && s.worstNetMonth && s.coverage.monthCount > 1) {
    out.push({
      importance: 5,
      text: `Best net month: ${ymToLabel(s.bestNetMonth.ym)} at ${fmtMoney(s.bestNetMonth.amount, ccy)}. Worst: ${ymToLabel(s.worstNetMonth.ym)} at ${fmtMoney(s.worstNetMonth.amount, ccy)}.`,
      tip: "The spread between best and worst month tells you how much working-capital buffer you need to weather a soft quarter.",
    });
  }

  // 18. Vendor diversification
  if (s.uniqueVendorCount > 0) {
    out.push({
      importance: 3,
      text: `Worked with ${s.uniqueVendorCount} distinct vendor${s.uniqueVendorCount === 1 ? "" : "s"} over the year.`,
      tip: s.uniqueVendorCount > 30
        ? "Long tail of vendors — consolidating the smallest 20 could save more than the spend justifies in admin overhead."
        : "Compact vendor list — easier to negotiate but watch concentration risk on the top few.",
    });
  }

  // 19. Operating leverage observation (revenue per employee)
  if (s.avgHeadcount > 0) {
    const revPerEmployee = s.totalRevenue / s.avgHeadcount;
    out.push({
      importance: 5,
      text: `Revenue per employee landed at ${fmtMoney(revPerEmployee, ccy)} (averaged over the year).`,
      tip: "Compare against last year — if this number is rising, you're getting more leverage out of each hire; if it's falling, the team grew faster than revenue.",
    });
  }

  // 20. Run-rate vs actual
  if (s.coverage.monthCount >= 6) {
    const last3 = (s.coverage.monthCount >= 3)
      ? null  // computed below from raw monthly series — skipped for simplicity
      : null;
    void last3;
    const recurringRunRate = (s.totalExpenses - s.totalOneTime) / Math.max(s.coverage.monthCount, 1) * 12;
    out.push({
      importance: 4,
      text: `Recurring expense run-rate (one-times stripped): ~${fmtMoney(recurringRunRate, ccy)}/year.`,
      tip: "Use this as the floor in your next-year budget — anything below this means cuts; anything above means real growth, not just one-offs returning.",
    });
  }

  // Stable sort by importance desc, then by text for determinism
  return out.sort((a, b) => b.importance - a.importance || a.text.localeCompare(b.text));
}

// Compute the list of completed years that have at least one month of data.
// Used to power the year-select dropdown.
export async function listCompletedYearsWithData(
  businessId: string,
  refDate = new Date(),
): Promise<number[]> {
  const months = await listAccountingMonths(businessId);
  const currentYear = refDate.getUTCFullYear();
  const years = new Set<number>();
  for (const m of months) {
    const y = Number(m.slice(0, 4));
    if (y < currentYear) years.add(y);
  }
  return Array.from(years).sort((a, b) => b - a);
}

// Convenience for the page — render a stat-box row.
export function statBoxes(s: YearlyStats, ccy: string): { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }[] {
  function pct(v: number | null) { return v == null ? "—" : fmtPct(v); }
  function money(v: number) { return fmtMoney(v, ccy); }
  function tone(v: number | null, mode: "higher" | "lower" = "higher"): "good" | "warn" | "bad" {
    if (v == null) return "good";
    if (mode === "higher") return v > 0 ? "good" : v < 0 ? "bad" : "warn";
    return v < 0 ? "good" : v > 0 ? "bad" : "warn";
  }
  void pad2;
  return [
    { label: "Total revenue",       value: money(s.totalRevenue),     hint: `${s.coverage.monthCount} mo` },
    { label: "Total expenses",      value: money(s.totalExpenses) },
    { label: "Net profit (P&L)",    value: money(s.netProfit),         tone: tone(s.netProfit) },
    { label: "Net margin",          value: pct(s.netMarginPct),        tone: tone(s.netMarginPct) },
    { label: "Avg monthly revenue", value: money(s.avgMonthlyRevenue) },
    { label: "Avg monthly expenses",value: money(s.avgMonthlyExpenses) },
    { label: "Avg monthly net",     value: money(s.avgMonthlyNet),     tone: tone(s.avgMonthlyNet) },
    { label: "Best revenue month",  value: s.bestRevenueMonth ? money(s.bestRevenueMonth.amount) : "—",  hint: s.bestRevenueMonth ? ymToLabel(s.bestRevenueMonth.ym) : undefined },
    { label: "Worst revenue month", value: s.worstRevenueMonth ? money(s.worstRevenueMonth.amount) : "—", hint: s.worstRevenueMonth ? ymToLabel(s.worstRevenueMonth.ym) : undefined },
    { label: "Months in the red",   value: `${s.monthsInRed} / ${s.coverage.monthCount}`, tone: s.monthsInRed > s.coverage.monthCount / 2 ? "bad" : s.monthsInRed > 0 ? "warn" : "good" },
    { label: `Revenue vs ${s.year - 1}`,  value: s.revenueYoYPct == null ? "—" : (s.revenueYoYPct >= 0 ? "+" : "") + fmtPct(s.revenueYoYPct), tone: tone(s.revenueYoYPct) },
    { label: `Expenses vs ${s.year - 1}`, value: s.expensesYoYPct == null ? "—" : (s.expensesYoYPct >= 0 ? "+" : "") + fmtPct(s.expensesYoYPct), tone: tone(s.expensesYoYPct, "lower") },
    { label: `Net vs ${s.year - 1}`,      value: s.netYoYPct == null ? "—" : (s.netYoYPct >= 0 ? "+" : "") + fmtPct(s.netYoYPct), tone: tone(s.netYoYPct) },
    { label: "Avg headcount",       value: s.avgHeadcount.toFixed(1),  hint: `start ${s.startHeadcount} → end ${s.endHeadcount}` },
    { label: "Hires / departures",  value: `${s.newHires} / ${s.terminations}` },
    { label: "Total payroll",       value: money(s.totalPayroll),      hint: pct(s.payrollPctRevenue) + " of revenue" },
    { label: "Total marketing",     value: money(s.totalMarketing),    hint: pct(s.marketingPctRevenue) + " of revenue" },
    { label: "One-time expenses",   value: money(s.totalOneTime),      hint: pct(s.oneTimeShareOfExpenses) + " of expenses" },
    { label: "Top expense category",value: s.topCategoryByExpense ? money(s.topCategoryByExpense.amount) : "—", hint: s.topCategoryByExpense?.name },
    { label: "Top vendor",          value: s.topVendorByExpense ? money(s.topVendorByExpense.amount) : "—", hint: s.topVendorByExpense?.vendor },
  ];
}
