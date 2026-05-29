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
  // Each signal is structured as three explicit parts so the UI can
  // render them with distinct emphasis (executive briefing tone):
  //   observation     - WHAT happened. Concise, headline-style.
  //   interpretation  - WHY it matters. The AI's analytical read.
  //   recommendation  - WHAT to do next. Suggested action.
  observation: string;
  interpretation: string;
  recommendation: string;
  impact: number; // signed monthly $ - positive = savings or new revenue
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
  // Currencies seen in the underlying transactions when they differ
  // from the base currency, with a row count per pair. Lets the AI
  // notice "your USD revenue was stable but your ILS-reported revenue
  // dropped because the dollar weakened" - i.e. distinguish operating
  // moves from FX moves. Empty array means everything is single-currency.
  currencyMix?: { currency: string; count: number }[];
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
  // Centralized forecast engine summary - what the user sees on the
  // Forecast tab, in structured form. Lets the AI explain projection
  // context (readiness, baseline, confidence, outliers, recurring,
  // seasonality, warnings) instead of fabricating a forecast story.
  forecastEngine?: {
    readiness: "disabled" | "basic" | "standard" | "reliable" | "advanced";
    baselineLabel: string;
    monthsResolved: number;
    confidence: "low" | "medium" | "high";
    confidenceScore: number;
    seasonalityApplied: boolean;
    outlierMonths: string[];
    recurringSamples: string[];
    warnings: string[];
    explanation: string;
  };
  uncategorizedCount: number;
  totalThisMonth: number;
  // Tab-level snapshots - what the user sees in their app:
  // /data-flow grid for the last 18 months (carry-forward-0 rule applied),
  // /manual-data entries currently in effect, and /data-log of recent uploads.
  dataFlow: DataFlowGrid;
  manualEntries: ManualEntryInfo[];
  recentUploads: RecentUploadInfo[];
  // User-supplied free-text notes from the underlying transactions,
  // bucketed by vendor and by category for the trailing 3 months. Used
  // by the signal generators to quote real context the user provided
  // (e.g. "Owner funding due to delayed USD conversion") rather than
  // describing numbers in the abstract.
  notesByVendor: Record<string, NoteInfo[]>;
  notesByCategory: Record<string, NoteInfo[]>;
};

