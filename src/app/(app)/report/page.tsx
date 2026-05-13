import { Fragment } from "react";
import PageHeader from "@/components/PageHeader";
import ReportPeriodPicker from "@/components/ReportPeriodPicker";
import ReportsTabs from "@/components/ReportsTabs";
import { Stat } from "@/components/Stat";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listAccountingMonths } from "@/lib/metrics";
import { buildPeriodAggregate } from "@/lib/period";
import {
  resolvePeriod,
  shiftPeriod,
  isValidGranularity,
  type Granularity,
  type PeriodSpec,
} from "@/lib/reportPeriod";
import { fmtMoney, fmtMoneyWhole, fmtMoneyExact, fmtPct, ymToLabel } from "@/lib/format";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { buildDataFlowGrid } from "@/lib/dataflow";

const MAX_COMPARE = 3;

type ReportView = "comparison" | "grid";
// "all" and "custom" are picker-only options that map to a fixed period
// with no comparison; "month" / "quarter" / "year" still support compare.
type PeriodKind = Granularity | "all" | "custom";

function isPeriodKind(g: string | undefined): g is PeriodKind {
  return isValidGranularity(g) || g === "all" || g === "custom";
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    gran?: string;
    period?: string;
    compare?: string;
    view?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const view: ReportView = sp.view === "grid" ? "grid" : "comparison";

  // ── URL params with safe defaults ─────────────────────────────────────────
  const periodKind: PeriodKind = isPeriodKind(sp.gran) ? sp.gran : "month";
  // Default the anchor to the LATEST month that actually has data, not
  // today's calendar month — uploads usually trail real time.
  const months = await listAccountingMonths(business.id);
  const latestYM = months[0]; // listAccountingMonths returns desc
  const earliestYM = months[months.length - 1];

  // Resolve the primary period. All time = earliest..latest data months.
  // Custom = the from/to month params. Otherwise resolvePeriod handles
  // month/quarter/year via the anchor.
  let primary: PeriodSpec;
  let granularity: Granularity = "month";
  let anchor = sp.period;
  let compare = 0;
  let compareSpecs: PeriodSpec[] = [];
  if (periodKind === "all") {
    const fromYM = earliestYM ?? latestYM ?? "2020-01";
    const toYM = latestYM ?? "2020-01";
    primary = {
      granularity: "month",
      anchor: toYM,
      fromYM, toYM,
      label: fromYM === toYM ? ymToLabel(fromYM) : `${ymToLabel(fromYM)} → ${ymToLabel(toYM)} · All time`,
    };
  } else if (periodKind === "custom") {
    const sRaw = sp.start ?? latestYM ?? "2020-01";
    const eRaw = sp.end ?? latestYM ?? "2020-01";
    const fromYM = sRaw <= eRaw ? sRaw : eRaw;
    const toYM = sRaw <= eRaw ? eRaw : sRaw;
    primary = {
      granularity: "month",
      anchor: toYM,
      fromYM, toYM,
      label: fromYM === toYM ? ymToLabel(fromYM) : `${ymToLabel(fromYM)} → ${ymToLabel(toYM)}`,
    };
  } else {
    granularity = periodKind;
    if (!anchor) {
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
        anchor = latestYM ?? "2020-01";
      }
    }
    compare = Math.max(0, Math.min(MAX_COMPARE, Number(sp.compare) || 0));
    primary = resolvePeriod(granularity, anchor);
    compareSpecs = Array.from({ length: compare }, (_, i) =>
      resolvePeriod(granularity, shiftPeriod(granularity, anchor!, i + 1)),
    );
  }
  const allPeriods = [primary, ...compareSpecs];

  // Fetch an aggregate for every period (parallel) plus the canonical
  // category list so we can label income vs outcome rows. In Category
  // Grid view we additionally build the category × month grid for the
  // primary period so we can render a per-month breakdown.
  const [aggregates, categories, gridData] = await Promise.all([
    Promise.all(
      allPeriods.map((p) => buildPeriodAggregate(business.id, p.fromYM, p.toYM)),
    ),
    prisma.category.findMany({ where: { businessId: business.id } }),
    view === "grid"
      ? buildDataFlowGrid(business.id, primary.fromYM, primary.toYM, null)
      : Promise.resolve(null),
  ]);

  const ccy = business.currency;
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
        title={`Reports — ${primary.label}`}
        subtitle={
          view === "grid"
            ? "Category × month grid for the chosen period."
            : business.name
        }
        right={
          <ReportPeriodPicker
            granularity={periodKind}
            anchor={primary.anchor}
            compare={compare}
            view={view}
            start={sp.start}
            end={sp.end}
          />
        }
      />
      <ReportsTabs />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Revenue (income)"
          value={fmtMoneyWhole(aggregates[0].income, ccy)}
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
          value={fmtMoneyWhole(aggregates[0].expenses, ccy)}
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
          value={fmtMoneyWhole(aggregates[0].netProfit, ccy)}
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

      {view === "comparison" ? (
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
                      {revenueByPeriod.map((v, i) => (
                        <td
                          key={i}
                          className={`text-right font-bold whitespace-nowrap ${i === 0 ? "text-good" : "text-slate-300"}`}
                        >
                          +{fmtMoneyExact(v, ccy)}
                          {i > 0 ? (
                            <DeltaPct cur={revenueByPeriod[0]} prev={v} isImprovementWhenUp={true} />
                          ) : null}
                        </td>
                      ))}
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
                      const display = r.isIncome
                        ? value > 0 ? `+${fmtMoneyExact(value, ccy)}` : "—"
                        : value > 0 ? `−${fmtMoneyExact(value, ccy)}` : "—";
                      const tone = r.isIncome
                        ? "text-good"
                        : value > 0 ? "text-bad" : "text-slate-500";
                      return (
                        <td
                          key={i}
                          className={`text-right whitespace-nowrap ${
                            isPrimary ? `font-semibold ${tone}` : "text-slate-400"
                          }`}
                        >
                          {display}
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
              {outcomeByPeriod.map((v, i) => (
                <td
                  key={i}
                  className={`text-right font-semibold whitespace-nowrap ${i === 0 ? "text-bad" : "text-slate-400"}`}
                >
                  −{fmtMoneyExact(v, ccy)}
                  {i > 0 ? (
                    <DeltaPct cur={outcomeByPeriod[0]} prev={v} isImprovementWhenUp={false} />
                  ) : null}
                </td>
              ))}
            </tr>

            {/* P&L row */}
            <tr className={netByPeriod[0] >= 0 ? "bg-good/10" : "bg-bad/10"}>
              <td className="font-bold">P&amp;L</td>
              <td>
                <span className={netByPeriod[0] >= 0 ? "pill-good" : "pill-bad"}>
                  {netByPeriod[0] >= 0 ? "Profit" : "Loss"}
                </span>
              </td>
              {netByPeriod.map((v, i) => (
                <td
                  key={i}
                  className={`text-right whitespace-nowrap ${i === 0 ? "font-bold" : ""} ${v >= 0 ? "text-good" : "text-bad"}`}
                >
                  {fmtMoneyExact(v, ccy)}
                  {i > 0 ? (
                    <DeltaPct cur={netByPeriod[0]} prev={v} isImprovementWhenUp={true} />
                  ) : null}
                </td>
              ))}
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
      ) : gridData ? (
        <CategoryGrid grid={gridData} ccy={ccy} categories={categories} />
      ) : null}
    </>
  );
}

