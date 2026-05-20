import PageHeader from "@/components/PageHeader";
import ReportsInnerTabs from "@/components/ReportsInnerTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import {
  buildDataFlow,
  buildDataFlowSummary,
  RANGE_LABEL,
  type DataFlowRange,
} from "@/lib/dataflow";
import DataFlowFilters from "./DataFlowFilters";
import SummaryTable from "./SummaryTable";
import { fmtMoney, fmtPct, ymToLabel } from "@/lib/format";
import { breakdownFromDb } from "@/lib/currencyBreakdown";
import MoneyAmountWithCurrencyBreakdown from "@/components/MoneyAmountWithCurrencyBreakdown";

const VALID_RANGES: DataFlowRange[] = [
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "all",
  "custom",
];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DataFlowPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    category?: string;
    view?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  const sp = await searchParams;
  const range = (VALID_RANGES.includes(sp.range as DataFlowRange)
    ? (sp.range as DataFlowRange)
    : "all") as DataFlowRange;
  const categoryFilter =
    sp.category && sp.category !== "__all__" ? sp.category : null;
  const view: "summary" | "detail" = sp.view === "detail" ? "detail" : "summary";
  const customStart = range === "custom" ? sp.start : undefined;
  const customEnd = range === "custom" ? sp.end : undefined;
  // Defaults the filter UI feeds into its date pickers when the user first
  // switches to "custom".
  const initialStart = sp.start ?? todayISODate();
  const initialEnd = sp.end ?? todayISODate();

  // Always build the full grid once so the dropdown can list every category
  const fullGrid = await buildDataFlow(business.id, range, null, customStart, customEnd);
  const ccy = business.currency;

  return (
    <>
      <PageHeader
        title={t("page.trends.title")}
        subtitle={`${RANGE_LABEL[range]}${categoryFilter ? ` · ${categoryFilter}` : ""}. ${view === "summary" ? "P&L summary" : "Per-month detail"}.`}
        right={
          <DataFlowFilters
            range={range}
            category={categoryFilter ?? "__all__"}
            view={view}
            start={initialStart}
            end={initialEnd}
            allCategories={fullGrid.categories.map((c) => c.name)}
          />
        }
      />
      <ReportsInnerTabs />

      {view === "summary" ? (
        <SummaryView
          businessId={business.id}
          range={range}
          categoryFilter={categoryFilter}
          customStart={customStart}
          customEnd={customEnd}
          ccy={ccy}
        />
      ) : (
        <DetailView
          businessId={business.id}
          range={range}
          categoryFilter={categoryFilter}
          customStart={customStart}
          customEnd={customEnd}
          ccy={ccy}
        />
      )}
    </>
  );
}

