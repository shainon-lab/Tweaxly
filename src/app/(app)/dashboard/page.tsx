import PageHeader from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import DashboardPeriodPicker from "@/components/DashboardPeriodPicker";
import { requireBusiness } from "@/lib/auth";
import { activeEmployeeCost } from "@/lib/metrics";
import {
  resolveDashboardRange,
  resolveCompareRange,
  buildPeriodAggregate,
  DASHBOARD_RANGE_LABEL,
  type DashboardRange,
  type CompareMode,
} from "@/lib/period";
import { fmtMoney, fmtMoneyWhole, fmtMoneyExact, fmtPct } from "@/lib/format";
import { prisma } from "@/lib/db";
import Link from "next/link";

const VALID_RANGES: DashboardRange[] = [
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "custom",
];

const VALID_COMPARES: CompareMode[] = ["none", "previous", "last_year", "two_years_ago"];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

// Percent change between two values. Returns null when prior is 0 (no
// baseline to compare against). Sign is preserved so callers can render
// "+/−" and color it.
function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}

// Gross margin delta: ((cur_margin) - (prev_margin)) / |prev_margin|.
// Used only when both periods have positive revenue.
function marginPctDelta(
  cur: { income: number; expenses: number },
  prev: { income: number; expenses: number },
): number | null {
  if (cur.income <= 0 || prev.income <= 0) return null;
  const curMargin = (cur.income - cur.expenses) / cur.income;
  const prevMargin = (prev.income - prev.expenses) / prev.income;
  if (prevMargin === 0) return null;
  return (curMargin - prevMargin) / Math.abs(prevMargin);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
    compare?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  // Default landing view: "This year" — gives the owner a year-to-date view
  // by default. They can narrow to a month/quarter via the picker.
  const range = (VALID_RANGES.includes(sp.range as DashboardRange)
    ? (sp.range as DashboardRange)
    : "this_year") as DashboardRange;

  const compare = (VALID_COMPARES.includes(sp.compare as CompareMode)
    ? (sp.compare as CompareMode)
    : "none") as CompareMode;

  const resolved = resolveDashboardRange(range, sp.start, sp.end);
  // When the user picks an explicit comparison, use it for both the stat-tile
  // delta subtitles AND the new comparison column in the P&L breakdown. When
  // "none", fall back to the immediate-prior period so the existing subtitle
  // deltas keep working.
  const compareRange = resolveCompareRange(resolved, compare);
  const compareFromYM = compareRange ? compareRange.fromYM : resolved.prevFromYM;
  const compareToYM   = compareRange ? compareRange.toYM   : resolved.prevToYM;
  const compareLabel  = compareRange ? compareRange.label  : resolved.prevLabel;

  const [current, prev, employeeCost] = await Promise.all([
    buildPeriodAggregate(business.id, resolved.fromYM, resolved.toYM),
    buildPeriodAggregate(business.id, compareFromYM, compareToYM),
    activeEmployeeCost(business.id, resolved.toYM),
  ]);

  const ccy = business.currency;
  const incomeDelta =
    prev.income > 0 ? (current.income - prev.income) / prev.income : null;
  const expDelta =
    prev.expenses > 0 ? (current.expenses - prev.expenses) / prev.expenses : null;
  const netDelta =
    prev.netProfit !== 0
      ? (current.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : null;

  // Empty data is when the business has zero transactions at all
  const totalTxnCount = await prisma.transaction.count({
    where: { businessId: business.id },
  });
  const empty = totalTxnCount === 0;

  // Default custom-range start/end fed into the picker — used when user
  // switches to "custom" and we need initial values.
  const initialStart = sp.start ?? todayISODate();
  const initialEnd = sp.end ?? todayISODate();

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`${DASHBOARD_RANGE_LABEL[range]}: ${resolved.label} (${current.monthCount} month${current.monthCount === 1 ? "" : "s"}) — ${business.name}`}
        right={
          <DashboardPeriodPicker
            range={range}
            start={initialStart}
            end={initialEnd}
            compare={compare}
          />
        }
      />

      {empty ? (
        <div className="card text-center py-12">
          <div className="text-lg font-medium">No data yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Add a manual entry or bulk-upload a CSV from your bank/PayPal/Stripe to get started.
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/manual-data" className="btn-primary">
              Add data
            </Link>
            <Link href="/integration" className="btn-ghost">
              See integrations
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Comparison cards: every numeric stat surfaces the prior-period
              value and the % move. Color reflects business meaning — for
              metrics where "down is good" (expenses, payroll, etc.) a
              negative delta lights up green. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Revenue"
              value={fmtMoneyWhole(current.income, ccy)}
              tone="good"
              comparison={{
                prevValue: fmtMoneyWhole(prev.income, ccy),
                pct: pctDelta(current.income, prev.income),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Expenses"
              value={fmtMoneyWhole(current.expenses, ccy)}
              tone="bad"
              comparison={{
                prevValue: fmtMoneyWhole(prev.expenses, ccy),
                pct: pctDelta(current.expenses, prev.expenses),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Net profit"
              value={fmtMoneyWhole(current.netProfit, ccy)}
              tone={current.netProfit >= 0 ? "good" : "bad"}
              comparison={{
                prevValue: fmtMoneyWhole(prev.netProfit, ccy),
                pct: pctDelta(current.netProfit, prev.netProfit),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Normalized profit"
              value={fmtMoneyWhole(current.normalizedProfit, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.normalizedProfit, ccy),
                pct: pctDelta(current.normalizedProfit, prev.normalizedProfit),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Fixed expenses"
              value={fmtMoneyWhole(current.fixed, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.fixed, ccy),
                pct: pctDelta(current.fixed, prev.fixed),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Variable expenses"
              value={fmtMoneyWhole(current.variable, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.variable, ccy),
                pct: pctDelta(current.variable, prev.variable),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Payroll (txns + roster)"
              value={fmtMoneyWhole(
                Math.max(current.payroll, employeeCost.recurring),
                ccy,
              )}
              comparison={{
                prevValue: fmtMoneyWhole(prev.payroll, ccy),
                pct: pctDelta(current.payroll, prev.payroll),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Marketing"
              value={fmtMoneyWhole(current.marketing, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.marketing, ccy),
                pct: pctDelta(current.marketing, prev.marketing),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Processing fees"
              value={fmtMoneyWhole(current.fees, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.fees, ccy),
                pct: pctDelta(current.fees, prev.fees),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Taxes"
              value={fmtMoneyWhole(current.taxes, ccy)}
              comparison={{
                prevValue: fmtMoneyWhole(prev.taxes, ccy),
                pct: pctDelta(current.taxes, prev.taxes),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="One-time costs"
              value={fmtMoneyWhole(current.oneTime, ccy)}
              tone={current.oneTime > 0 ? "warn" : "default"}
              comparison={{
                prevValue: fmtMoneyWhole(prev.oneTime, ccy),
                pct: pctDelta(current.oneTime, prev.oneTime),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              }}
            />
            <Stat
              label="Gross margin"
              value={
                current.income > 0
                  ? fmtPct((current.income - current.expenses) / current.income)
                  : "—"
              }
              comparison={
                current.income > 0 && prev.income > 0
                  ? {
                      prevValue: fmtPct((prev.income - prev.expenses) / prev.income),
                      pct: marginPctDelta(current, prev),
                      upIsGood: true,
                      prevLabel: `vs ${compareLabel}`,
                    }
                  : undefined
              }
            />
          </div>

        </>
      )}
    </>
  );
}

// Always-visible P&L breakdown for the selected period: Total revenue at the
// top, every outcome category beneath, then Net profit. Works for month /
// quarter / year / custom ranges because it reads from the same period
// aggregate already used for the stat tiles and charts above.
function PnlBreakdown({
  label,
  byCategory,
  currency,
  compareLabel,
  compareByCategory,
}: {
  label: string;
  byCategory: Record<string, number>;
  currency: string;
  compareLabel?: string | null;
  compareByCategory?: Record<string, number> | null;
}) {
  const compareOn = !!compareByCategory;

  // Split a byCategory map into income / outcome row arrays + totals.
  function split(map: Record<string, number>) {
    const income: { name: string; amount: number }[] = [];
    const outcome: { name: string; amount: number }[] = [];
    for (const [name, signed] of Object.entries(map)) {
      if (signed > 0) income.push({ name, amount: signed });
      else if (signed < 0) outcome.push({ name, amount: -signed });
    }
    income.sort((a, b) => b.amount - a.amount);
    outcome.sort((a, b) => b.amount - a.amount);
    const totalRevenue = income.reduce((a, b) => a + b.amount, 0);
    const totalOutcome = outcome.reduce((a, b) => a + b.amount, 0);
    const netProfit = totalRevenue - totalOutcome;
    return { income, outcome, totalRevenue, totalOutcome, netProfit };
  }

  const cur = split(byCategory);
  const cmp = compareByCategory ? split(compareByCategory) : null;

  // Union of category names, sorted by current outcome desc (or compare's
  // outcome if current has zero) — keeps the table consistent across periods.
  const incomeNames = Array.from(new Set([
    ...cur.income.map((r) => r.name),
    ...(cmp ? cmp.income.map((r) => r.name) : []),
  ]));
  const outcomeNames = Array.from(new Set([
    ...cur.outcome.map((r) => r.name),
    ...(cmp ? cmp.outcome.map((r) => r.name) : []),
  ]));
  function lookup(rows: { name: string; amount: number }[], name: string) {
    return rows.find((r) => r.name === name)?.amount ?? 0;
  }
  // Sort by max(current, compare) magnitude so the biggest movers stay at the top.
  outcomeNames.sort((a, b) => {
    const aMax = Math.max(lookup(cur.outcome, a), cmp ? lookup(cmp.outcome, a) : 0);
    const bMax = Math.max(lookup(cur.outcome, b), cmp ? lookup(cmp.outcome, b) : 0);
    return bMax - aMax;
  });
  incomeNames.sort((a, b) => {
    const aMax = Math.max(lookup(cur.income, a), cmp ? lookup(cmp.income, a) : 0);
    const bMax = Math.max(lookup(cur.income, b), cmp ? lookup(cmp.income, b) : 0);
    return bMax - aMax;
  });

  const margin = cur.totalRevenue > 0 ? cur.netProfit / cur.totalRevenue : null;

  function deltaText(curVal: number, prevVal: number, isOutcome: boolean): React.ReactNode {
    if (!cmp) return null;
    if (curVal === 0 && prevVal === 0) return null;
    const diff = curVal - prevVal;
    const pct = prevVal !== 0 ? diff / Math.abs(prevVal) : null;
    // For outcomes: an INCREASE is bad. For revenue/net: an INCREASE is good.
    const goodWhen: "up" | "down" = isOutcome ? "down" : "up";
    const isGood = (goodWhen === "up" && diff > 0) || (goodWhen === "down" && diff < 0);
    const cls =
      diff === 0       ? "text-slate-500" :
      isGood           ? "text-good"      :
                         "text-bad";
    const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
    return (
      <span className={`text-[11px] ml-1 ${cls}`}>
        {pct != null ? `${sign}${Math.abs(pct * 100).toFixed(1)}%` : `${sign}${fmtMoney(Math.abs(diff), currency)}`}
      </span>
    );
  }

  if (cur.income.length === 0 && cur.outcome.length === 0 && (!cmp || (cmp.income.length === 0 && cmp.outcome.length === 0))) {
    return (
      <div className="card">
        <div className="font-medium mb-2">P&amp;L breakdown — {label}</div>
        <div className="text-sm text-slate-400 py-8 text-center">
          No categorized activity for this period yet.{" "}
          <Link className="text-accent" href="/transactions">
            Categorize transactions
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div className="font-medium">
          P&amp;L breakdown — {label}
          {compareOn ? (
            <span className="text-slate-400 font-normal ml-2 text-xs">
              vs <span className="text-slate-200">{compareLabel}</span>
            </span>
          ) : null}
        </div>
        <div className="text-xs text-slate-400">
          {cur.income.length === 0
            ? "No revenue recorded"
            : cur.income.length === 1
              ? "1 revenue source"
              : `${cur.income.length} revenue sources`}
          {" · "}
          {cur.outcome.length === 0
            ? "no outcomes"
            : cur.outcome.length === 1
              ? "1 outcome category"
              : `${cur.outcome.length} outcome categories`}
        </div>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th className="!normal-case !text-sm !text-slate-500 !font-medium">Line</th>
            <th className="!normal-case !text-sm !text-slate-100 !font-semibold text-right whitespace-nowrap">
              {label}
            </th>
            {compareOn ? (
              <th className="!normal-case !text-sm !text-slate-100 !font-semibold text-right whitespace-nowrap">
                {compareLabel}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {/* Revenue total */}
          <tr>
            <td className="font-medium text-slate-100">Revenue</td>
            <td className="text-right font-medium text-good whitespace-nowrap">
              +{fmtMoneyExact(cur.totalRevenue, currency)}
              {deltaText(cur.totalRevenue, cmp?.totalRevenue ?? 0, false)}
            </td>
            {compareOn ? (
              <td className="text-right text-slate-300 whitespace-nowrap">
                +{fmtMoneyExact(cmp!.totalRevenue, currency)}
              </td>
            ) : null}
          </tr>
          {incomeNames.length > 1
            ? incomeNames.map((name) => {
                const curAmt = lookup(cur.income, name);
                const prevAmt = cmp ? lookup(cmp.income, name) : 0;
                return (
                  <tr key={`inc-${name}`} className="text-slate-400">
                    <td className="pl-6">{name}</td>
                    <td className="text-right whitespace-nowrap">
                      {curAmt > 0 ? `+${fmtMoneyExact(curAmt, currency)}` : "—"}
                      {deltaText(curAmt, prevAmt, false)}
                    </td>
                    {compareOn ? (
                      <td className="text-right whitespace-nowrap">
                        {prevAmt > 0 ? `+${fmtMoneyExact(prevAmt, currency)}` : "—"}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            : null}

          {/* Outcomes */}
          <tr>
            <td className="pt-4 text-xs uppercase tracking-wide text-slate-500">
              Outcomes
            </td>
            <td></td>
            {compareOn ? <td></td> : null}
          </tr>
          {outcomeNames.map((name) => {
            const curAmt = lookup(cur.outcome, name);
            const prevAmt = cmp ? lookup(cmp.outcome, name) : 0;
            return (
              <tr key={`out-${name}`}>
                <td className="pl-6 text-slate-200">{name}</td>
                <td className="text-right text-bad whitespace-nowrap">
                  {curAmt > 0 ? `−${fmtMoneyExact(curAmt, currency)}` : "—"}
                  {deltaText(curAmt, prevAmt, true)}
                </td>
                {compareOn ? (
                  <td className="text-right text-slate-300 whitespace-nowrap">
                    {prevAmt > 0 ? `−${fmtMoneyExact(prevAmt, currency)}` : "—"}
                  </td>
                ) : null}
              </tr>
            );
          })}
          <tr className="border-t border-line">
            <td className="font-medium text-slate-200">Total outcome</td>
            <td className="text-right font-medium text-bad whitespace-nowrap">
              −{fmtMoneyExact(cur.totalOutcome, currency)}
              {deltaText(cur.totalOutcome, cmp?.totalOutcome ?? 0, true)}
            </td>
            {compareOn ? (
              <td className="text-right text-slate-300 whitespace-nowrap">
                −{fmtMoneyExact(cmp!.totalOutcome, currency)}
              </td>
            ) : null}
          </tr>

          {/* Net profit */}
          <tr className="border-t border-line">
            <td className="font-semibold text-slate-100">Net profit</td>
            <td
              className={`text-right font-semibold whitespace-nowrap ${
                cur.netProfit >= 0 ? "text-good" : "text-bad"
              }`}
            >
              {cur.netProfit >= 0 ? "+" : "−"}
              {fmtMoneyExact(Math.abs(cur.netProfit), currency)}
              {margin != null ? (
                <span className="text-xs text-slate-400 ml-2">
                  ({fmtPct(margin)} margin)
                </span>
              ) : null}
              {deltaText(cur.netProfit, cmp?.netProfit ?? 0, false)}
            </td>
            {compareOn ? (
              <td
                className={`text-right text-slate-300 whitespace-nowrap`}
              >
                {cmp!.netProfit >= 0 ? "+" : "−"}
                {fmtMoneyExact(Math.abs(cmp!.netProfit), currency)}
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