// Category × month grid for the chosen period. Each row is a category;
// columns are the months in the period plus a total. Net-per-month
// summary row at the bottom.
function CategoryGrid({
  grid,
  ccy,
  categories,
}: {
  grid: Awaited<ReturnType<typeof buildDataFlowGrid>>;
  ccy: string;
  categories: { name: string; kind: string }[];
}) {
  // Sort: revenue (income) categories first, then outcomes — same rule the
  // Comparison view uses.
  const kindByName = new Map<string, string>();
  for (const c of categories) kindByName.set(c.name, c.kind);
  const sortedCategories = [...grid.categories].sort((a, b) => {
    const aKind = kindByName.get(a.name) ?? a.kind;
    const bKind = kindByName.get(b.name) ?? b.kind;
    return compareCategoriesIncomeFirst(
      { kind: aKind, name: a.name },
      { kind: bKind, name: b.name },
    );
  });
  const incomeTotal = grid.months.reduce(
    (s, ym) => s + (grid.totalsByMonth[ym]?.income ?? 0),
    0,
  );
  const expenseTotal = grid.months.reduce(
    (s, ym) => s + (grid.totalsByMonth[ym]?.expense ?? 0),
    0,
  );
  return (
    <div className="card mb-6 overflow-x-auto">
      <div className="font-medium mb-3">
        Category grid — {ymToLabel(grid.fromYM)} → {ymToLabel(grid.toYM)}
        <span className="text-slate-400 text-sm ml-2">
          {grid.months.length} month{grid.months.length === 1 ? "" : "s"}
        </span>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th className="sticky left-0 bg-ink-900 z-10">Category</th>
            <th className="sticky left-[140px] bg-ink-900 z-10">Bucket</th>
            {grid.months.map((ym) => (
              <th key={ym} className="text-right whitespace-nowrap">
                {ymToLabel(ym)}
              </th>
            ))}
            <th className="text-right whitespace-nowrap font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map((cat) => (
            <tr key={cat.name}>
              <td className="sticky left-0 bg-ink-900/95 font-medium">{cat.name}</td>
              <td className="sticky left-[140px] bg-ink-900/95">
                <span className="pill">{cat.kind}</span>
              </td>
              {grid.months.map((ym) => {
                const v = grid.cells[ym]?.[cat.name];
                if (v == null) {
                  return (
                    <td key={ym} className="text-right text-slate-600">
                      —
                    </td>
                  );
                }
                const tone =
                  v > 0 ? "text-good" : v < 0 ? "text-bad" : "text-slate-500";
                const display = v === 0 ? "0" : fmtMoney(v, ccy);
                return (
                  <td key={ym} className={`text-right ${tone}`}>
                    {display}
                  </td>
                );
              })}
              <td
                className={`text-right font-semibold ${
                  (grid.totalsByCategory[cat.name] ?? 0) > 0
                    ? "text-good"
                    : (grid.totalsByCategory[cat.name] ?? 0) < 0
                      ? "text-bad"
                      : "text-slate-400"
                }`}
              >
                {fmtMoney(grid.totalsByCategory[cat.name] ?? 0, ccy)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-line">
            <td
              className="sticky left-0 bg-ink-900/95 font-bold uppercase text-xs tracking-wide"
              colSpan={2}
            >
              Net per month
            </td>
            {grid.months.map((ym) => {
              const net = grid.totalsByMonth[ym]?.net ?? 0;
              return (
                <td
                  key={ym}
                  className={`text-right font-semibold ${net >= 0 ? "text-good" : "text-bad"}`}
                >
                  {fmtMoney(net, ccy)}
                </td>
              );
            })}
            <td
              className={`text-right font-bold ${
                incomeTotal - expenseTotal >= 0 ? "text-good" : "text-bad"
              }`}
            >
              {fmtMoney(incomeTotal - expenseTotal, ccy)}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="text-xs text-slate-500 mt-3">
        Once a category appears anywhere in your history, it persists in every later month — 0 means &quot;no transactions in that month after the category was introduced&quot;. A dash &quot;—&quot; means the category hadn&apos;t been introduced yet.
      </div>
    </div>
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