export type NoteInfo = {
  date: string;          // ISO yyyy-mm-dd
  ym: string;            // accounting month
  vendor: string | null;
  amount: number;        // signed
  note: string;
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

  // ── Tab-level snapshots - what the user sees in /data-flow, /manual-data,
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

  // Pull every transaction with a non-empty note from the last 3 accounting
  // months, then bucket by vendor and by category name. Signal generators
  // read these maps to quote the user's own context back at them when a
  // flagged vendor or category has a note attached.
  const trail3YMs = [0, 1, 2].map((i) => shiftYM(baseYM, -i));
  const notedTxns = await prisma.transaction.findMany({
    where: {
      businessId,
      accountingMonth: { in: trail3YMs },
      notes: { not: null },
    },
    include: { category: { select: { name: true } } },
    orderBy: { transactionDate: "desc" },
    take: 200,
  });
  const notesByVendor: Record<string, NoteInfo[]> = {};
  const notesByCategory: Record<string, NoteInfo[]> = {};
  for (const t of notedTxns) {
    const note = (t.notes ?? "").trim();
    if (!note) continue;
    const entry: NoteInfo = {
      date: t.transactionDate.toISOString().slice(0, 10),
      ym: t.accountingMonth,
      vendor: t.vendor,
      amount: t.amount,
      note,
    };
    if (t.vendor) {
      (notesByVendor[t.vendor] ??= []).push(entry);
    }
    const catName = t.category?.name;
    if (catName) {
      (notesByCategory[catName] ??= []).push(entry);
    }
  }

  // Centralized forecast engine summary - best-effort; if the engine
  // can't produce a forecast (not enough data) we leave the field
  // undefined and the prompt's missing-context language handles it.
  let forecastEngineSummary: BusinessContext["forecastEngine"];
  try {
    const { buildForecastEngine, isForecastReady } = await import("./forecastEngine");
    const fe = await buildForecastEngine({
      businessId,
      baselineId: "recommended",
      horizonId:  "12m",
    });
    if (isForecastReady(fe)) {
      // Map engine state back to readiness. We re-derive from monthsResolved.
      const readiness =
        fe.baselinePeriod.monthsResolved >= 18 ? "advanced"  :
        fe.baselinePeriod.monthsResolved >= 12 ? "reliable"  :
        fe.baselinePeriod.monthsResolved >= 6  ? "standard"  :
                                                 "basic";
      forecastEngineSummary = {
        readiness,
        baselineLabel:      fe.baselinePeriod.label,
        monthsResolved:     fe.baselinePeriod.monthsResolved,
        confidence:         fe.confidence,
        confidenceScore:    fe.confidenceScore,
        seasonalityApplied: fe.seasonalityApplied,
        outlierMonths:      fe.outliersDetected.map((o) => o.ym),
        recurringSamples:   fe.recurringDetected.slice(0, 5).map((r) => r.description),
        warnings:           fe.warnings,
        explanation:        fe.explanationText,
      };
    } else {
      forecastEngineSummary = {
        readiness:          "disabled",
        baselineLabel:      "-",
        monthsResolved:     0,
        confidence:         "low",
        confidenceScore:    0,
        seasonalityApplied: false,
        outlierMonths:      [],
        recurringSamples:   [],
        warnings:           [fe.message],
        explanation:        fe.message,
      };
    }
  } catch {
    // Engine failure should never break consultation - leave undefined.
  }

  // Currency mix - non-base currencies that show up in this business's
  // transactions. Built from the multi-currency snapshot fields so it
  // reflects what was actually imported, not the business's setting.
  const fxRows = await prisma.$queryRaw<Array<{ currency: string; count: bigint }>>`
    SELECT
      UPPER(COALESCE("originalCurrency", "currency")) AS currency,
      COUNT(*)::bigint                                AS count
    FROM "Transaction"
    WHERE "businessId" = ${businessId}
      AND UPPER(COALESCE("originalCurrency", "currency")) <> UPPER(${ccy})
    GROUP BY UPPER(COALESCE("originalCurrency", "currency"))
    ORDER BY count DESC
  `;
  const currencyMix = fxRows.map((r) => ({ currency: r.currency, count: Number(r.count) }));

  return {
    ccy,
    currencyMix,
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
    forecastEngine: forecastEngineSummary,
    uncategorizedCount,
    totalThisMonth,
    dataFlow,
    manualEntries,
    recentUploads,
    notesByVendor,
    notesByCategory,
  };
}