async function SummaryView({
  businessId,
  range,
  categoryFilter,
  customStart,
  customEnd,
  ccy,
}: {
  businessId: string;
  range: DataFlowRange;
  categoryFilter: string | null;
  customStart?: string;
  customEnd?: string;
  ccy: string;
}) {
  const summary = await buildDataFlowSummary(
    businessId,
    range,
    categoryFilter,
    customStart,
    customEnd,
  );

  // Currency breakdowns for the three headline tiles. We re-filter
  // by accountingMonth using the summary's resolved window so the
  // breakdown is exactly the same row set the summary already
  // bucketed. Income txns for Revenue, non-revenue non-transfer for
  // Outcome, the union (signed) for P&L.
  const fromYM = summary.fromYM;
  const toYM   = summary.toYM;
  const periodWhere = {
    businessId,
    accountingMonth: { gte: fromYM, lte: toYM },
    isExcludedFromPnl: false,
    type: { not: "transfer" },
  } as const;
  const [revFx, outFx, pnlFx] = await Promise.all([
    breakdownFromDb({ ...periodWhere, category: { kind: "revenue" } }, ccy, { absolute: true }),
    breakdownFromDb({ ...periodWhere, NOT: { category: { kind: "revenue" } } }, ccy, { absolute: true }),
    breakdownFromDb(periodWhere, ccy),
  ]);

  if (
    summary.revenue === 0 &&
    summary.outcomes.length === 0
  ) {
    return (
      <div className="card text-center py-12">
        <div className="text-lg font-medium">No data in this window</div>
        <div className="text-sm text-slate-400 mt-1">
          Either no uploads cover this period yet, or the chosen category has no
          data here. Try "All time" or upload more data.
        </div>
      </div>
    );
  }

  const monthsLabel =
    summary.monthCount === 1 ? "1 month" : `${summary.monthCount} months`;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Window</div>
          <div className="mt-2 text-base font-semibold">
            {ymToLabel(summary.fromYM)} → {ymToLabel(summary.toYM)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{monthsLabel}</div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Revenue</div>
          <div className="mt-2 text-xl font-semibold text-good">
            +<MoneyAmountWithCurrencyBreakdown
              convertedTotal={summary.revenue}
              baseCurrency={ccy}
              currencyBreakdown={revFx.currencyBreakdown}
              hasMultipleCurrencies={revFx.hasMultipleCurrencies}
              conversionMethod={revFx.conversionMethod}
              dateRange={{ from: `${fromYM}-01`, to: `${toYM}-01` }}
            />
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Total outcome</div>
          <div className="mt-2 text-xl font-semibold text-bad">
            −<MoneyAmountWithCurrencyBreakdown
              convertedTotal={summary.totalOutcome}
              baseCurrency={ccy}
              currencyBreakdown={outFx.currencyBreakdown}
              hasMultipleCurrencies={outFx.hasMultipleCurrencies}
              conversionMethod={outFx.conversionMethod}
              dateRange={{ from: `${fromYM}-01`, to: `${toYM}-01` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {summary.outcomes.length} categor{summary.outcomes.length === 1 ? "y" : "ies"}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">P&amp;L</div>
          <div
            className={`mt-2 text-xl font-semibold ${summary.pnl >= 0 ? "text-good" : "text-bad"}`}
          >
            <MoneyAmountWithCurrencyBreakdown
              convertedTotal={summary.pnl}
              baseCurrency={ccy}
              currencyBreakdown={pnlFx.currencyBreakdown}
              hasMultipleCurrencies={pnlFx.hasMultipleCurrencies}
              conversionMethod={pnlFx.conversionMethod}
              dateRange={{ from: `${fromYM}-01`, to: `${toYM}-01` }}
              signed
            />
          </div>
          <div
            className={`text-xs mt-1 ${
              summary.marginPct == null
                ? "text-slate-400"
                : summary.marginPct >= 0
                  ? "text-good"
                  : "text-bad"
            }`}
          >
            {summary.marginPct == null
              ? "no revenue"
              : `${summary.marginPct >= 0 ? "Profit" : "Loss"} margin: ${fmtPct(summary.marginPct)}`}
          </div>
        </div>
      </div>

      <SummaryTable
        ccy={ccy}
        revenue={summary.revenue}
        revenues={summary.revenues}
        outcomes={summary.outcomes}
        totalOutcome={summary.totalOutcome}
        pnl={summary.pnl}
        marginPct={summary.marginPct}
        monthCount={summary.monthCount}
        fromYM={summary.fromYM}
        toYM={summary.toYM}
        noRevenueDetected={summary.revenue <= 0 && summary.outcomes.length > 0}
      />
    </>
  );
}

async function DetailView({
  businessId,
  range,
  categoryFilter,
  customStart,
  customEnd,
  ccy,
}: {
  businessId: string;
  range: DataFlowRange;
  categoryFilter: string | null;
  customStart?: string;
  customEnd?: string;
  ccy: string;
}) {
  const grid = await buildDataFlow(
    businessId,
    range,
    categoryFilter,
    customStart,
    customEnd,
  );

  if (grid.months.length === 0 || grid.categories.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-lg font-medium">No data in this window</div>
        <div className="text-sm text-slate-400 mt-1">
          Either no uploads cover this period yet, or the chosen category has no
          data here. Try "All time" or upload more data.
        </div>
      </div>
    );
  }

  const incomeTotal = grid.months.reduce(
    (s, ym) => s + (grid.totalsByMonth[ym]?.income ?? 0),
    0,
  );
  const expenseTotal = grid.months.reduce(
    (s, ym) => s + (grid.totalsByMonth[ym]?.expense ?? 0),
    0,
  );
  // Revenue (income) categories first, then outcome categories.
  const sortedCategories = [...grid.categories].sort(compareCategoriesIncomeFirst);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Window</div>
          <div className="mt-2 text-base font-semibold">
            {ymToLabel(grid.fromYM)} → {ymToLabel(grid.toYM)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {grid.months.length} month{grid.months.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Income</div>
          <div className="mt-2 text-xl font-semibold text-good">
            +{fmtMoney(incomeTotal, ccy)}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Expenses</div>
          <div className="mt-2 text-xl font-semibold text-bad">
            −{fmtMoney(expenseTotal, ccy)}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Net</div>
          <div
            className={`mt-2 text-xl font-semibold ${incomeTotal - expenseTotal >= 0 ? "text-good" : "text-bad"}`}
          >
            {fmtMoney(incomeTotal - expenseTotal, ccy)}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
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
                <td className="sticky left-0 bg-ink-900/95 font-medium">
                  {cat.name}
                </td>
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
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Once a category appears anywhere in your history, it persists in every
        later month — 0 means "no transactions in that month after the category
        was introduced". A dash "—" means the category hadn't been introduced
        yet.
      </div>
    </>
  );
}
