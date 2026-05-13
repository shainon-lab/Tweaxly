// Dashboard Insights — a grid of visual cards (Trend, Cash flow, Top
// expense categories, Revenue channel, Spending shape, Swing, Top vendors)
// all scoped to a single user-chosen period (month / quarter / year).
//
// The filter lives in the header next to the "Insights" title. Picking a new
// period redraws every card below.

import { listAccountingMonths, trailingMonthsSummary } from "@/lib/metrics";
import { buildPeriodAggregate } from "@/lib/period";
import { todayYM, shiftYM, ymToLabel, fmtMoney, dateToYM } from "@/lib/format";
import {
  resolvePeriod,
  isValidGranularity,
  type Granularity,
  type PeriodSpec,
} from "@/lib/reportPeriod";
import { prisma } from "@/lib/db";
import { TrendChart, CategoryBars, CashflowChart } from "@/components/Charts";
import DashboardInsightsPicker from "./DashboardInsightsPicker";

type PickerGranularity = Granularity | "custom" | "trailing6" | "all";

export default async function DashboardInsights({
  businessId,
  currency,
  granularity,
  anchor,
  from,
  to,
}: {
  businessId: string;
  currency: string;
  granularity: string | undefined;
  anchor: string | undefined;
  from?: string;
  to?: string;
}) {
  // ── Resolve the active period ──────────────────────────────────────────
  let pickerGran: PickerGranularity;
  let pickerAnchor: string;
  let pickerFrom: string | undefined;
  let pickerTo: string | undefined;
  let period: PeriodSpec;
  let monthSpan: number;
  let priorLabel: string;

  // Default to the current year (or the latest year that has data) when no
  // explicit granularity is in the URL — Charts opens on a 12-month view
  // so the user immediately sees the full year's shape.
  const effectiveGran =
    granularity === "custom"    ? "custom"    :
    granularity === "trailing6" ? "trailing6" :
    granularity === "all"       ? "all"       :
    isValidGranularity(granularity) ? granularity :
    "year";

  if (effectiveGran === "custom" && from && to) {
    // Custom date-to-date range. We always work in YM buckets because that's
    // how transactions are stored (accountingMonth), so the start/end days
    // collapse to their containing months.
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    const fromYM = dateToYM(new Date(a + "T00:00:00Z"));
    const toYM = dateToYM(new Date(b + "T00:00:00Z"));
    monthSpan = monthsBetween(fromYM, toYM);
    period = {
      granularity: "month",
      anchor: fromYM,
      fromYM,
      toYM,
      label:
        fromYM === toYM
          ? ymToLabel(fromYM)
          : `${ymToLabel(fromYM)} → ${ymToLabel(toYM)}`,
    };
    pickerGran = "custom";
    pickerAnchor = fromYM;
    pickerFrom = a;
    pickerTo = b;
    priorLabel = "prior window";
  } else if (effectiveGran === "trailing6") {
    // Trailing 6 months ending at the latest month that actually has data.
    const months = await listAccountingMonths(businessId);
    const toYM = months[0] ?? todayYM();
    const fromYM = shiftYM(toYM, -5);
    monthSpan = 6;
    period = {
      granularity: "month",
      anchor: toYM,
      fromYM,
      toYM,
      label: `${ymToLabel(fromYM)} → ${ymToLabel(toYM)}`,
    };
    pickerGran = "trailing6";
    pickerAnchor = toYM;
    priorLabel = "prior 6 months";
  } else if (effectiveGran === "all") {
    // All time — earliest data month through latest. listAccountingMonths
    // returns desc, so [0] = latest, last = earliest.
    const months = await listAccountingMonths(businessId);
    const toYM = months[0] ?? todayYM();
    const fromYM = months[months.length - 1] ?? toYM;
    monthSpan = monthsBetween(fromYM, toYM);
    period = {
      granularity: "month",
      anchor: toYM,
      fromYM,
      toYM,
      label:
        fromYM === toYM
          ? ymToLabel(fromYM)
          : `${ymToLabel(fromYM)} → ${ymToLabel(toYM)}`,
    };
    pickerGran = "all";
    pickerAnchor = toYM;
    priorLabel = "prior window";
  } else {
    const gran: Granularity = effectiveGran as Granularity;
    let chosen = anchor;
    if (!chosen) {
      const months = await listAccountingMonths(businessId);
      const latestYM = months[0] ?? todayYM();
      const [y, m] = latestYM.split("-").map(Number);
      chosen =
        gran === "month"   ? latestYM :
        gran === "quarter" ? `${y}-Q${Math.ceil(m / 3)}` :
                             String(y);
    }
    period = resolvePeriod(gran, chosen);
    pickerGran = gran;
    pickerAnchor = period.anchor;
    monthSpan = gran === "quarter" ? 3 : gran === "year" ? 12 : 1;
    priorLabel = `prior ${gran}`;
  }

  // Period aggregate + the immediately-prior window of the same shape (for
  // the Swing card).
  const prevFromYM = shiftYM(period.fromYM, -monthSpan);
  const prevToYM = shiftYM(period.toYM, -monthSpan);
  // Trend / Cash flow series covers exactly the chosen window — same months
  // every other card in the grid is built from.
  const trendMonths = monthSpan;
  const [aggregate, prevAggregate, trend, topVendorsRows] = await Promise.all([
    buildPeriodAggregate(businessId, period.fromYM, period.toYM),
    buildPeriodAggregate(businessId, prevFromYM, prevToYM),
    trailingMonthsSummary(businessId, trendMonths, period.toYM),
    prisma.transaction.groupBy({
      by: ["vendor"],
      where: {
        businessId,
        accountingMonth: { gte: period.fromYM, lte: period.toYM },
        isExcludedFromPnl: false,
        type: { in: ["expense", "fee", "tax"] },
        vendor: { not: null },
      },
      _sum: { amount: true },
    }),
  ]);

  // Top outcome categories for the period.
  const topCategories = Object.entries(aggregate.byCategory)
    .filter(([, v]) => v < 0)
    .map(([name, v]) => ({ name, amount: Math.abs(v) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Revenue channel — income split by category.
  const revenueChannel = Object.entries(aggregate.byCategory)
    .filter(([, v]) => v > 0)
    .map(([name, v]) => ({ name, amount: v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Spending shape — outcome by accounting kind.
  const spendingShape = [
    { name: "Fixed",     amount: aggregate.fixed },
    { name: "Variable",  amount: aggregate.variable },
    { name: "Payroll",   amount: aggregate.payroll },
    { name: "Fees",      amount: aggregate.fees },
    { name: "Taxes",     amount: aggregate.taxes },
    { name: "Marketing", amount: aggregate.marketing },
  ]
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Swing — biggest mover across categories vs the prior period.
  const swing = biggestSwing(aggregate.byCategory, prevAggregate.byCategory);

  // Top vendors for the period.
  const topVendors = topVendorsRows
    .filter((r) => r.vendor && r._sum.amount != null)
    .map((r) => ({ name: r.vendor as string, amount: Math.abs(r._sum.amount ?? 0) }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const hasAnyData =
    aggregate.income > 0 ||
    aggregate.expenses > 0 ||
    trend.some((t) => t.income > 0 || t.expenses > 0);

  return (
    <section id="insights" className="mb-6">
      <div className="flex items-end justify-end mb-4 flex-wrap gap-3">
        <DashboardInsightsPicker
          granularity={pickerGran}
          anchor={pickerAnchor}
          from={pickerFrom}
          to={pickerTo}
        />
      </div>

      {!hasAnyData ? (
        <div className="card text-center py-12 text-slate-400">
          No data for {period.label} yet. Upload transactions or pick a different period.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend — full width */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Trend — {period.label}</div>
              <div className="text-xs text-slate-400">income · expenses · net</div>
            </div>
            <TrendChart data={trend} />
          </div>

          {/* Cash flow */}
          <div className="card">
            <div className="font-medium mb-2">Cash flow — {period.label}</div>
            <CashflowChart data={trend.map((t) => ({ ym: t.ym, net: t.net }))} />
          </div>

          {/* Top expense categories */}
          <div className="card">
            <div className="font-medium mb-2">
              Top expense categories — {period.label}
            </div>
            {topCategories.length ? (
              <CategoryBars data={topCategories} />
            ) : (
              <EmptyMini text="No outcome activity in this period." />
            )}
          </div>

          {/* Revenue channel */}
          <div className="card">
            <div className="font-medium mb-2">Revenue channel</div>
            <div className="text-xs text-slate-400 mb-2">Income split by category</div>
            {revenueChannel.length ? (
              <CategoryBars data={revenueChannel} />
            ) : (
              <EmptyMini text="No revenue in this period." />
            )}
          </div>

          {/* Spending shape */}
          <div className="card">
            <div className="font-medium mb-2">Spending shape</div>
            <div className="text-xs text-slate-400 mb-2">
              Outcome by type (fixed / variable / payroll / fees / taxes)
            </div>
            {spendingShape.length ? (
              <CategoryBars data={spendingShape} />
            ) : (
              <EmptyMini text="No outcome activity in this period." />
            )}
          </div>

          {/* Swing — biggest category change vs prior period (full width
              because of the trailing detail line) */}
          <div className="card lg:col-span-2">
            <div className="font-medium mb-2">Swing</div>
            <div className="text-xs text-slate-400 mb-2">
              Biggest category swing vs {priorLabel}
            </div>
            {swing ? (
              <>
                <CategoryBars
                  data={[
                    { name: prevWindowLabel(period, monthSpan), amount: swing.prev },
                    { name: period.label, amount: swing.cur },
                  ]}
                />
                <div className="text-xs text-slate-500 mt-2">
                  <span className="text-slate-200">{swing.name}</span>:{" "}
                  {fmtMoney(swing.prev, currency)} →{" "}
                  {fmtMoney(swing.cur, currency)} ({" "}
                  <span className={swing.delta >= 0 ? "text-bad" : "text-good"}>
                    {swing.delta >= 0 ? "+" : "−"}
                    {fmtMoney(Math.abs(swing.delta), currency)}
                  </span>{" "})
                </div>
              </>
            ) : (
              <EmptyMini text="Not enough data for a swing comparison." />
            )}
          </div>

          {/* Top vendors — full width */}
          <div className="card lg:col-span-2">
            <div className="font-medium mb-2">Top vendors — {period.label}</div>
            {topVendors.length ? (
              <CategoryBars data={topVendors} />
            ) : (
              <EmptyMini text="No vendor-tagged expenses in this period." />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="text-sm text-slate-500 text-center py-10">{text}</div>
  );
}

// Inclusive month count between two YM markers (e.g. 2026-04 → 2026-06 = 3).
function monthsBetween(fromYM: string, toYM: string): number {
  const [fy, fm] = fromYM.split("-").map(Number);
  const [ty, tm] = toYM.split("-").map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

// Human-readable label for the window immediately before `period` — shown
// as the "prev" bar label on the Swing card.
function prevWindowLabel(
  period: { fromYM: string; toYM: string },
  monthSpan: number,
): string {
  const from = shiftYM(period.fromYM, -monthSpan);
  const to = shiftYM(period.toYM, -monthSpan);
  if (from === to) return ymToLabel(from);
  return `${ymToLabel(from)} → ${ymToLabel(to)}`;
}

// Largest |delta| across categories present in either period. Magnitudes are
// absolute so the bars render in the same direction regardless of swing sign.
function biggestSwing(
  cur: Record<string, number>,
  prev: Record<string, number>,
): { name: string; cur: number; prev: number; delta: number } | null {
  const names = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  let best: { name: string; cur: number; prev: number; delta: number } | null = null;
  for (const name of names) {
    const a = Math.abs(cur[name] ?? 0);
    const b = Math.abs(prev[name] ?? 0);
    if (a + b < 100) continue;
    const delta = a - b;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = { name, cur: a, prev: b, delta };
    }
  }
  return best;
}