// Pick the most relevant note for a given key and format it as a short
// inline quote the signal interpretation can append. Most-recent note
// wins, capped at ~140 chars so it doesn't overrun the card.
function quoteRelevantNote(notes: NoteInfo[] | undefined): string {
  if (!notes || notes.length === 0) return "";
  const n = notes[0]; // already sorted desc by transactionDate
  const trimmed = n.note.length > 140 ? `${n.note.slice(0, 137).trim()}…` : n.note;
  return ` Your own note on this from ${ymToLabel(n.ym)}: "${trimmed}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Push recommendations (proactive - no question)
// ─────────────────────────────────────────────────────────────────────────────

export async function recommendProactive(
  businessId: string,
  ctx: BusinessContext,
): Promise<AdvisorRecommendation[]> {
  const { ccy, current, prev, avgRevenue, avgMarketing, marketingRatio, forecast,
    topVendors, uncategorizedCount, totalThisMonth } = ctx;
  // Always-absolute period labels. Signals must say "April 2026" rather than
  // "this month" - relative wording rots the second the user reads it later
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
      observation: `Marketing is ${fmtPct(marketingRatio)} of revenue - above the 25% guardrail.`,
      interpretation: `Across ${trail3Label} you averaged ${fmtMoney(avgMarketing, ccy)}/mo in marketing on ${fmtMoney(avgRevenue, ccy)}/mo of revenue. Spend at this intensity leaves little room to absorb a slow month and usually signals declining campaign efficiency.`,
      recommendation: `A/B-test a reduced spend month before committing - trimming to ~20% of revenue would free roughly ${fmtMoney(trim, ccy)}/mo without disrupting top performers.`,
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
      observation: `Marketing cut held in ${curLabel} without hurting revenue.`,
      interpretation: `Marketing went from ${fmtMoney(prev.marketing, ccy)} in ${prevLabel} to ${fmtMoney(current.marketing, ccy)} in ${curLabel} while revenue stayed flat - efficiency improved, not just spend.`,
      recommendation: `Lock in the savings unless you start seeing your sales pipeline drop in 60-90 days. The early signs to watch: cost to bring in each new customer creeping up, and a smaller share of leads turning into customers.`,
      impact: round0(prev.marketing - current.marketing),
      category: "marketing",
      signalKey: "marketing_cut_held",
    });
  }

  // 3. Vendor cost spike - compare top vendors current vs prev month
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
          observation: `${v.vendor} cost rose ${fmtPct((v.amount - prevAmt) / prevAmt)} in ${curLabel} vs ${prevLabel}.`,
          interpretation: `${v.vendor} went from ${fmtMoney(prevAmt, ccy)} to ${fmtMoney(v.amount, ccy)} in a single month. Spend moves of this size are usually a scope change, a price hike, or an unauthorized add-on - rarely random.${quoteRelevantNote(ctx.notesByVendor[v.vendor])}`,
          recommendation: `Ask the vendor for a line-item breakdown of the increase. A 10% renegotiation on the new total would recover ${fmtMoney(v.amount * 0.10, ccy)}/mo.`,
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
      observation: `${ymToLabel(forecast[0].ym)} is forecast to run negative - projected net ${fmtMoney(forecast[0].expectedNet, ccy)}.`,
      interpretation: `Based on current trailing run-rates of revenue and expenses, next month closes ${fmtMoney(gap, ccy)} short. This is the kind of gap that compounds - if you don't close it now, the month after gets worse.`,
      recommendation: `Pick one lever today: accelerate receivables, cut ${fmtMoney(gap, ccy)} of recurring spend, or draw from reserves. Use Consultation to model which path costs the business least.`,
      impact: round0(gap),
      category: "cashflow",
      signalKey: "forecast_negative_next_month",
    });
  }

  // 5. Payroll-heavy
  if (avgRevenue > 0 && ctx.avgPayroll / avgRevenue > 0.5) {
    recs.push({
      level: "warn",
      observation: `Payroll is ${fmtPct(ctx.avgPayroll / avgRevenue)} of revenue - heavy for your run-rate.`,
      interpretation: `Across ${trail3Label}, ${fmtMoney(ctx.avgPayroll, ccy)}/mo of payroll sits against ${fmtMoney(avgRevenue, ccy)}/mo revenue. Above 50% the business runs on a thin operational margin and a slow month flips you to a loss.`,
      recommendation: `Grow revenue per head or rebalance the team. Start with role-level revenue contribution - under-utilized seats are the safest place to look first.`,
      impact: 0,
      category: "payroll",
      signalKey: "payroll_heavy",
    });
  }

  // 6. Uncategorized noise → accuracy
  if (totalThisMonth > 0 && uncategorizedCount / totalThisMonth > 0.20) {
    recs.push({
      level: "info",
      observation: `${uncategorizedCount} ${curLabel} transactions are still uncategorized (${fmtPct(uncategorizedCount / totalThisMonth)}).`,
      interpretation: `Uncategorized transactions hide in your totals as "Other" - they distort every category-based signal here, including margin, payroll ratio, and vendor concentration.`,
      recommendation: `Start with the Rules page to auto-classify the recurring stuff. Cleaning this is the single highest-leverage data action you can take.`,
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
      observation: `Healthy margin with light marketing in ${curLabel} - you have growth headroom.`,
      interpretation: `Net profit is ${fmtPct(current.netProfit / avgRevenue)} of revenue and marketing is only ${fmtPct(marketingRatio)}. Profitable businesses under-investing in acquisition tend to plateau - you're leaving growth on the table.`,
      recommendation: `Try one month with marketing spend up 25%, then check whether the cost to win each new customer stayed the same or got better. Use Consultation to model the cash impact before committing.`,
      impact: 0,
      category: "growth",
      signalKey: "growth_headroom",
    });
  }

  // 8. Largest single vendor concentration. Includes a peer-context
  // sentence comparing against the second-largest vendor so the user
  // can see how dominant the top one really is.
  if (topVendors[0] && current.expenses > 0 && topVendors[0].amount / current.expenses > 0.20) {
    const top = topVendors[0];
    const second = topVendors[1];
    const ratio = second && second.amount > 0 ? top.amount / second.amount : null;
    const peerContext = ratio != null
      ? ` By comparison, your next-largest vendor (${second.vendor}) is ${ratio.toFixed(1)}× smaller - concentration in ${top.vendor} is structural, not noise.`
      : ` ${top.vendor} is the only vendor at this scale in your data, which is precisely why a price move there has nowhere to hide.`;
    recs.push({
      level: "warn",
      observation: `${top.vendor} accounts for ${fmtPct(top.amount / current.expenses)} of your ${curLabel} expenses (${fmtMoney(top.amount, ccy)}).`,
      interpretation: `When a single vendor controls this much of your spend, a price hike, outage, or scope shift hits the business disproportionately, and negotiating leverage erodes over time.${peerContext}${quoteRelevantNote(ctx.notesByVendor[top.vendor])}`,
      recommendation: `Open a renegotiation conversation with ${top.vendor} - even a 10% discount frees ${fmtMoney(top.amount * 0.10, ccy)}/mo. In parallel, identify one credible alternative; the leverage of having an option matters more than the option itself.`,
      impact: round0(top.amount * 0.10),
      category: "vendor",
      signalKey: `vendor_concentration:${top.vendor}`,
    });
  }

  // 9. Revenue MoM swing - observation, fires regardless of sign
  if (prev.income > 1000 && Math.abs(current.income - prev.income) / prev.income >= 0.05) {
    const delta = current.income - prev.income;
    const pct = delta / prev.income;
    recs.push({
      level: delta >= 0 ? "good" : "warn",
      observation: delta >= 0
        ? `Revenue rose ${fmtPct(pct)} in ${curLabel} (${fmtMoney(prev.income, ccy)} → ${fmtMoney(current.income, ccy)}).`
        : `Revenue fell ${fmtPct(Math.abs(pct))} in ${curLabel} (${fmtMoney(prev.income, ccy)} → ${fmtMoney(current.income, ccy)}).`,
      interpretation: delta >= 0
        ? `A month-over-month swing of this size usually traces to a single channel or contract - knowing which one tells you whether it's repeatable or a one-off bump.`
        : `A drop of this size typically reflects either lost contracts, channel decay, or seasonal softness. Identifying which determines whether you act or wait.`,
      recommendation: delta >= 0
        ? `Identify the channel or deal that drove the upside and check whether you can replicate the conditions next month.`
        : `Pull the top 5 revenue sources in ${prevLabel} vs ${curLabel} and isolate which one moved. That's where the answer is.`,
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
      observation: `Net margin in ${curLabel}: ${fmtPct(margin)} (${fmtMoney(current.netProfit, ccy)} on ${fmtMoney(current.income, ccy)} revenue).`,
      interpretation: margin >= 0.20
        ? `Margins above 20% give you the operational cushion to invest, retain talent through downturns, and weather slow months without painful cuts.`
        : margin >= 0
          ? `Sub-20% margin is workable but thin. One slow month or a single unplanned expense can flip the period negative - you're operating without much of a safety net.`
          : `Running at a loss this month means every expense is eroding cash reserves. The longer this state continues, the fewer options you have when you finally act.`,
      recommendation: margin >= 0.20
        ? `Hold the line on discretionary spend so this margin survives any slow months. Use the cushion to make one growth bet, not five.`
        : margin >= 0
          ? `Identify two expense categories you can trim by 10% without operational impact - that's typically enough to lift margin into a healthier band.`
          : `Use Forecast to model what trimming your top two expense categories does. Treat this as urgent, not a "next quarter" project.`,
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
        observation: `${catName} is your largest expense in ${curLabel} - ${fmtMoney(amt, ccy)} (${fmtPct(share)} of total).`,
        interpretation: `When a single bucket dominates this much of your spend, it defines the floor on what you can cut without structural changes - every other category combined is smaller.${quoteRelevantNote(ctx.notesByCategory[catName])}`,
        recommendation: `Categorize this bucket: fixed (rent, salaries) vs variable (vendors, tools). The variable share is where realistic cuts live.`,
        impact: 0,
        category: "other",
        signalKey: `top_expense_category:${catName}`,
      });
    }
  }

  // 12. Expense MoM jump - separate from vendor spikes. Drills into
  // which expense categories actually drove the increase, so the
  // signal reads like a CFO note ("Software up X, Marketing up Y")
  // instead of a generic alert.
  if (prev.expenses > 1000 && current.expenses > prev.expenses * 1.15) {
    const delta = current.expenses - prev.expenses;
    // Compute per-category contribution to the jump. byCategory stores
    // signed amounts (negative for expenses), so we compare |current| to
    // |prev| per category and rank by the largest positive contribution.
    const catDeltas: { name: string; delta: number; cur: number }[] = [];
    const allCats = new Set([
      ...Object.keys(current.byCategory),
      ...Object.keys(prev.byCategory),
    ]);
    for (const name of allCats) {
      const curVal = Math.abs(current.byCategory[name] ?? 0);
      const prevVal = Math.abs(prev.byCategory[name] ?? 0);
      const d = curVal - prevVal;
      // Only count categories whose net moved in the expense direction.
      // We require both that the signed value in current is negative
      // (i.e. an expense category) and that the delta is positive (grew).
      if ((current.byCategory[name] ?? 0) <= 0 && d > 0) {
        catDeltas.push({ name, delta: d, cur: curVal });
      }
    }
    catDeltas.sort((a, b) => b.delta - a.delta);
    const drivers = catDeltas.slice(0, 2);
    const driversShare = drivers.reduce((s, d) => s + d.delta, 0) / Math.max(delta, 1);

    const driverText =
      drivers.length === 0
        ? `The increase is spread across many small categories rather than a single dominant driver.`
        : drivers.length === 1
          ? `Most of the move came from ${drivers[0].name} (${fmtMoney(drivers[0].delta, ccy)} higher than ${prevLabel}, or roughly ${fmtPct(driversShare)} of the total increase).`
          : `${drivers[0].name} and ${drivers[1].name} drove the bulk of it - ${fmtMoney(drivers[0].delta, ccy)} and ${fmtMoney(drivers[1].delta, ccy)} above ${prevLabel} respectively, together about ${fmtPct(driversShare)} of the increase.`;

    // If any of the current-month notes might explain the jump (e.g.
    // "One-time office renovation"), surface the most recent one inline.
    const curMonthNotes = Object.values(ctx.notesByCategory)
      .flat()
      .filter((n) => n.ym === ctx.ym);

    recs.push({
      level: "warn",
      observation: `Operating expenses rose ${fmtPct(delta / prev.expenses)} in ${curLabel} - ${fmtMoney(delta, ccy)} above ${prevLabel}.`,
      interpretation: `${driverText} A jump of this size usually traces to a new vendor contract, an annual charge landing in-month, or quiet creep across recurring tools - rarely random.${quoteRelevantNote(curMonthNotes)}`,
      recommendation: drivers.length > 0
        ? `Open ${drivers[0].name} in the Transactions tab filtered to ${curLabel} and isolate the line items that account for the bulk of the increase. The answer is almost always 2–3 specific transactions.`
        : `Scan the Transactions tab filtered to ${curLabel}, sort by amount, and isolate the 2–3 line items doing the most work.`,
      impact: 0,
      category: "cashflow",
      signalKey: "expense_mom_jump",
    });
  }

  // 13. Trailing 3-month net summary - always-on observation
  if (ctx.trailing.length >= 3) {
    const last3 = ctx.trailing.slice(-3);
    const trailingNet = last3.reduce((s, m) => s + m.net, 0);
    recs.push({
      level: trailingNet >= 0 ? "good" : "warn",
      observation: `Trailing 3-month net (${trail3Label}): ${fmtMoney(trailingNet, ccy)}.`,
      interpretation: `The 3-month view smooths out single-month noise. A single bad month is variance - three in a row is a trend that needs an explanation.`,
      recommendation: trailingNet >= 0
        ? `You're operating in a stable band. Use the breathing room to make one investment in growth or resilience, not five.`
        : `Treat this as your direction of travel, not a one-off. Identify the structural cause (revenue softening, expense creep, payroll growth) and act on that, not the symptom.`,
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
      observation: `${curLabel} revenue: ${fmtMoney(current.income, ccy)}.`,
      interpretation: `Booked income for ${curLabel}. The number itself doesn't say much in isolation - context comes from comparing to your trailing average and the same month last year.`,
      recommendation: `Compare against your ${trail3Label} average to gauge whether ${curLabel} is on track. Open Charts for the full trend view.`,
      impact: 0,
      category: "growth",
      signalKey: "monthly_revenue_snapshot",
    });
  }

  // 15. Current-month expense snapshot
  if (current.expenses > 0) {
    recs.push({
      level: "info",
      observation: `${curLabel} total expenses: ${fmtMoney(current.expenses, ccy)}.`,
      interpretation: `Captures payroll, recurring software, marketing, and any one-time costs booked in ${curLabel}. Without a breakdown, it's just a number - the categories underneath are where decisions live.`,
      recommendation: `Open the Charts tab to see which categories drove ${curLabel}'s spend. Look for any single category over 25% of total - that's your biggest lever.`,
      impact: 0,
      category: "cashflow",
      signalKey: "monthly_expense_snapshot",
    });
  }

  // 16. Trailing 3-month average revenue
  if (avgRevenue > 0) {
    recs.push({
      level: "info",
      observation: `Trailing 3-month average revenue: ${fmtMoney(avgRevenue, ccy)}/mo.`,
      interpretation: `Your operational revenue baseline. Anchored at the latest complete month so an in-progress month never drags the average down - this is the number to plan against.`,
      recommendation: `Treat this as your floor for forecasting. Any commitment whose monthly cost exceeds 10% of this baseline deserves a second look.`,
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
      observation: `Recurring expense base: ${fmtMoney(recurringMonthly, ccy)}/mo.`,
      interpretation: `${curLabel} expenses with one-time items stripped out. This is the number you have to cover every month no matter what happens to revenue - the structural floor of the business.`,
      recommendation: `Know this number cold. It's the minimum you need to bring in every month, and it's what you'd divide your cash balance by to see how many months of reserves you have.`,
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
      observation: `${ytdYear} YTD net: ${fmtMoney(ytdNet, ccy)} across ${ytdMonths.length} month${ytdMonths.length === 1 ? "" : "s"} (margin ${ytdRev > 0 ? fmtPct(ytdNet / ytdRev) : "-"}).`,
      interpretation: `Revenue ${fmtMoney(ytdRev, ccy)} − expenses ${fmtMoney(ytdExp, ccy)}. The year-to-date view tells you whether you're operationally on plan or whether monthly variance is masking a structural issue.`,
      recommendation: ytdNet >= 0
        ? `Hold pace. Compare against your full-year target - if you're tracking ahead, that's where to think about strategic investments.`
        : `Build a recovery plan now while there's still time in the year. A mid-year cut is far less painful than a year-end one.`,
      impact: 0,
      category: "other",
      signalKey: "ytd_snapshot",
    });
  }

  // 19. Active employee headcount + cost
  if (ctx.employees.length > 0) {
    recs.push({
      level: "info",
      observation: `${ctx.employees.length} active employee${ctx.employees.length === 1 ? "" : "s"} - fully-loaded cost ${fmtMoney(ctx.employeeCostMonthly, ccy)}/mo.`,
      interpretation: `Payroll is usually the largest single commitment in a business and the slowest to flex. Knowing the fully-loaded number - not just gross - is the difference between accurate planning and surprise overruns.`,
      recommendation: `Open Workforce Overview for the per-employee breakdown. Verify roles, multipliers, and end dates are current.`,
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
      observation: daysAgo > 21
        ? `No new data uploads in ${daysAgo} days.`
        : `Latest upload was ${daysAgo === 0 ? "today" : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`} - data is fresh.`,
      interpretation: daysAgo > 21
        ? `Every signal on this page depends on the freshness of your underlying data. After three weeks of staleness, recommendations start drifting from your actual operational reality.`
        : `Fresh data means the signals you're looking at reflect what's actually happening in the business - not last quarter's snapshot.`,
      recommendation: daysAgo > 21
        ? `Import ${curLabel}'s transactions this week. The longer you wait, the more decisions get made against stale numbers.`
        : `Keep this cadence. A weekly or twice-monthly upload rhythm gives you the cleanest read on trends.`,
      impact: 0,
      category: "accuracy",
      signalKey: "upload_freshness",
    });
  }

  // Empty fallback
  if (recs.length === 0) {
    recs.push({
      level: "good",
      observation: `No urgent signals across ${trail3Label}.`,
      interpretation: `Nothing currently crosses the thresholds we monitor for revenue swings, expense jumps, vendor concentration, payroll burden, or cashflow risk. Either the business is operating in a stable band or there isn't enough data yet to surface meaningful patterns.`,
      recommendation: `Use Consultation to model specific scenarios - pricing changes, hiring decisions, or cost reductions you're considering.`,
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
  content: string;            // markdown text (always present - used as fallback)
  payload?: {
    horizons?: HorizonBlock[];
  };
  // Phase-1 structured response from Claude. When present, the UI
  // renders this as a stack of cards (executive decision · confidence
  // · drivers · risks · recommendation) instead of plain markdown.
  // Older messages / mock responses leave this undefined.
  structured?: import("./advisorTypes").StructuredAdvice;
};

const intentSavings = /\b(sav|cut|reduc|trim|lower|shrink)/i;
const intentGrowth = /\b(grow|scal|expand|hir|invest|increase revenue)/i;
const intentRunway = /\b(runway|how long|months left|months of runway)/i;

export function parseTargetAmount(message: string): number | null {
  // Strict: only match if the number has a clear money signal -
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

  // Plain words - these don't fight numbered patterns because they require
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
// single horizon. Pure function over a monthlyTarget - no horizon math here.
function buildSavingsOptions(
  ctx: BusinessContext,
  monthlyTarget: number,
): SavingsOption[] {
  const { ccy, avgMarketing, employees, topVendors, marketingRatio } = ctx;

  // Marketing-only - capped at 60% of trailing average
  const marketingCut = Math.min(avgMarketing * 0.6, monthlyTarget);
  // Vendor renegotiation - 12% on top 3 non-payroll vendors
  const vendorPool = topVendors.slice(0, 3);
  const vendorSavings = vendorPool.reduce((s, v) => s + v.amount * 0.12, 0);
  // Headcount - greedy cut highest-cost employees until target hit
  const empSorted = [...employees].sort((a, b) => b.total - a.total);
  const headcountPicks: EmployeeInfo[] = [];
  let acc = 0;
  for (const e of empSorted) {
    if (acc >= monthlyTarget) break;
    headcountPicks.push(e);
    acc += e.total;
  }
  const headcountSavings = acc;
  // Recommended mix - 40% marketing, 30% vendors, 30% headcount (smallest first)
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
        "Lowest growth-risk option. Tradeoff is your time - 1–3 weeks of negotiation and possible service-level concessions. Some vendors won't budge without a competitive bid.",
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
        "Highest one-time cost (severance, productivity gap, morale, recruiter cost to backfill later). Takes 4–8 weeks to materialize in cash. Strict cost ranking only - this engine cannot weigh individual contribution. Confirm with whoever knows the team's output.",
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
      `You're asking about ${hs.length} horizons. Each requires a different monthly cut profile - softer cuts work over longer windows, while a quarter target forces sharper moves.`,
    );
  }
  lines.push("");

  for (const block of blocks) {
    if (hs.length > 1) {
      lines.push(`#### Over ${block.label} (${block.months} months) - need ~${fmtMoney(block.monthlyTarget, ccy)}/mo`);
      lines.push("");
    }
    for (const o of block.options) {
      const totalSaved = o.monthlySavings * block.months;
      const coversPct = totalSaved / target;
      lines.push(
        `**${o.title}** - saves ${fmtMoney(o.monthlySavings, ccy)}/mo (${fmtMoney(o.annualSavings, ccy)}/yr · covers ${fmtPct(coversPct)} of target over ${block.months}mo)`,
      );
      lines.push(o.tradeoff);
      lines.push("");
    }
    // Coverage note for this horizon
    const bestSavings = block.options[0]?.monthlySavings ?? 0;
    if (bestSavings * block.months < target) {
      lines.push(
        `> ⚠ Over ${block.label.toLowerCase()}, the strongest single strategy covers ${fmtMoney(bestSavings * block.months, ccy)} - short of the ${fmtMoney(target, ccy)} target. Combine the top two, or stretch the horizon.`,
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
      `> Heads-up: next month is already forecast at **${fmtMoney(forecast[0].expectedNet, ccy)}** - pure savings won't get you positive on their own; you also need ${fmtMoney(Math.abs(forecast[0].expectedNet), ccy)}/mo from the revenue side or one-time inflows.`,
    );
    lines.push("");
  }
  lines.push(
    `_This analysis is built on ranked cost data only. It cannot weigh individual contribution, contracts, customer relationships, or growth potential - apply judgment._`,
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
      `**Pricing** - fastest. A 5–10% list-price increase on existing customers is usually absorbed with minimal churn. Modeled gain: ${fmtMoney(avgRevenue * 0.075, ccy)}/mo at +7.5%.`,
      `**Conversion** - sharpen your sales process: tighter qualification, faster follow-up, lift close-rate by 2–3 pts. No new spend.`,
      `**Re-activation** - campaign to dormant customers (>6 months silent). Cheapest pipeline you have access to right now.`,
    ];
  }
  if (months <= 12) {
    return [
      `**Marketing investment** - bring spend to about 10% of revenue if you're below it. As a rule of thumb, don't spend more than a third of a customer's annual value to win them. Expect payback within 60-90 days.`,
      `**Pricing** - still the fastest lever; revisit in three months once you have a read on how customers respond.`,
      `**One sales hire** - only if you have a repeatable channel. Adds ${fmtMoney(8000, ccy)}-${fmtMoney(15000, ccy)}/mo loaded cost; expect break-even in month 4-6.`,
      `**Retention** - each percentage point of churn you eliminate adds the same to customer lifetime value. Cheapest growth move you can make.`,
    ];
  }
  if (months <= 36) {
    return [
      `**Channel diversification** - add a second acquisition channel that isn't correlated with the first. Risk of single-channel saturation grows over 2-year windows.`,
      `**Selective hiring** - sales/CS first if revenue-bottlenecked, ops/eng if delivery-bottlenecked. Plan in cohorts of 1–2, not waves.`,
      `**Pricing tier expansion** - launch a higher-tier or annual plan; this typically lifts average revenue per customer 15-25% over 24 months.`,
      `**Retention motion** - onboarding revamp + quarterly check-ins with top accounts. Reduces churn by 20-40% typical.`,
      `**Geographic or vertical expansion** - feasible at this horizon if your motion is repeatable in your home market.`,
    ];
  }
  return [
    `**Market expansion** - adjacent verticals or geographies. Plan for 18–24 months of investment before payback.`,
    `**Product breadth** - second product line or platform play. Usually requires hiring a product+eng pod for 12+ months ahead of revenue.`,
    `**Brand and category creation** - only worthwhile if you can dominate; otherwise a value trap.`,
    `**M&A or partnerships** - realistic at this horizon; can compress 3 years of growth into 12 months but adds integration risk.`,
    `**Org scaling** - leadership layer (VPs, finance, HR). Comes with a step-function cost increase; usually right around the $5-10M annual recurring revenue mark.`,
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
      `**Marketing is light at ${fmtPct(marketingRatio)} of revenue** while you're profitable - the cheapest growth move is to test raising it to about 10% of revenue (around ${fmtMoney(test, ccy)}/mo). Run for 60 days and check the cost to win each new customer plus the revenue from those customers before scaling further.`,
    );
  } else if (marketingRatio > 0.25) {
    lines.push(
      `**Marketing is already heavy at ${fmtPct(marketingRatio)} of revenue.** Adding more spend won't move the needle - focus on conversion (sales process, pricing, retention) or product expansion instead.`,
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
  const monthlyShortfall = Math.max(0, avgExpenses - avgRevenue);
  const lines: string[] = [];
  lines.push(`### How long your cash can support the business`);
  lines.push("");
  if (monthlyShortfall <= 0) {
    lines.push(
      `Good news: on the last 3 months you're bringing in more than you're spending (revenue ${fmtMoney(avgRevenue, ccy)}/mo vs expenses ${fmtMoney(avgExpenses, ccy)}/mo). At this pace you're not eating into your cash - how long your cash lasts depends only on what's already in the bank, not on your operations.`,
    );
    if (horizons.length > 0) {
      lines.push("");
      lines.push(`If you stay on this trajectory:`);
      for (const h of horizons) {
        const cumNet = (avgRevenue - avgExpenses) * h.months;
        lines.push(
          `- **${h.label} (${h.months} months):** about ${fmtMoney(cumNet, ccy)} added to cash - your reserves would *grow* by that amount.`,
        );
      }
    }
  } else {
    lines.push(
      `You're spending about ${fmtMoney(monthlyShortfall, ccy)} more per month than you bring in (${fmtMoney(avgExpenses, ccy)} expenses minus ${fmtMoney(avgRevenue, ccy)} revenue).`,
    );
    lines.push("");
    if (horizons.length > 0) {
      lines.push(`To make it through each window you'd need at least this much cash on hand at the start:`);
      for (const h of horizons) {
        lines.push(
          `- **${h.label} (${h.months} months):** ${fmtMoney(monthlyShortfall * h.months, ccy)}.`,
        );
      }
      lines.push("");
    }
    lines.push(
      `If you tell me your current cash balance in a follow-up ("we have $X in the bank"), I can give you a months-of-cash figure. Otherwise: divide cash on hand by ${fmtMoney(monthlyShortfall, ccy)} to see how many months it covers.`,
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
    `**This is a deterministic fallback advisor.** It can only answer four canned patterns: savings ("how do I save $X"), growth ("how do I grow revenue"), cash runway, or general financial state. For free-form questions - business strategy, hiring decisions, market trends, ideas - you need the real Claude integration.`,
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
  // Optional businessId so the Claude path can inject the Business
  // DNA profile into the system prompt. Backwards-compatible.
  businessId?: string,
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
        businessId,
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
