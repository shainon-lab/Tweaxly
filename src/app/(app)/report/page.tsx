import { Fragment } from "react";
import PageHeader from "@/components/PageHeader";
import ReportPeriodPicker from "@/components/ReportPeriodPicker";
import ReportsInnerTabs from "@/components/ReportsInnerTabs";
import { Stat } from "@/components/Stat";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listAccountingMonths } from "@/lib/metrics";
import { buildPeriodAggregate } from "@/lib/period";
import {
  resolvePeriod,
  shiftPeriod,
  defaultAnchor,
  isValidGranularity,
  type Granularity,
} from "@/lib/reportPeriod";
import { fmtMoney, fmtMoneyWhole, fmtMoneyExact, fmtPct } from "@/lib/format";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { breakdownFromDb, breakdownFromTxns, type BreakdownResult } from "@/lib/currencyBreakdown";
import MoneyAmountWithCurrencyBreakdown from "@/components/MoneyAmountWithCurrencyBreakdown";

const MAX_COMPARE = 3;

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ gran?: string; period?: string; compare?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  // ── URL params with safe defaults ─────────────────────────────────────────
  const granularity: Granularity = isValidGranularity(sp.gran) ? sp.gran : "month";
  // Default the anchor to the LATEST month that actually has data, not
  // today's calendar month — uploads usually trail real time.
  let anchor = sp.period;
  if (!anchor) {
    const months = await listAccountingMonths(business.id);
    const latestYM = months[0]; // listAccountingMonths returns desc
    if (latestYM && /^\d{4}-\d{2}$/.test(latestYM)) {
      const [y, m] = latestYM.split("-").map(Number);
      if (granularity === "month") {
        anchor = latestYM;
      } else if (granularity === "quarter") {
        const q = Math.ceil(m / 3);
        anchor = `${y}-Q${q}`;
      } else {
        anchor = String(y);
      }
    } else {
      anchor = defaultAnchor(granularity);
    }
  }
  const compare = Math.max(0, Math.min(MAX_COMPARE, Number(sp.compare) || 0));

  // Primary period + (compare) prior periods of the same granularity.
  const primary = resolvePeriod(granularity, anchor);
  const compareSpecs = Array.from({ length: compare }, (_, i) =>
    resolvePeriod(granularity, shiftPeriod(granularity, anchor, i + 1)),
  );
  const allPeriods = [primary, ...compareSpecs];

  // Fetch an aggregate for every period (parallel) plus the canonical
  // category list so we can label income vs outcome rows.
  const ccy = business.currency;
  const [aggregates, categories, periodBreakdowns] = await Promise.all([
    Promise.all(
      allPeriods.map((p) => buildPeriodAggregate(business.id, p.fromYM, p.toYM)),
    ),
    prisma.category.findMany({ where: { businessId: business.id } }),
    // Per-period currency-composition breakdowns. Three buckets per
    // period: revenue (income), outcome (everything non-revenue,
    // non-transfer), and net (everything signed). Drives the
    // disclosure chips on the KPI tiles and the Total/P&L rows.
    Promise.all(
      allPeriods.map(async (p) => {
        const where = {
          businessId: business.id,
          accountingMonth: { gte: p.fromYM, lte: p.toYM },
          isExcludedFromPnl: false,
          type: { not: "transfer" },
        } as const;
        const [revFx, outFx, netFx, perCatRows] = await Promise.all([
          breakdownFromDb({ ...where, category: { kind: "revenue" } }, ccy, { absolute: true }),
          breakdownFromDb({ ...where, NOT: { category: { kind: "revenue" } } }, ccy, { absolute: true }),
          breakdownFromDb(where, ccy),
          // Pull every transaction in the period along with its
          // category name + currency snapshot so we can build a per-
          // category breakdown in memory. Single query per period.
          prisma.transaction.findMany({
            where,
            select: {
              amount: true, currency: true,
              originalAmount: true, originalCurrency: true,
              baseCurrency: true, exchangeRate: true,
              conversionMethod: true,
              category: { select: { name: true, kind: true } },
            },
          }),
        ]);
        // Group by category name; income rows use signed sums, outcome
        // rows use absolute values — matches the table's display rule.
        const byName = new Map<string, typeof perCatRows>();
        for (const r of perCatRows) {
          const name = r.category?.name ?? "Uncategorized";
          const arr = byName.get(name) ?? [];
          arr.push(r);
          byName.set(name, arr);
        }
        const byCategory: Record<string, BreakdownResult> = {};
        for (const [name, rows] of byName) {
          const isRevenue = rows[0]?.category?.kind === "revenue";
          byCategory[name] = breakdownFromTxns(rows, ccy, { absolute: !isRevenue });
        }
        return { revFx, outFx, netFx, byCategory, fromYM: p.fromYM, toYM: p.toYM };
      }),
    ),
  ]);

  // Convenience aliases for the primary-period breakdowns.
  const primaryRevFx: BreakdownResult = periodBreakdowns[0].revFx;
  const primaryOutFx: BreakdownResult = periodBreakdowns[0].outFx;
  const primaryNetFx: BreakdownResult = periodBreakdowns[0].netFx;
  const kindByName = new Map<string, string>();
  for (const c of categories) kindByName.set(c.name, c.kind);

  // Union of every category that appears in any period — keeps rows stable
  // even when a category had no activity in one of the comparison columns.
  const allCatNames = new Set<string>();
  for (const a of aggregates) for (const n of Object.keys(a.byCategory)) allCatNames.add(n);

  type Row = {
    name: string;
    kind: string;
    isIncome: boolean;
    // Per-period signed value (positive for income rows, magnitude for outcome).
    perPeriod: number[];
  };
  const rows: Row[] = Array.from(allCatNames).map((name) => {
    const kind = kindByName.get(name) ?? "other";
    const isIncome = kind === "revenue";
    const perPeriod = aggregates.map((a) => {
      const signed = a.byCategory[name] ?? 0;
      return isIncome ? signed : Math.abs(signed);
    });
    return { name, kind, isIncome, perPeriod };
  });

  // Sort: income first, then outcome. Within each group: by the primary
  // period's magnitude desc so the biggest movers float to the top.
  rows.sort((a, b) => {
    const cmp = compareCategoriesIncomeFirst(
      { kind: a.kind, name: a.name },
      { kind: b.kind, name: b.name },
    );
    if (cmp !== 0) return cmp;
    return (b.perPeriod[0] ?? 0) - (a.perPeriod[0] ?? 0);
  });

  // Top-line totals per period.
  const revenueByPeriod = aggregates.map((a) => a.income);
  const outcomeByPeriod = aggregates.map((a) => a.expenses);
  const netByPeriod = aggregates.map((a) => a.netProfit);
  const marginByPeriod = aggregates.map((a) =>
    a.income > 0 ? a.netProfit / a.income : null,
  );

  // Δ between primary and the immediately-prior comparison column (when at
  // least one compare column is on). Used by the stat tiles at the top.
  const prevForStats = compare > 0 ? aggregates[1] : null;
  const prevLabel = compare > 0 ? compareSpecs[0].label : null;
  const revDelta = prevForStats
    ? deltaInfo(aggregates[0].income, prevForStats.income)
    : null;
  const outDelta = prevForStats
    ? deltaInfo(aggregates[0].expenses, prevForStats.expenses)
    : null;
  const pnlDelta = prevForStats
    ? deltaInfo(aggregates[0].netProfit, prevForStats.netProfit)
    : null;

  // Render
  return (
    <>
      <PageHeader
        title={`P&L Statement — ${primary.label}`}
        subtitle={business.name}
        right={
          <ReportPeriodPicker
            granularity={granularity}
            anchor={primary.anchor}
            compare={compare}
          />
        }
      />
      <ReportsInnerTabs />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Revenue (income)"
          value={
            <MoneyAmountWithCurrencyBreakdown
              convertedTotal={aggregates[0].income}
              baseCurrency={ccy}
              currencyBreakdown={primaryRevFx.currencyBreakdown}
              hasMultipleCurrencies={primaryRevFx.hasMultipleCurrencies}
              conversionMethod={primaryRevFx.conversionMethod}
              dateRange={{ from: `${primary.fromYM}-01`, to: `${primary.toYM}-01` }}
            />
          }
          tone="good"
          sub={
            revDelta && prevLabel
              ? (
                <span className={revDelta.delta >= 0 ? "text-good" : "text-bad"}>
                  {fmtPct(revDelta.pct ?? 0)} vs {prevLabel}
                </span>
              )
              : "—"
          }
        />
        <Stat
          label="Total outcome"
          value={
            <MoneyAmountWithCurrencyBreakdown
              convertedTotal={aggregates[0].expenses}
              baseCurrency={ccy}
              currencyBreakdown={primaryOutFx.currencyBreakdown}
              hasMultipleCurrencies={primaryOutFx.hasMultipleCurrencies}
              conversionMethod={primaryOutFx.conversionMethod}
              dateRange={{ from: `${primary.fromYM}-01`, to: `${primary.toYM}-01` }}
            />
          }
          tone="bad"
          sub={
            outDelta && prevLabel
              ? (
                <span className={outDelta.delta <= 0 ? "text-good" : "text-bad"}>
                  {fmtPct(outDelta.pct ?? 0)} vs {prevLabel}
                </span>
              )
              : "—"
          }
        />
        <Stat
          label="P&L"
          value={
            <MoneyAmountWithCurrencyBreakdown
              convertedTotal={aggregates[0].netProfit}
              baseCurrency={ccy}
              currencyBreakdown={primaryNetFx.currencyBreakdown}
              hasMultipleCurrencies={primaryNetFx.hasMultipleCurrencies}
              conversionMethod={primaryNetFx.conversionMethod}
              dateRange={{ from: `${primary.fromYM}-01`, to: `${primary.toYM}-01` }}
              signed
            />
          }
          tone={aggregates[0].netProfit >= 0 ? "good" : "bad"}
          sub={
            pnlDelta && prevLabel
              ? (
                <span className={pnlDelta.delta >= 0 ? "text-good" : "text-bad"}>
                  {fmtPct(pnlDelta.pct ?? 0)} vs {prevLabel}
                </span>
              )
              : "—"
          }
        />
        <Stat
          label="Margin"
          value={marginByPeriod[0] == null ? "—" : fmtPct(marginByPeriod[0]!)}
          tone={
            marginByPeriod[0] == null
              ? "default"
              : marginByPeriod[0]! >= 0
                ? "good"
                : "bad"
          }
        />
      </div>

      <div className="card mb-6 overflow-x-auto">
        <div className="font-medium mb-3">
          Categories — {primary.label}
          {compare > 0 ? (
            <span className="text-slate-400 text-sm ml-2">
              vs {compareSpecs.map((p) => p.label).join(" vs ")}
            </span>
          ) : null}
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th className="!normal-case !text-sm !text-slate-400 !font-medium">Line</th>
              <th className="!normal-case !text-sm !text-slate-400 !font-medium">Type</th>
              {allPeriods.map((p, i) => (
                <th
                  key={p.anchor}
                  className={`!normal-case !text-base !text-slate-100 text-right whitespace-nowrap ${
                    i === 0 ? "!font-bold underline decoration-accent decoration-2 underline-offset-[6px]" : "!font-semibold"
                  }`}
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const prevRow = idx > 0 ? rows[idx - 1] : null;
              const isFirstOutcome = !r.isIncome && (prevRow?.isIncome ?? false);
              const incomeRowCount = rows.filter((x) => x.isIncome).length;
              const showRevenueSubtotal = isFirstOutcome && incomeRowCount > 1;
              return (
                <Fragment key={r.name}>
                  {showRevenueSubtotal ? (
                    <tr className="bg-good/10 border-t-2 border-good/30">
                      <td colSpan={2} className="font-bold uppercase tracking-wide text-xs text-good">
                        Total revenue
                      </td>
                      {revenueByPeriod.map((v, i) => {
                        const pb = periodBreakdowns[i];
                        return (
                          <td
                            key={i}
                            className={`text-right font-bold whitespace-nowrap ${i === 0 ? "text-good" : "text-slate-300"}`}
                          >
                            +<MoneyAmountWithCurrencyBreakdown
                              convertedTotal={v}
                              baseCurrency={ccy}
                              currencyBreakdown={pb.revFx.currencyBreakdown}
                              hasMultipleCurrencies={pb.revFx.hasMultipleCurrencies}
                              conversionMethod={pb.revFx.conversionMethod}
                              dateRange={{ from: `${pb.fromYM}-01`, to: `${pb.toYM}-01` }}
                            />
                            {i > 0 ? (
                              <DeltaPct cur={revenueByPeriod[0]} prev={v} isImprovementWhenUp={true} />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ) : null}
                  <tr className={r.isIncome ? "bg-good/5" : ""}>
                    <td className={r.isIncome ? "font-semibold text-good" : "font-medium"}>
                      {r.name}
                    </td>
                    <td>
                      <span className={r.isIncome ? "pill-good" : "pill-bad"}>
                        {r.isIncome ? "Income" : "Outcome"}
                      </span>
                    </td>
                    {r.perPeriod.map((value, i) => {
                      const isPrimary = i === 0;
                      const tone = r.isIncome
                        ? "text-good"
                        : value > 0 ? "text-bad" : "text-slate-500";
                      const pb = periodBreakdowns[i];
                      const catFx = pb.byCategory[r.name];
                      const sign = r.isIncome ? "+" : "−";
                      return (
                        <td
                          key={i}
                          className={`text-right whitespace-nowrap ${
                            isPrimary ? `font-semibold ${tone}` : "text-slate-400"
                          }`}
                        >
                          {value > 0 ? (
                            catFx ? (
                              <>
                                {sign}
                                <MoneyAmountWithCurrencyBreakdown
                                  convertedTotal={value}
                                  baseCurrency={ccy}
                                  currencyBreakdown={catFx.currencyBreakdown}
                                  hasMultipleCurrencies={catFx.hasMultipleCurrencies}
                                  conversionMethod={catFx.conversionMethod}
                                  dateRange={{ from: `${pb.fromYM}-01`, to: `${pb.toYM}-01` }}
                                />
                              </>
                            ) : (
                              <>{sign}{fmtMoneyExact(value, ccy)}</>
                            )
                          ) : (
                            "—"
                          )}
                          {!isPrimary && value > 0 ? (
                            <DeltaPct
                              cur={r.perPeriod[0]}
                              prev={value}
                              isImprovementWhenUp={r.isIncome}
                            />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}

            {/* Total outcome row */}
            <tr className="border-t-2 border-line">
              <td colSpan={2} className="font-bold uppercase text-xs tracking-wide">
                Total outcome
              </td>
              {outcomeByPeriod.map((v, i) => {
                const pb = periodBreakdowns[i];
                return (
                  <td
                    key={i}
                    className={`text-right font-semibold whitespace-nowrap ${i === 0 ? "text-bad" : "text-slate-400"}`}
                  >
                    −<MoneyAmountWithCurrencyBreakdown
                      convertedTotal={v}
                      baseCurrency={ccy}
                      currencyBreakdown={pb.outFx.currencyBreakdown}
                      hasMultipleCurrencies={pb.outFx.hasMultipleCurrencies}
                      conversionMethod={pb.outFx.conversionMethod}
                      dateRange={{ from: `${pb.fromYM}-01`, to: `${pb.toYM}-01` }}
                    />
                    {i > 0 ? (
                      <DeltaPct cur={outcomeByPeriod[0]} prev={v} isImprovementWhenUp={false} />
                    ) : null}
                  </td>
                );
              })}
            </tr>

            {/* P&L row */}
            <tr className={netByPeriod[0] >= 0 ? "bg-good/10" : "bg-bad/10"}>
              <td className="font-bold">P&amp;L</td>
              <td>
                <span className={netByPeriod[0] >= 0 ? "pill-good" : "pill-bad"}>
                  {netByPeriod[0] >= 0 ? "Profit" : "Loss"}
                </span>
              </td>
              {netByPeriod.map((v, i) => {
                const pb = periodBreakdowns[i];
                return (
                  <td
                    key={i}
                    className={`text-right whitespace-nowrap ${i === 0 ? "font-bold" : ""} ${v >= 0 ? "text-good" : "text-bad"}`}
                  >
                    <MoneyAmountWithCurrencyBreakdown
                      convertedTotal={v}
                      baseCurrency={ccy}
                      currencyBreakdown={pb.netFx.currencyBreakdown}
                      hasMultipleCurrencies={pb.netFx.hasMultipleCurrencies}
                      conversionMethod={pb.netFx.conversionMethod}
                      dateRange={{ from: `${pb.fromYM}-01`, to: `${pb.toYM}-01` }}
                      signed
                    />
                    {i > 0 ? (
                      <DeltaPct cur={netByPeriod[0]} prev={v} isImprovementWhenUp={true} />
                    ) : null}
                  </td>
                );
              })}
            </tr>

            {/* Margin row */}
            <tr>
              <td className="font-bold">Margin</td>
              <td className="text-slate-400 text-xs">profit ÷ revenue</td>
              {marginByPeriod.map((m, i) => (
                <td
                  key={i}
                  className={`text-right whitespace-nowrap ${
                    m == null
                      ? "text-slate-500"
                      : m >= 0 ? "text-good" : "text-bad"
                  } ${i === 0 ? "font-bold" : ""}`}
                >
                  {m == null ? "—" : fmtPct(m)}
                  {i > 0 ? (
                    <DeltaPP cur={marginByPeriod[0]} prev={m} />
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="text-xs text-slate-500 mt-3">
          Pick a primary period above. Add comparison columns to see up to {MAX_COMPARE} prior {granularity}s alongside it. Every category that has appeared in your data is listed; categories with no activity in a given period show <span className="text-slate-300">—</span>.
        </div>
      </div>
    </>
  );
}

function deltaInfo(cur: number, prev: number) {
  const delta = cur - prev;
  const pct = prev !== 0 ? delta / Math.abs(prev) : null;
  return { delta, pct };
}

// Tiny inline "(±X%)" badge shown beside each comparison-period value. The
// percent is the primary period's change relative to that older period.
// `isImprovementWhenUp` decides the color: true for income/net/margin
// (going up is good), false for outcome rows (going up is bad).
function DeltaPct({
  cur,
  prev,
  isImprovementWhenUp,
}: {
  cur: number;
  prev: number;
  isImprovementWhenUp: boolean;
}) {
  if (prev === 0 || !Number.isFinite(prev)) return null;
  const diff = cur - prev;
  if (diff === 0) return null;
  const pctAbs = Math.abs((diff / Math.abs(prev)) * 100);
  const isUp = diff > 0;
  const good = isImprovementWhenUp ? isUp : !isUp;
  const sign = isUp ? "+" : "−";
  return (
    <span className={`text-xs ml-1 ${good ? "text-good" : "text-bad"}`}>
      ({sign}{pctAbs.toFixed(0)}%)
    </span>
  );
}

// Percentage-point difference badge for the Margin row, since margin is
// already a ratio. "+3.5pp" reads as "3.5 percentage points higher".
function DeltaPP({ cur, prev }: { cur: number | null; prev: number | null }) {
  if (cur == null || prev == null) return null;
  const diff = (cur - prev) * 100;
  if (Math.abs(diff) < 0.05) return null;
  const isUp = diff > 0;
  const sign = isUp ? "+" : "−";
  return (
    <span className={`text-xs ml-1 ${isUp ? "text-good" : "text-bad"}`}>
      ({sign}{Math.abs(diff).toFixed(1)}pp)
    </span>
  );
}
