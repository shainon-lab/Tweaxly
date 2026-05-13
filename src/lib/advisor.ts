// Deterministic "AI advisor" for the MVP.
// Pulls a snapshot of the business from real data, then either:
//  - recommendProactive(): generates a ranked list of dashboard recommendations
//  - answerQuestion(): produces a written analysis for a consultation question
//
// Designed so swapping in a real LLM later is a single function: feed it the same
// BusinessContext + message and return content + payload.

import { prisma } from "./db";
import {
  buildMonthSnapshot,
  trailingMonthsSummary,
  activeEmployeeCost,
  listAccountingMonths,
  type MonthBuckets,
} from "./metrics";
import { buildForecast, type ForecastMonth } from "./forecast";
import { buildDataFlow, type DataFlowGrid } from "./dataflow";
import { fmtMoney, fmtPct, shiftYM, todayYM, ymToLabel } from "./format";

export type RecommendationItem = {
  label: string;
  amount: number;
  note?: string;
};

export type AdvisorRecommendation = {
  level: "info" | "good" | "warn" | "bad";
  title: string;
  detail: string;
  impact: number; // signed monthly $ — positive = savings or new revenue
  category:
    | "marketing"
    | "payroll"
    | "vendor"
    | "growth"
    | "accuracy"
    | "cashflow"
    | "other";
  // Stable identifier so the user's "don't show again" choice survives the
  // next regeneration of the same insight. Include any per-target qualifier
  // (e.g. vendor name) so muting one Acme spike doesn't mute Beta spikes.
  signalKey: string;
  payload?: { items?: RecommendationItem[] };
};

export type EmployeeInfo = {
  id: string;
  name: string;
  role: string | null;
  gross: number;
  multiplier: number;
  total: number; // gross * multiplier
};

export type ManualEntryInfo = {
  type: "income" | "outcome";
  categoryName: string;
  categoryKind: string;
  amount: number;
  frequency: string;
  startDate: string;       // ISO date
  endDate: string | null;  // ISO date or null
  notes: string | null;
};

export type RecentUploadInfo = {
  createdAt: string;            // ISO date
  mode: "transactions" | "monthly_summary" | string;
  source: string;
  filename: string;
  representsMonth: string | null;
  rowCount: number;
  transactionCount: number;
};

export type BusinessContext = {
  ccy: string;
  ym: string;
  current: MonthBuckets;
  prev: MonthBuckets;
  trailing: { ym: string; income: number; expenses: number; net: number }[];
  avgRevenue: number;
  avgExpenses: number;
  avgPayroll: number;
  avgMarketing: number;
  marketingRatio: number; // marketing / revenue averaged
  topVendors: { vendor: string; amount: number }[];
  topCategories: { name: string; amount: number; kind: string }[];
  employees: EmployeeInfo[];
  employeeCostMonthly: number;
  forecast: ForecastMonth[];
  uncategorizedCount: number;
  totalThisMonth: number;
  // Tab-level snapshots — what the user sees in their app:
  // /data-flow grid for the last 18 months (carry-forward-0 rule applied),
  // /manual-data entries currently in effect, and /data-log of recent uploads.
  dataFlow: DataFlowGrid;
  manualEntries: ManualEntryInfo[];
  recentUploads: RecentUploadInfo[];
};

const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
const round0 = (n: number) => Math.round(n);

