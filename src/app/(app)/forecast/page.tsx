// Forecast tab — decision impact engine.
//
// Two layers:
//   1. Baseline forecast — extrapolates the chosen historical window forward
//   2. Scenario forecast — baseline + manual assumptions (hires, marketing
//      cuts, new contracts, one-time hits, etc.)
//
// The user picks a historical period and a forecast horizon at the top, then
// clicks event cards in the Scenario Builder to add assumptions. The chart,
// summary cards, and insights panel all redraw against both layers.

import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  loadBaseline,
  runScenario,
  summarizeForecast,
  generateForecastInsights,
  resolveHistoricalRange,
  horizonByForecastValue,
  type HistoricalPeriodValue,
  type Assumption,
} from "@/lib/forecast";
import { fmtMoney } from "@/lib/format";
import ForecastSetup from "./ForecastSetup";
import ForecastChart from "./ForecastChart";
import ScenarioBuilder from "./ScenarioBuilder";

function isHistoricalValue(v: string | undefined): v is HistoricalPeriodValue {
  return v === "3m" || v === "6m" || v === "12m" || v === "ytd" || v === "last_year" || v === "custom";
}

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{
    historical?: string;
    horizon?: string;
    hist_from?: string;
    hist_to?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const historical: HistoricalPeriodValue = isHistoricalValue(sp.historical) ? sp.historical : "12m";
  const horizon = horizonByForecastValue(sp.horizon ?? "12m");
  const range = resolveHistoricalRange(historical, sp.hist_from, sp.hist_to);

  const [baseline, assumptionRows] = await Promise.all([
    loadBaseline(business.id, range.fromYM, range.toYM, range.label),
    prisma.forecastAssumption.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Hide assumptions whose startMonth is beyond the forecast horizon so the
  // engine doesn't pull them into a chart they wouldn't show on anyway.
  const assumptions: Assumption[] = assumptionRows.map((r) => ({
    id: r.id,
    family: r.family,
    type: r.type,
    label: r.label,
    category: r.category,
    amount: r.amount,
    percentage: r.percentage,
    startMonth: r.startMonth,
    endMonth: r.endMonth,
    isRecurring: r.isRecurring,
    notes: r.notes,
  }));

  const points = runScenario(baseline, horizon.months, assumptions);
  const summary = summarizeForecast(points);
  const insights = generateForecastInsights(baseline, points, assumptions, business.currency);

  const ccy = business.currency;
  const baselineNetDelta = summary.scenarioNetTotal - summary.baselineNetTotal;

  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle={`Forecasting based on ${range.label.toLowerCase()} (${baseline.monthCount} mo of history) over the ${horizon.label.toLowerCase()}.`}
      />

      <ForecastSetup
        historical={historical}
        horizon={horizon.value}
        histFrom={sp.hist_from}
        histTo={sp.hist_to}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected revenue</div>
          <div className="mt-2 text-xl font-semibold text-good">
            +{fmtMoney(summary.scenarioRevenueTotal, ccy)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            baseline: +{fmtMoney(summary.baselineRevenueTotal, ccy)}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected expenses</div>
          <div className="mt-2 text-xl font-semibold text-bad">
            −{fmtMoney(summary.scenarioExpensesTotal, ccy)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            baseline: −{fmtMoney(summary.baselineExpensesTotal, ccy)}
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected net profit</div>
          <div className={`mt-2 text-xl font-semibold ${summary.scenarioNetTotal >= 0 ? "text-good" : "text-bad"}`}>
            {fmtMoney(summary.scenarioNetTotal, ccy)}
          </div>
          <div className={`text-xs mt-1 ${baselineNetDelta >= 0 ? "text-good" : "text-bad"}`}>
            {baselineNetDelta >= 0 ? "+" : "−"}{fmtMoney(Math.abs(baselineNetDelta), ccy)} vs baseline
          </div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Avg monthly net</div>
          <div className={`mt-2 text-xl font-semibold ${summary.scenarioAvgMonthlyNet >= 0 ? "text-good" : "text-bad"}`}>
            {fmtMoney(summary.scenarioAvgMonthlyNet, ccy)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {summary.scenarioAvgMonthlyNet >= 0 ? "monthly profit" : "monthly burn"} · {horizon.months} months
          </div>
        </div>
      </div>

      <ForecastChart
        points={points.map((p) => ({
          ym: p.ym,
          index: p.index,
          baselineRevenue: p.baselineRevenue,
          baselineExpenses: p.baselineExpenses,
          baselineNet: p.baselineNet,
          scenarioRevenue: p.scenarioRevenue,
          scenarioExpenses: p.scenarioExpenses,
          scenarioNet: p.scenarioNet,
        }))}
      />

      <ScenarioBuilder
        assumptions={assumptions.map((a) => ({
          id: a.id,
          family: a.family,
          type: a.type,
          label: a.label,
          category: a.category ?? null,
          amount: a.amount,
          percentage: a.percentage,
          startMonth: a.startMonth,
          endMonth: a.endMonth,
          isRecurring: a.isRecurring,
          notes: a.notes ?? null,
        }))}
        maxMonthsAhead={horizon.months}
        currency={ccy}
      />

      <div className="card mb-6">
        <div className="font-medium mb-2">Insights</div>
        {insights.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">
            Add scenario assumptions to see how each decision moves projected profit.
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-slate-200">
            {insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-slate-500 mt-4">
          These projections are estimates based on the selected historical period and your scenario assumptions. They are not guarantees — actual results depend on execution and market conditions.
        </div>
      </div>

      <div className="card mb-6 overflow-x-auto">
        <div className="font-medium mb-3">Month-by-month projection</div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-right">Baseline revenue</th>
              <th className="text-right">Baseline expenses</th>
              <th className="text-right">Baseline net</th>
              <th className="text-right">Scenario revenue</th>
              <th className="text-right">Scenario expenses</th>
              <th className="text-right">Scenario net</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.index}>
                <td className="font-medium">{p.ym}</td>
                <td className="text-right text-slate-300">+{fmtMoney(p.baselineRevenue, ccy)}</td>
                <td className="text-right text-slate-300">−{fmtMoney(p.baselineExpenses, ccy)}</td>
                <td className={`text-right ${p.baselineNet >= 0 ? "text-good" : "text-bad"}`}>
                  {fmtMoney(p.baselineNet, ccy)}
                </td>
                <td className="text-right text-good">+{fmtMoney(p.scenarioRevenue, ccy)}</td>
                <td className="text-right text-bad">−{fmtMoney(p.scenarioExpenses, ccy)}</td>
                <td className={`text-right font-semibold ${p.scenarioNet >= 0 ? "text-good" : "text-bad"}`}>
                  {fmtMoney(p.scenarioNet, ccy)}
                </td>
                <td className="text-xs text-slate-400">
                  {p.notes.length ? p.notes.slice(0, 3).join(", ") + (p.notes.length > 3 ? "…" : "") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