export async function buildBusinessContext(
  businessId: string,
  ym?: string,
): Promise<BusinessContext> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const ccy = business?.currency ?? "USD";
  const months = await listAccountingMonths(businessId);
  const baseYM = ym ?? months[0] ?? todayYM();

  const [current, prev, trailing, employeeCost, forecast] = await Promise.all([
    buildMonthSnapshot(businessId, baseYM),
    buildMonthSnapshot(businessId, shiftYM(baseYM, -1)),
    trailingMonthsSummary(businessId, 6),
    activeEmployeeCost(businessId, baseYM),
    buildForecast(businessId, 3),
  ]);

  const trailing3Snaps: MonthBuckets[] = [];
  for (let i = 1; i <= 3; i++) {
    trailing3Snaps.push(await buildMonthSnapshot(businessId, shiftYM(baseYM, -i)));
  }
  const nz = (vals: number[]) => vals.filter((v) => v > 0);
  const avg = (vals: number[]) => {
    const f = nz(vals);
    return f.length ? f.reduce((s, v) => s + v, 0) / f.length : 0;
  };
  const avgRevenue = avg(trailing3Snaps.map((s) => s.income));
  const avgExpenses = avg(trailing3Snaps.map((s) => s.expenses));
  const avgPayroll = avg(trailing3Snaps.map((s) => s.payroll));
  const avgMarketing = avg(trailing3Snaps.map((s) => s.marketing));
  const marketingRatio = safeDiv(avgMarketing, avgRevenue);

  const vendorAgg = await prisma.transaction.groupBy({
    by: ["vendor"],
    where: {
      businessId,
      accountingMonth: baseYM,
      isExcludedFromPnl: false,
      type: { in: ["expense", "fee", "tax"] },
    },
    _sum: { amount: true },
  });
  const topVendors = vendorAgg
    .filter((r) => r.vendor)
    .map((r) => ({ vendor: r.vendor as string, amount: Math.abs(r._sum.amount ?? 0) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const topCategoriesRows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      businessId,
      accountingMonth: baseYM,
      isExcludedFromPnl: false,
      type: { in: ["expense", "fee", "tax", "payroll"] },
    },
    _sum: { amount: true },
  });
  const catIds = topCategoriesRows.map((r) => r.categoryId).filter(Boolean) as string[];
  const cats = catIds.length
    ? await prisma.category.findMany({ where: { id: { in: catIds } } })
    : [];
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const topCategories = topCategoriesRows
    .map((r) => {
      const c = r.categoryId ? catMap.get(r.categoryId) : null;
      return {
        name: c?.name ?? "Uncategorized",
        amount: Math.abs(r._sum.amount ?? 0),
        kind: c?.kind ?? "other",
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const empRows = await prisma.employee.findMany({
    where: {
      businessId,
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    orderBy: { grossMonthlySalary: "desc" },
  });
  const employees: EmployeeInfo[] = empRows.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    gross: e.grossMonthlySalary,
    multiplier: e.employerCostMultiplier,
    total: e.grossMonthlySalary * (e.employerCostMultiplier || 1),
  }));

  const uncategorizedCount = await prisma.transaction.count({
    where: {
      businessId,
      accountingMonth: baseYM,
      OR: [{ categoryId: null }, { category: { name: "Uncategorized" } }],
    },
  });
  const totalThisMonth = await prisma.transaction.count({
    where: { businessId, accountingMonth: baseYM },
  });

  // ── Tab-level snapshots — what the user sees in /data-flow, /manual-data,
  //    and /data-log. We cap the data-flow grid to the last 18 months to
  //    keep the prompt size predictable. Manual entries and recent uploads
  //    are pulled in full (capped at 50 / 25 respectively for the worst case).
  const startDate = new Date();
  startDate.setUTCMonth(startDate.getUTCMonth() - 17);
  const dataFlow = await buildDataFlow(
    businessId,
    "custom",
    null,
    startDate.toISOString(),
    new Date().toISOString(),
  );

  const manualEntryRows = await prisma.manualEntry.findMany({
    where: { businessId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const manualEntries: ManualEntryInfo[] = manualEntryRows.map((e) => ({
    type: e.type === "income" ? "income" : "outcome",
    categoryName: e.category.name,
    categoryKind: e.category.kind,
    amount: e.amount,
    frequency: e.frequency,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    notes: e.notes,
  }));

  const uploadRows = await prisma.uploadBatch.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { _count: { select: { transactions: true } } },
  });
  const recentUploads: RecentUploadInfo[] = uploadRows.map((u) => ({
    createdAt: u.createdAt.toISOString(),
    mode: u.mode,
    source: u.source,
    filename: u.filename,
    representsMonth: u.representsMonth,
    rowCount: u.rowCount,
    transactionCount: u._count.transactions,
  }));

  return {
    ccy,
    ym: baseYM,
    current,
    prev,
    trailing,
    avgRevenue,
    avgExpenses,
    avgPayroll,
    avgMarketing,
    marketingRatio,
    topVendors,
    topCategories,
    employees,
    employeeCostMonthly: employeeCost.total,
    forecast,
    uncategorizedCount,
    totalThisMonth,
    dataFlow,
    manualEntries,
    recentUploads,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Push recommendations (proactive — no question)
// ─────────────────────────────────────────────────────────────────────────────

export async function recommendProactive(
  businessId: string,
  ctx: BusinessContext,
): Promise<AdvisorRecommendation[]> {
  const { ccy, current, prev, avgRevenue, avgMarketing, marketingRatio, forecast,
    topVendors, uncategorizedCount, totalThisMonth } = ctx;
  // Always-absolute period labels. Signals must say "April 2026" rather than
  // "this month" — relative wording rots the second the user reads it later
  // or in a different time zone.
  const curLabel = ymToLabel(ctx.ym);
  const prevLabel = ymToLabel(shiftYM(ctx.ym, -1));
  const trail3 = ctx.trailing.slice(-3);
  const trail3Label = trail3.length === 3
    ? `${ymToLabel(trail3[0].ym)}–${ymToLabel(trail3[trail3.length - 1].ym)}`
    : "the trailing 3-month window";
  const recs: AdvisorRecommendation[] = [];

  // 1. Marketing intensity high
  if (marketingRatio > 0.25 && avgMarketing > 0) {
    const target = avgRevenue * 0.20;
    const trim = Math.max(0, avgMarketing - target);
    recs.push({
      level: "warn",
      title: `Marketing is ${fmtPct(marketingRatio)} of revenue across ${trail3Label} — above the 25% threshold`,
      detail: `Across ${trail3Label} you averaged ${fmtMoney(avgMarketing, ccy)}/mo in marketing on ${fmtMoney(avgRevenue, ccy)}/mo of revenue. Trimming to ~20% of revenue would free roughly ${fmtMoney(trim, ccy)}/mo. Worth A/B-testing a reduced spend month before committing.`,
      impact: round0(trim),
      category: "marketing",
      signalKey: "marketing_intensity_high",
    });
  }

  // 2. Marketing dropped, revenue stable → confirm cuts are sustainable
  if (prev.marketing > 0 && current.marketing < prev.marketing * 0.8 &&
      Math.abs(current.income - prev.income) / Math.max(prev.income, 1) < 0.10) {
    recs.push({
      level: "good",
      title: `Marketing cut held in ${curLabel} without hurting revenue`,
      detail: `Marketing went from ${fmtMoney(prev.marketing, ccy)} in ${prevLabel} to ${fmtMoney(current.marketing, ccy)} in ${curLabel} while revenue stayed flat. Lock in the savings unless you're seeing pipeline drop in 60–90 days.`,
      impact: round0(prev.marketing - current.marketing),
      category: "marketing",
      signalKey: "marketing_cut_held",
    });
  }

  // 3. Vendor cost spike — compare top vendors current vs prev month
  const watchedVendors = topVendors.slice(0, 5).map((v) => v.vendor);
  if (watchedVendors.length > 0) {
    const prevYM = shiftYM(ctx.ym, -1);
    const prevVendorAgg = await prisma.transaction.groupBy({
      by: ["vendor"],
      where: {
        businessId,
        accountingMonth: prevYM,
        vendor: { in: watchedVendors },
        isExcludedFromPnl: false,
        type: { in: ["expense", "fee", "tax"] },
      },
      _sum: { amount: true },
    });
    const prevByVendor = new Map(
      prevVendorAgg.map((r) => [r.vendor, Math.abs(r._sum.amount ?? 0)]),
    );
    for (const v of topVendors.slice(0, 5)) {
      const prevAmt = prevByVendor.get(v.vendor) ?? 0;
      if (prevAmt > 100 && v.amount > prevAmt * 1.4 && v.amount - prevAmt > 200) {
        recs.push({
          level: "warn",
          title: `${v.vendor} cost up ${fmtPct((v.amount - prevAmt) / prevAmt)} in ${curLabel} vs ${prevLabel}`,
          detail: `${v.vendor} went from ${fmtMoney(prevAmt, ccy)} in ${prevLabel} to ${fmtMoney(v.amount, ccy)} in ${curLabel}. If you didn't authorize a scope change, ask for a line-item breakdown. A 10% renegotiation on the new total would save ${fmtMoney(v.amount * 0.10, ccy)}/mo.`,
          impact: round0(v.amount * 0.10),
          category: "vendor",
          signalKey: `vendor_spike:${v.vendor}`,
        });
      }
    }
  }

  // 4. Cashflow next month negative
  if (forecast[0] && forecast[0].expectedNet < 0) {
    const gap = Math.abs(forecast[0].expectedNet);
    recs.push({
      level: "bad",
      title: `${ymToLabel(forecast[0].ym)} is forecast to run negative`,
      detail: `Projected net for ${ymToLabel(forecast[0].ym)}: ${fmtMoney(forecast[0].expectedNet, ccy)}. You'd need to find ${fmtMoney(gap, ccy)} either by accelerating receivables, cutting ${fmtMoney(gap, ccy)} of recurring spend, or pulling from reserves. See the Consultation page to model specific cuts.`,
      impact: round0(gap),
      category: "cashflow",
      signalKey: "forecast_negative_next_month",
    });
  }

  // 5. Payroll-heavy
  if (avgRevenue > 0 && ctx.avgPayroll / avgRevenue > 0.5) {
    recs.push({
      level: "warn",
      title: `Payroll is ${fmtPct(ctx.avgPayroll / avgRevenue)} of revenue across ${trail3Label}`,
      detail: `Average payroll across ${trail3Label} is ${fmtMoney(ctx.avgPayroll, ccy)}/mo against ${fmtMoney(avgRevenue, ccy)}/mo revenue. Above 50% leaves little room for overheads or downturns. Either grow revenue or rebalance the team.`,
      impact: 0,
      category: "payroll",
      signalKey: "payroll_heavy",
    });
  }

  // 6. Uncategorized noise → accuracy
  if (totalThisMonth > 0 && uncategorizedCount / totalThisMonth > 0.20) {
    recs.push({
      level: "info",
      title: `${uncategorizedCount} transactions still uncategorized in ${curLabel}`,
      detail: `${fmtPct(uncategorizedCount / totalThisMonth)} of ${curLabel} is uncategorized. Every other recommendation here gets sharper once you fix this — start with the Rules page to auto-classify the recurring stuff.`,
      impact: 0,
      category: "accuracy",
      signalKey: "uncategorized_high",
    });
  }

  // 7. Headroom to invest
  if (avgRevenue > 0 && current.netProfit > 0 &&
      current.netProfit / avgRevenue > 0.20 &&
      marketingRatio < 0.10) {
    recs.push({
      level: "info",
      title: `${curLabel}: healthy margin, light marketing — room to invest`,
      detail: `In ${curLabel}, net profit is ${fmtPct(current.netProfit / avgRevenue)} of revenue and marketing is only ${fmtPct(marketingRatio)}. You have headroom to test a +25% marketing month and measure CAC. See Consultation to model the impact.`,
      impact: 0,
      category: "growth",
      signalKey: "growth_headroom",
    });
  }

  // 8. Largest single vendor concentration
  if (topVendors[0] && current.expenses > 0 && topVendors[0].amount / current.expenses > 0.20) {
    recs.push({
      level: "warn",
      title: `${topVendors[0].vendor} is ${fmtPct(topVendors[0].amount / current.expenses)} of ${curLabel} expenses`,
      detail: `In ${curLabel}, that's a concentrated dependency. Worth a renegotiation conversation — even a 10% discount frees ${fmtMoney(topVendors[0].amount * 0.10, ccy)}/mo.`,
      impact: round0(topVendors[0].amount * 0.10),
      category: "vendor",
      signalKey: `vendor_concentration:${topVendors[0].vendor}`,
    });
  }

  // 9. Revenue MoM swing — observation, fires regardless of sign
  if (prev.income > 1000 && Math.abs(current.income - prev.income) / prev.income >= 0.05) {
    const delta = current.income - prev.income;
    const pct = delta / prev.income;
    recs.push({
      level: delta >= 0 ? "good" : "warn",
      title: delta >= 0
        ? `Revenue up ${fmtPct(pct)} in ${curLabel} vs ${prevLabel}`
        : `Revenue down ${fmtPct(Math.abs(pct))} in ${curLabel} vs ${prevLabel}`,
      detail: `Revenue moved from ${fmtMoney(prev.income, ccy)} in ${prevLabel} to ${fmtMoney(current.income, ccy)} in ${curLabel} (${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), ccy)}). Worth checking which channel or contract drove the change.`,
      impact: 0,
      category: "growth",
      signalKey: "revenue_mom_swing",
    });
  }

  // 10. Net margin observation
  if (current.income > 0) {
    const margin = current.netProfit / current.income;
    recs.push({
      level: margin >= 0.20 ? "good" : margin >= 0 ? "info" : "warn",
      title: `Net margin in ${curLabel}: ${fmtPct(margin)}`,
      detail: margin >= 0.20
        ? `${curLabel}: ${fmtMoney(current.netProfit, ccy)} net on ${fmtMoney(current.income, ccy)} revenue — healthy. Hold the line on discretionary spend to keep this through any slow months.`
        : margin >= 0
          ? `${curLabel}: ${fmtMoney(current.netProfit, ccy)} net on ${fmtMoney(current.income, ccy)} revenue. Sub-20% margin is workable but thin — one slow month could flip it negative.`
          : `${curLabel}: ${fmtMoney(current.netProfit, ccy)} net on ${fmtMoney(current.income, ccy)} revenue — running at a loss. Use Forecast to model what trimming top expense categories does.`,
      impact: 0,
      category: "cashflow",
      signalKey: "net_margin_observation",
    });
  }

  // 11. Top expense category callout
  const topExpenseCat = Object.entries(current.byCategory)
    .filter(([, v]) => v < 0)
    .sort((a, b) => a[1] - b[1])[0];
  if (topExpenseCat && current.expenses > 0) {
    const [catName, signed] = topExpenseCat;
    const amt = Math.abs(signed);
    const share = amt / current.expenses;
    if (share > 0.15) {
      recs.push({
        level: "info",
        title: `${catName} is your largest expense bucket in ${curLabel}`,
        detail: `In ${curLabel}: ${fmtMoney(amt, ccy)} (${fmtPct(share)} of expenses). If this is fixed, it sets a floor on what you can cut without structural changes.`,
        impact: 0,
        category: "other",
        signalKey: `top_expense_category:${catName}`,
      });
    }
  }

  // 12. Expense MoM jump — separate from vendor spikes
  if (prev.expenses > 1000 && current.expenses > prev.expenses * 1.15) {
    const delta = current.expenses - prev.expenses;
    recs.push({
      level: "warn",
      title: `Total expenses jumped ${fmtPct(delta / prev.expenses)} in ${curLabel} vs ${prevLabel}`,
      detail: `Expenses went from ${fmtMoney(prev.expenses, ccy)} in ${prevLabel} to ${fmtMoney(current.expenses, ccy)} in ${curLabel} (+${fmtMoney(delta, ccy)}). Worth scanning the Transactions tab to see which categories drove it.`,
      impact: 0,
      category: "cashflow",
      signalKey: "expense_mom_jump",
    });
  }

  // 13. Trailing 3-month net summary — always-on observation
  if (ctx.trailing.length >= 3) {
    const last3 = ctx.trailing.slice(-3);
    const trailingNet = last3.reduce((s, m) => s + m.net, 0);
    recs.push({
      level: trailingNet >= 0 ? "good" : "warn",
      title: `Net for ${trail3Label}: ${fmtMoney(trailingNet, ccy)}`,
      detail: `Sum of net profit across ${last3.map((m) => ymToLabel(m.ym)).join(", ")}. Use this as a stability check — a single bad month is noise, three in a row is a trend.`,
      impact: 0,
      category: "other",
      signalKey: "trailing_3_net",
    });
  }

  // ─── Always-fire observation signals so the pool never goes empty ────
  // These are intentionally informational. They give the box something
  // useful to show on day-one when no other condition has triggered yet.

  // 14. Current-month revenue snapshot
  if (current.income > 0) {
    recs.push({
      level: "info",
      title: `${curLabel} revenue: ${fmtMoney(current.income, ccy)}`,
      detail: `Booked income for ${curLabel}. Compare against the average to gauge whether ${curLabel} is on track.`,
      impact: 0,
      category: "growth",
      signalKey: "monthly_revenue_snapshot",
    });
  }

  // 15. Current-month expense snapshot
  if (current.expenses > 0) {
    recs.push({
      level: "info",
      title: `${curLabel} total expenses: ${fmtMoney(current.expenses, ccy)}`,
      detail: `Includes payroll, recurring software, marketing, and any one-time costs booked in ${curLabel}. Use the Insights tab to see which categories drove it.`,
      impact: 0,
      category: "cashflow",
      signalKey: "monthly_expense_snapshot",
    });
  }

  // 16. Trailing 3-month average revenue
  if (avgRevenue > 0) {
    recs.push({
      level: "info",
      title: `${fmtMoney(avgRevenue, ccy)}/mo average revenue across ${trail3Label}`,
      detail: `Your rolling 3-month revenue baseline. Anchored at the latest complete month so an in-progress month never drags it down.`,
      impact: 0,
      category: "growth",
      signalKey: "avg_revenue_trail3",
    });
  }

  // 17. Recurring expense run-rate (one-times stripped)
  const recurringMonthly = current.expenses - current.oneTime;
  if (recurringMonthly > 0) {
    recs.push({
      level: "info",
      title: `Recurring expense base: ${fmtMoney(recurringMonthly, ccy)}/mo`,
      detail: `${curLabel} expenses with one-time items stripped out. This is the floor — the number you have to cover every month no matter what.`,
      impact: 0,
      category: "cashflow",
      signalKey: "recurring_expense_base",
    });
  }

  // 18. Year-to-date snapshot if we have at least 3 months of trailing data
  // in the current year. Uses trailing[] which is already in ctx (last 6 mo).
  const ytdYear = ctx.ym.slice(0, 4);
  const ytdMonths = ctx.trailing.filter((m) => m.ym.startsWith(ytdYear));
  if (ytdMonths.length >= 2) {
    const ytdRev = ytdMonths.reduce((s, m) => s + m.income, 0);
    const ytdExp = ytdMonths.reduce((s, m) => s + m.expenses, 0);
    const ytdNet = ytdRev - ytdExp;
    recs.push({
      level: ytdNet >= 0 ? "good" : "warn",
      title: `${ytdYear} YTD net: ${fmtMoney(ytdNet, ccy)} across ${ytdMonths.length} month${ytdMonths.length === 1 ? "" : "s"}`,
      detail: `Revenue ${fmtMoney(ytdRev, ccy)} − expenses ${fmtMoney(ytdExp, ccy)} so far this year. Margin ${ytdRev > 0 ? fmtPct(ytdNet / ytdRev) : "—"}.`,
      impact: 0,
      category: "other",
      signalKey: "ytd_snapshot",
    });
  }

  // 19. Active employee headcount + cost
  if (ctx.employees.length > 0) {
    recs.push({
      level: "info",
      title: `${ctx.employees.length} active employee${ctx.employees.length === 1 ? "" : "s"} on the roster`,
      detail: `Fully-loaded monthly cost: ${fmtMoney(ctx.employeeCostMonthly, ccy)}. Use the Workforce Overview tab for the per-employee breakdown.`,
      impact: 0,
      category: "payroll",
      signalKey: "headcount_snapshot",
    });
  }

  // 20. Recent upload / data freshness reminder
  if (ctx.recentUploads.length > 0) {
    const latest = ctx.recentUploads[0];
    const latestDate = new Date(latest.createdAt);
    const daysAgo = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    recs.push({
      level: daysAgo > 21 ? "warn" : "info",
      title: daysAgo > 21
        ? `No new uploads in ${daysAgo} days`
        : `${ctx.recentUploads.length} upload${ctx.recentUploads.length === 1 ? "" : "s"} processed recently`,
      detail: daysAgo > 21
        ? `Last upload was ${daysAgo} days ago. Stale data makes every other signal less reliable — import this month's transactions when you can.`
        : `Latest upload was ${daysAgo === 0 ? "today" : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`}. Data is fresh.`,
      impact: 0,
      category: "accuracy",
      signalKey: "upload_freshness",
    });
  }

  // Empty fallback
  if (recs.length === 0) {
    recs.push({
      level: "good",
      title: "No urgent recommendations",
      detail: `Nothing in ${trail3Label} triggers an immediate action. Use Consultation to model specific scenarios.`,
      impact: 0,
      category: "other",
      signalKey: "empty_fallback",
    });
  }

  // Sort: bad → warn → info → good, then by impact desc
  const order = { bad: 0, warn: 1, info: 2, good: 3 } as const;
  recs.sort((a, b) => order[a.level] - order[b.level] || b.impact - a.impact);
  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consultation answer engine
// ─────────────────────────────────────────────────────────────────────────────

export type SavingsOption = {
  title: string;
  monthlySavings: number;
  annualSavings: number;
  tradeoff: string;
  items: RecommendationItem[];
};

export type HorizonBlock = {
  label: string;          // "Quarter" | "Year" | "2 years" | etc.
  months: number;
  monthlyTarget: number;
  totalTarget: number;
  options: SavingsOption[];
};

export type ConsultationAnswer = {
  content: string;            // markdown text
  payload?: {
    horizons?: HorizonBlock[];
  };
};

const intentSavings = /\b(sav|cut|reduc|trim|lower|shrink)/i;
const intentGrowth = /\b(grow|scal|expand|hir|invest|increase revenue)/i;
const intentRunway = /\b(runway|how long|months left|months of runway)/i;

export function parseTargetAmount(message: string): number | null {
  // Strict: only match if the number has a clear money signal —
  //   $ prefix, OR  k/m unit (with word boundary so "3-year" doesn't match)
  // This avoids treating "5 years" or "3 months" as savings targets.

  // Try $-prefixed first
  const dollar = message.match(/\$\s*([0-9][\d,\s]*(?:\.\d+)?)\s*(k|m)?\b/i);
  if (dollar) {
    const raw = dollar[1].replace(/[\s,]/g, "");
    const num = Number(raw);
    if (isFinite(num) && num > 0) {
      const unit = (dollar[2] || "").toLowerCase();
      if (unit === "k") return num * 1_000;
      if (unit === "m") return num * 1_000_000;
      return num < 1000 ? num * 1_000 : num;
    }
  }
  // Then numbers with explicit k/m unit (e.g. "save 20K")
  const km = message.match(/\b([0-9]+(?:\.\d+)?)\s*(k|m)\b/i);
  if (km) {
    const raw = km[1];
    const num = Number(raw);
    if (isFinite(num) && num > 0) {
      const unit = km[2].toLowerCase();
      if (unit === "k") return num * 1_000;
      if (unit === "m") return num * 1_000_000;
    }
  }
  return null;
}

// Detect time-horizon language in a question.
// Returns horizons in ascending months order.
// Recognized phrasing:
//   - "X year(s)" / "X-year"  with X ∈ 1..5
//   - "X month(s)"            with X ∈ 1..60
//   - "quarter" / "quarterly" / "this/next quarter"
//   - "year" / "yearly" / "annual" / "annually" / "this/next year" / "in a year"
//   - "long-term" / "5-year"
export function parseHorizons(
  message: string,
): { months: number; label: string }[] {
  const text = " " + message.toLowerCase() + " ";
  const found = new Map<number, string>();

  const numWord: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
  };

  // "<n> year(s)"
  const yearRe = /\b(\d+|one|two|three|four|five)\s*-?\s*years?\b/g;
  let m: RegExpExecArray | null;
  while ((m = yearRe.exec(text)) !== null) {
    const n = numWord[m[1]] ?? Number(m[1]);
    if (n >= 1 && n <= 5) {
      const months = n * 12;
      found.set(months, n === 1 ? "Year" : `${n} years`);
    }
  }

  // "<n> month(s)"
  const monthRe = /\b(\d+|three|six|twelve|eighteen)\s*-?\s*months?\b/g;
  const monthWord: Record<string, number> = {
    three: 3, six: 6, twelve: 12, eighteen: 18,
  };
  while ((m = monthRe.exec(text)) !== null) {
    const n = monthWord[m[1]] ?? Number(m[1]);
    if (n >= 1 && n <= 60) {
      const label = n === 3 ? "Quarter" : n === 12 ? "Year" : `${n} months`;
      // Don't downgrade "Year" to plain month label if already added at 12mo
      if (!found.has(n)) found.set(n, label);
    }
  }

  // Plain words — these don't fight numbered patterns because they require
  // a non-digit context ("this/next year" doesn't match "5 years").
  const yearLeads = /\b(this|next|coming|in\s+a|over\s+(a|the)|across\s+(a|the)|during\s+(a|the))\s+year\b/;
  const quarterLeads = /\b(this|next|coming|in\s+a|over\s+(a|the)|across\s+(a|the)|during\s+(a|the))\s+quarter\b/;
  if (/\bquarter(ly)?\b/.test(text) || quarterLeads.test(text)) {
    if (!found.has(3)) found.set(3, "Quarter");
  }
  if (/\b(annually|yearly)\b/.test(text) || yearLeads.test(text)) {
    if (!found.has(12)) found.set(12, "Year");
  }
  if (/\blong[-\s]?term\b/.test(text)) {
    if (!found.has(60)) found.set(60, "5 years");
  }

  return Array.from(found.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([months, label]) => ({ months, label }));
}

// Build the four savings options (marketing / vendors / headcount / mix) for a
// single horizon. Pure function over a monthlyTarget — no horizon math here.
function buildSavingsOptions(
  ctx: BusinessContext,
  monthlyTarget: number,
): SavingsOption[] {
  const { ccy, avgMarketing, employees, topVendors, marketingRatio } = ctx;

  // Marketing-only — capped at 60% of trailing average
  const marketingCut = Math.min(avgMarketing * 0.6, monthlyTarget);
  // Vendor renegotiation — 12% on top 3 non-payroll vendors
  const vendorPool = topVendors.slice(0, 3);
  const vendorSavings = vendorPool.reduce((s, v) => s + v.amount * 0.12, 0);
  // Headcount — greedy cut highest-cost employees until target hit
  const empSorted = [...employees].sort((a, b) => b.total - a.total);
  const headcountPicks: EmployeeInfo[] = [];
  let acc = 0;
  for (const e of empSorted) {
    if (acc >= monthlyTarget) break;
    headcountPicks.push(e);
    acc += e.total;
  }
  const headcountSavings = acc;
  // Recommended mix — 40% marketing, 30% vendors, 30% headcount (smallest first)
  const mixMarketing = Math.min(avgMarketing * 0.4, monthlyTarget * 0.4);
  const mixVendors = Math.min(vendorSavings, monthlyTarget * 0.3);
  const empAsc = [...employees].sort((a, b) => a.total - b.total);
  const mixHeadcountTarget = monthlyTarget * 0.3;
  const mixHeadcountPicks: EmployeeInfo[] = [];
  let mixHcAcc = 0;
  for (const e of empAsc) {
    if (mixHcAcc >= mixHeadcountTarget) break;
    mixHeadcountPicks.push(e);
    mixHcAcc += e.total;
  }
  const mixSavings = mixMarketing + mixVendors + mixHcAcc;

  const options: SavingsOption[] = [];

  if (marketingCut > 0) {
    options.push({
      title: "Marketing only",
      monthlySavings: round0(marketingCut),
      annualSavings: round0(marketingCut * 12),
      tradeoff:
        marketingRatio > 0.20
          ? "Marketing is already a big share of revenue, so a measured cut shouldn't hit pipeline immediately. Risk: 60–90-day delayed revenue drop if cuts hit performing channels."
          : "Marketing is already lean. Cutting further will likely slow new-customer acquisition and show up as a revenue dip in Q+1 or Q+2.",
      items: [
        {
          label: "Reduce monthly marketing spend",
          amount: round0(marketingCut),
          note: `From ${fmtMoney(avgMarketing, ccy)} → ${fmtMoney(avgMarketing - marketingCut, ccy)}`,
        },
      ],
    });
  }

  if (vendorSavings > 0) {
    options.push({
      title: "Vendor renegotiation",
      monthlySavings: round0(vendorSavings),
      annualSavings: round0(vendorSavings * 12),
      tradeoff:
        "Lowest growth-risk option. Tradeoff is your time — 1–3 weeks of negotiation and possible service-level concessions. Some vendors won't budge without a competitive bid.",
      items: vendorPool.map((v) => ({
        label: `Negotiate 10–15% with ${v.vendor}`,
        amount: round0(v.amount * 0.12),
        note: `Currently ${fmtMoney(v.amount, ccy)}/mo`,
      })),
    });
  }

  if (headcountPicks.length > 0) {
    options.push({
      title: "Headcount reduction",
      monthlySavings: round0(headcountSavings),
      annualSavings: round0(headcountSavings * 12),
      tradeoff:
        "Highest one-time cost (severance, productivity gap, morale, recruiter cost to backfill later). Takes 4–8 weeks to materialize in cash. Strict cost ranking only — this engine cannot weigh individual contribution. Confirm with whoever knows the team's output.",
      items: headcountPicks.map((e) => ({
        label: `${e.name}${e.role ? ` (${e.role})` : ""}`,
        amount: round0(e.total),
        note: `Loaded cost ${fmtMoney(e.total, ccy)}/mo (gross ${fmtMoney(e.gross, ccy)} × ${e.multiplier.toFixed(2)})`,
      })),
    });
  }

  if (mixSavings > 0) {
    options.push({
      title: "Recommended mix",
      monthlySavings: round0(mixSavings),
      annualSavings: round0(mixSavings * 12),
      tradeoff:
        "Spreads the impact across categories so no single area absorbs the full hit. Lower growth risk than marketing-only and lower disruption than headcount-only. Best default unless you have a strong reason to concentrate.",
      items: [
        ...(mixMarketing > 0
          ? [{ label: "Trim marketing 40% of target", amount: round0(mixMarketing) }]
          : []),
        ...(mixVendors > 0
          ? [{ label: "Renegotiate top vendors 30% of target", amount: round0(mixVendors) }]
          : []),
        ...mixHeadcountPicks.map((e) => ({
          label: `Right-size: ${e.name}${e.role ? ` (${e.role})` : ""}`,
          amount: round0(e.total),
        })),
      ],
    });
  }

  // Pin "Recommended mix" first; rest by monthlySavings desc
  options.sort((a, b) => {
    if (a.title.startsWith("Recommended")) return -1;
    if (b.title.startsWith("Recommended")) return 1;
    return b.monthlySavings - a.monthlySavings;
  });
  return options;
}

function savingsAnswer(
  ctx: BusinessContext,
  target: number,
  horizons: { months: number; label: string }[],
): ConsultationAnswer {
  const { ccy, avgMarketing, avgRevenue, employees, marketingRatio, forecast } = ctx;
  const monthlyBurn = ctx.avgExpenses;
  // Default to a quarter if the user gave no horizon
  const hs = horizons.length ? horizons : [{ months: 3, label: "Quarter" }];

  const blocks: HorizonBlock[] = hs.map((h) => {
    const monthlyTarget = target / h.months;
    return {
      label: h.label,
      months: h.months,
      monthlyTarget: round0(monthlyTarget),
      totalTarget: target,
      options: buildSavingsOptions(ctx, monthlyTarget),
    };
  });

  // Build narrative
  const lines: string[] = [];
  lines.push(`### Saving ${fmtMoney(target, ccy)}`);
  lines.push("");
  lines.push(
    `Based on your last 3 months: avg revenue **${fmtMoney(avgRevenue, ccy)}/mo**, avg expenses **${fmtMoney(monthlyBurn, ccy)}/mo**, marketing **${fmtMoney(avgMarketing, ccy)}/mo** (${fmtPct(marketingRatio)} of revenue), payroll roster **${fmtMoney(ctx.employeeCostMonthly, ccy)}/mo** across **${employees.length}** employee${employees.length === 1 ? "" : "s"}.`,
  );
  lines.push("");
  if (hs.length === 1) {
    lines.push(
      `To save ${fmtMoney(target, ccy)} over **${hs[0].label.toLowerCase()}** (${hs[0].months} month${hs[0].months === 1 ? "" : "s"}) you need about **${fmtMoney(blocks[0].monthlyTarget, ccy)}/mo** in cuts (or new revenue). Here are four paths, ranked by lowest-risk-first:`,
    );
  } else {
    lines.push(
      `You're asking about ${hs.length} horizons. Each requires a different monthly cut profile — softer cuts work over longer windows, while a quarter target forces sharper moves.`,
    );
  }
  lines.push("");

  for (const block of blocks) {
    if (hs.length > 1) {
      lines.push(`#### Over ${block.label} (${block.months} months) — need ~${fmtMoney(block.monthlyTarget, ccy)}/mo`);
      lines.push("");
    }
    for (const o of block.options) {
      const totalSaved = o.monthlySavings * block.months;
      const coversPct = totalSaved / target;
      lines.push(
        `**${o.title}** — saves ${fmtMoney(o.monthlySavings, ccy)}/mo (${fmtMoney(o.annualSavings, ccy)}/yr · covers ${fmtPct(coversPct)} of target over ${block.months}mo)`,
      );
      lines.push(o.tradeoff);
      lines.push("");
    }
    // Coverage note for this horizon
    const bestSavings = block.options[0]?.monthlySavings ?? 0;
    if (bestSavings * block.months < target) {
      lines.push(
        `> ⚠ Over ${block.label.toLowerCase()}, the strongest single strategy covers ${fmtMoney(bestSavings * block.months, ccy)} — short of the ${fmtMoney(target, ccy)} target. Combine the top two, or stretch the horizon.`,
      );
    } else {
      lines.push(
        `> Over ${block.label.toLowerCase()}, the "Recommended mix" hits the target with the smallest concentration of impact in any single area.`,
      );
    }
    lines.push("");
  }

  if (forecast[0] && forecast[0].expectedNet < 0) {
    lines.push(
      `> Heads-up: next month is already forecast at **${fmtMoney(forecast[0].expectedNet, ccy)}** — pure savings won't get you positive on their own; you also need ${fmtMoney(Math.abs(forecast[0].expectedNet), ccy)}/mo from the revenue side or one-time inflows.`,
    );
    lines.push("");
  }
  lines.push(
    `_This analysis is built on ranked cost data only. It cannot weigh individual contribution, contracts, customer relationships, or growth potential — apply judgment._`,
  );

  return { content: lines.join("\n"), payload: { horizons: blocks } };
}

// Per-horizon growth lever set. Tone shifts by horizon length:
//  - quarter (≤3mo): pricing, conversion
//  - year (4–12mo): marketing investment with payback math
//  - 2–3 years: channel diversification, hiring, retention
//  - 5+ years: market expansion, product moat, org scale
function growthLeversFor(
  ctx: BusinessContext,
  months: number,
): string[] {
  const { ccy, avgRevenue } = ctx;
  if (months <= 3) {
    return [
      `**Pricing** — fastest. A 5–10% list-price increase on existing customers is usually absorbed with minimal churn. Modeled gain: ${fmtMoney(avgRevenue * 0.075, ccy)}/mo at +7.5%.`,
      `**Conversion** — sharpen your sales process: tighter qualification, faster follow-up, lift close-rate by 2–3 pts. No new spend.`,
      `**Re-activation** — campaign to dormant customers (>6 months silent). Cheapest pipeline you have access to right now.`,
    ];
  }
  if (months <= 12) {
    return [
      `**Marketing investment** — bring spend to ~10% of revenue if you're below it. Set a CAC ceiling = 1/3 of annual contract value. 60–90-day payback expected.`,
      `**Pricing** — still the fastest lever; revisit in Q2 once you have signal on demand elasticity.`,
      `**One sales hire** — only if you have a repeatable channel. Adds ${fmtMoney(8000, ccy)}–${fmtMoney(15000, ccy)}/mo loaded cost; expect break-even in month 4–6.`,
      `**Retention** — every 1pt churn improvement adds 1pt LTV. Cheapest-to-action growth.`,
    ];
  }
  if (months <= 36) {
    return [
      `**Channel diversification** — add a second acquisition channel that isn't correlated with the first. Risk of single-channel saturation grows over 2-year windows.`,
      `**Selective hiring** — sales/CS first if revenue-bottlenecked, ops/eng if delivery-bottlenecked. Plan in cohorts of 1–2, not waves.`,
      `**Pricing tier expansion** — launch a higher-tier or annual plan; uplift to ARPU is usually 15–25% over 24 months.`,
      `**Retention motion** — onboarding revamp + QBRs for top accounts. Reduces churn by 20–40% typical.`,
      `**Geographic or vertical expansion** — feasible at this horizon if your motion is repeatable in your home market.`,
    ];
  }
  return [
    `**Market expansion** — adjacent verticals or geographies. Plan for 18–24 months of investment before payback.`,
    `**Product breadth** — second product line or platform play. Usually requires hiring a product+eng pod for 12+ months ahead of revenue.`,
    `**Brand and category creation** — only worthwhile if you can dominate; otherwise a value trap.`,
    `**M&A or partnerships** — realistic at this horizon; can compress 3 years of growth into 12 months but adds integration risk.`,
    `**Org scaling** — leadership layer (VPs, finance, HR). Comes with a step-function cost increase; usually right at the $5–10M ARR mark.`,
  ];
}

function growthAnswer(
  ctx: BusinessContext,
  horizons: { months: number; label: string }[],
): ConsultationAnswer {
  const { ccy, avgRevenue, avgMarketing, marketingRatio, current, employees } = ctx;
  const hs = horizons.length ? horizons : [{ months: 12, label: "Year" }];
  const lines: string[] = [];
  lines.push(`### Growth analysis`);
  lines.push("");
  lines.push(
    `Snapshot: ${fmtMoney(avgRevenue, ccy)}/mo revenue (3-mo avg), marketing ${fmtPct(marketingRatio)} of revenue, ${employees.length} active employee${employees.length === 1 ? "" : "s"}, current month net ${fmtMoney(current.netProfit, ccy)}.`,
  );
  lines.push("");
  if (marketingRatio < 0.10 && current.netProfit > 0) {
    const test = round0(avgMarketing > 0 ? avgMarketing * 1.5 : avgRevenue * 0.10);
    lines.push(
      `**Marketing is light at ${fmtPct(marketingRatio)} of revenue** while you're profitable — the cheapest growth lever is to test increasing it to ~10% of revenue (about ${fmtMoney(test, ccy)}/mo). Run for 60 days and measure CAC + new-customer revenue before scaling further.`,
    );
  } else if (marketingRatio > 0.25) {
    lines.push(
      `**Marketing is already heavy at ${fmtPct(marketingRatio)} of revenue.** Adding more spend won't move the needle — focus on conversion (sales process, pricing, retention) or product expansion instead.`,
    );
  } else {
    lines.push(
      `**Marketing is in a normal range (${fmtPct(marketingRatio)} of revenue).** Growth from here likely comes from one of: a new channel, raising prices on existing customers, or expanding the product/service catalog.`,
    );
  }
  lines.push("");
  for (const h of hs) {
    if (hs.length > 1) {
      lines.push(`#### Over ${h.label} (${h.months} months)`);
      lines.push("");
    } else {
      lines.push(`Levers most relevant over ${h.label.toLowerCase()} (${h.months} month${h.months === 1 ? "" : "s"}):`);
      lines.push("");
    }
    const levers = growthLeversFor(ctx, h.months);
    for (const l of levers) lines.push(`- ${l}`);
    lines.push("");
  }
  lines.push(
    `_Ask a follow-up like "model a 10% price increase" or "what if we hired one more rep?" for a tighter scenario._`,
  );
  return { content: lines.join("\n") };
}

function runwayAnswer(
  ctx: BusinessContext,
  horizons: { months: number; label: string }[],
): ConsultationAnswer {
  const { ccy, avgRevenue, avgExpenses, current } = ctx;
  const monthlyBurn = Math.max(0, avgExpenses - avgRevenue);
  const lines: string[] = [];
  lines.push(`### Cash runway`);
  lines.push("");
  if (monthlyBurn <= 0) {
    lines.push(
      `You're net-positive on the trailing 3-month average (revenue ${fmtMoney(avgRevenue, ccy)}/mo vs expenses ${fmtMoney(avgExpenses, ccy)}/mo). At current rates you're not burning runway — runway is bounded by cash reserves only, not by your operating losses.`,
    );
    if (horizons.length > 0) {
      lines.push("");
      lines.push(`Asked about specific horizons:`);
      for (const h of horizons) {
        const cumNet = (avgRevenue - avgExpenses) * h.months;
        lines.push(
          `- **${h.label} (${h.months}mo):** cumulative net ${fmtMoney(cumNet, ccy)} on current trajectory. Cash position would *grow* by that amount if reserves are flat.`,
        );
      }
    }
  } else {
    lines.push(
      `Trailing burn = ${fmtMoney(monthlyBurn, ccy)}/mo (${fmtMoney(avgExpenses, ccy)} expenses − ${fmtMoney(avgRevenue, ccy)} revenue).`,
    );
    lines.push("");
    if (horizons.length > 0) {
      lines.push(`To survive each horizon you'd need at least:`);
      for (const h of horizons) {
        lines.push(
          `- **${h.label} (${h.months}mo):** ${fmtMoney(monthlyBurn * h.months, ccy)} of cash on hand at the start.`,
        );
      }
      lines.push("");
    }
    lines.push(
      `If you tell me your current cash balance in a follow-up ("we have $X in the bank"), I can give a runway figure. Otherwise: divide cash on hand by ${fmtMoney(monthlyBurn, ccy)}/mo.`,
    );
  }
  lines.push("");
  lines.push(`Current month net: **${fmtMoney(current.netProfit, ccy)}**.`);
  return { content: lines.join("\n") };
}

function generalAnswer(
  ctx: BusinessContext,
  horizons: { months: number; label: string }[],
): ConsultationAnswer {
  const { ccy, current, avgRevenue, avgExpenses, marketingRatio, employees, forecast } = ctx;
  const lines: string[] = [];
  lines.push(`### Free-form Q&A needs the AI integration enabled`);
  lines.push("");
  lines.push(
    `**This is a deterministic fallback advisor.** It can only answer four canned patterns: savings ("how do I save $X"), growth ("how do I grow revenue"), cash runway, or general financial state. For free-form questions — business strategy, hiring decisions, market trends, ideas — you need the real Claude integration.`,
  );
  lines.push("");
  lines.push(`**To enable free-form answers:**`);
  lines.push("");
  lines.push(`1. Get an API key at https://console.anthropic.com/`);
  lines.push(`2. Open \`.env\` in your project root`);
  lines.push(`3. Uncomment the \`ANTHROPIC_API_KEY="..."\` line and paste your key`);
  lines.push(`4. Restart the dev server`);
  lines.push("");
  lines.push(`Once that's done, every question routes to Claude with your full business context (last 18 months of data, every category, every vendor, every employee, every manual entry, every upload). It can answer general business questions too, not just data-grounded ones.`);
  lines.push("");
  lines.push(`---`);
  lines.push("");
  lines.push(`### Where you stand right now`);
  lines.push("");
  lines.push(
    `For ${ymToLabel(ctx.ym)}: revenue ${fmtMoney(current.income, ccy)}, expenses ${fmtMoney(current.expenses, ccy)}, net **${fmtMoney(current.netProfit, ccy)}**. Trailing-3 averages: ${fmtMoney(avgRevenue, ccy)} / ${fmtMoney(avgExpenses, ccy)} / ${fmtMoney(avgRevenue - avgExpenses, ccy)}.`,
  );
  if (horizons.length > 0) {
    lines.push("");
    lines.push(`You mentioned: ${horizons.map((h) => h.label.toLowerCase()).join(", ")}. Flat-rate projection:`);
    for (const h of horizons) {
      const cumNet = (avgRevenue - avgExpenses) * h.months;
      lines.push(
        `- **${h.label}:** cumulative net ~${fmtMoney(cumNet, ccy)} (${fmtMoney(avgRevenue * h.months, ccy)} income − ${fmtMoney(avgExpenses * h.months, ccy)} expenses, no growth assumed).`,
      );
    }
  }
  lines.push("");
  lines.push(
    `Quick read: marketing is ${fmtPct(marketingRatio)} of revenue, ${employees.length} active employees, ${forecast[0] ? `next month forecast ${fmtMoney(forecast[0].expectedNet, ccy)}` : "no forecast yet"}.`,
  );
  return { content: lines.join("\n") };
}

// Deterministic mock that handles four canned intents (savings / growth /
// runway / general). Used as the fallback when ANTHROPIC_API_KEY is not set
// or when a Claude API call fails.
export function answerQuestionMock(
  ctx: BusinessContext,
  message: string,
): ConsultationAnswer {
  const trimmed = message.trim();
  const horizons = parseHorizons(trimmed);
  if (intentRunway.test(trimmed)) return runwayAnswer(ctx, horizons);
  if (intentSavings.test(trimmed)) {
    const target = parseTargetAmount(trimmed) ?? Math.max(ctx.avgExpenses * 0.10, 5000);
    return savingsAnswer(ctx, target, horizons);
  }
  if (intentGrowth.test(trimmed)) return growthAnswer(ctx, horizons);
  // If a number is mentioned without "save", still treat as savings target
  const num = parseTargetAmount(trimmed);
  if (num && num >= 1000) return savingsAnswer(ctx, num, horizons);
  return generalAnswer(ctx, horizons);
}

// answerQuestion is the public entry point used by /api/consultation.
// When ANTHROPIC_API_KEY is set, it calls real Claude with the full business
// context and the conversation history. When the key is missing or the call
// fails, it transparently falls back to the deterministic mock above.
//
// Returns the answer plus a `mode` flag so the caller (and eventually the UI)
// can show the user which engine produced the response.
export type AdvisorAnswer = {
  answer: ConsultationAnswer;
  mode: "claude" | "mock";
};

export async function answerQuestion(
  ctx: BusinessContext,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<AdvisorAnswer> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Reject obvious placeholders to avoid silent 401s on unconfigured envs.
  const looksReal =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  if (looksReal) {
    try {
      // Lazy import so the SDK isn't loaded into the bundle when not in use.
      const mod = await import("./claudeAdvisor");
      const answer = await mod.answerQuestionWithClaude(
        ctx,
        message,
        history,
        apiKey!,
      );
      return { answer, mode: "claude" };
    } catch (e) {
      // Don't expose API errors to the user; log server-side and fall back.
      console.error("[advisor] Claude API call failed; falling back to mock:", e);
    }
  }

  return { answer: answerQuestionMock(ctx, message), mode: "mock" };
}

export function deriveTitle(message: string): string {
  const t = message.trim().replace(/\s+/g, " ");
  return t.length > 80 ? t.slice(0, 77) + "…" : t;
}
