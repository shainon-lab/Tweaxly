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
import ForecastTabs from "@/components/ForecastTabs";
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
import { computeEmployeeCost, effectiveStatus, type EmployeeRow } from "@/lib/workforce";
import ForecastSetup from "./ForecastSetup";
import ForecastChart from "./ForecastChart";
import { type RosterMember } from "./ScenarioBuilder";
import ScenarioBuilderPanel from "./ScenarioBuilderPanel";
import ScenarioBuilderTrigger from "./ScenarioBuilderTrigger";
import ScenariosOnboarding from "./ScenariosOnboarding";
import ActiveScenarioAssumptions from "./ActiveScenarioAssumptions";

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
    view?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  // Forecast workspace splits into three internal views:
  //   "overview"  — passive AI outlook (default)
  //   "scenarios" — interactive scenario builder
  //   Workforce Planning lives on /workforce as its own route
  const view: "overview" | "scenarios" = sp.view === "scenarios" ? "scenarios" : "overview";

  const historical: HistoricalPeriodValue = isHistoricalValue(sp.historical) ? sp.historical : "12m";
  const horizon = horizonByForecastValue(sp.horizon ?? "12m");
  const range = resolveHistoricalRange(historical, sp.hist_from, sp.hist_to);

  const [baseline, assumptionRows, employees] = await Promise.all([
    loadBaseline(business.id, range.fromYM, range.toYM, range.label),
    prisma.forecastAssumption.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.employee.findMany({
      where: { businessId: business.id },
      orderBy: { name: "asc" },
    }),
  ]);

  // The Scenario Builder uses this roster to constrain "Terminate employee",
  // "Remove contractor", and the "Specific employee" salary-increase mode —
  // so each picks from the actual roster, not free-text.
  const roster: RosterMember[] = employees.map((e) => {
    const row: EmployeeRow = {
      id: e.id, name: e.name, role: e.role,
      employmentType: e.employmentType, department: e.department,
      employerTaxes: e.employerTaxes, pension: e.pension,
      benefits: e.benefits, additionalCosts: e.additionalCosts,
      status: e.status,
      grossMonthlySalary: e.grossMonthlySalary,
      employerCostMultiplier: e.employerCostMultiplier,
      startDate: e.startDate, endDate: e.endDate, notes: e.notes,
    };
    return {
      id: e.id,
      name: e.name,
      role: e.role ?? null,
      employmentType: (e.employmentType ?? "employee").toLowerCase(),
      status: effectiveStatus(row),
      monthlyCost: computeEmployeeCost(row).total,
      grossSalary: e.grossMonthlySalary,
    };
  });
  const activePayrollSum = roster
    .filter((r) => r.status === "active" && r.employmentType === "employee")
    .reduce((s, r) => s + r.monthlyCost, 0);

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
  // Two distinct intelligence streams:
  //   - Forecast Insights (Overview): baseline-only, what the system
  //     currently expects regardless of any user-applied assumptions.
  //     Pass an empty assumption set so the engine doesn't bake in
  //     scenario context.
  //   - Scenario Impact Analysis (Scenarios): includes the user's
  //     assumptions so the engine can talk about deltas vs baseline.
  const baselinePoints = runScenario(baseline, horizon.months, []);
  const baselineInsights = generateForecastInsights(baseline, baselinePoints, [], business.currency);
  const scenarioInsights = generateForecastInsights(baseline, points, assumptions, business.currency);
  const insights = view === "scenarios" ? scenarioInsights : baselineInsights;

  const ccy = business.currency;
  const baselineNetDelta = summary.scenarioNetTotal - summary.baselineNetTotal;

  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle={
          view === "scenarios"
            ? `Scenarios — model 'what if' decisions against ${range.label.toLowerCase()} of history over the ${horizon.label.toLowerCase()}.`
            : `Overview — AI projection based on ${range.label.toLowerCase()} (${baseline.monthCount} mo of history) over the ${horizon.label.toLowerCase()}.`
        }
        right={
          <div className="flex items-end gap-3 flex-wrap justify-end">
            <ForecastSetup
              historical={historical}
              horizon={horizon.value}
              histFrom={sp.hist_from}
              histTo={sp.hist_to}
            />
            {/* Persistent Scenario Builder entry point — only appears
                on the Scenarios view AFTER the user has at least one
                assumption in play. Before that, the onboarding empty
                state provides the inline entry instead. */}
            {view === "scenarios" && assumptions.length > 0 ? (
              <ScenarioBuilderTrigger />
            ) : null}
          </div>
        }
      />
      <ForecastTabs />

      {/* Scenarios view, empty state. Hide everything else (KPIs,
          chart, insights, table) until the user has at least one
          assumption — the empty state owns the screen and provides
          its own inline builder entry. */}
      {view === "scenarios" && assumptions.length === 0 ? (
        <ScenariosOnboarding
          roster={roster}
          activePayrollSum={activePayrollSum}
          maxMonthsAhead={horizon.months}
          currency={ccy}
        />
      ) : null}

      {/* Scenarios view, populated. Show active-assumption chips and
          mount the side panel (the panel listens for the open event
          dispatched by ScenarioBuilderTrigger in the header). */}
      {view === "scenarios" && assumptions.length > 0 ? (
        <>
          <ActiveScenarioAssumptions
            assumptions={assumptions.map((a) => ({
              id: a.id,
              family: a.family,
              type: a.type,
              label: a.label,
              amount: a.amount,
              percentage: a.percentage,
              startMonth: a.startMonth,
              endMonth: a.endMonth,
              isRecurring: a.isRecurring,
            }))}
            currency={ccy}
          />
          <ScenarioBuilderPanel
            roster={roster}
            activePayrollSum={activePayrollSum}
            maxMonthsAhead={horizon.months}
            currency={ccy}
          />
        </>
      ) : null}

      {/* Forecast body — KPI cards, insights, chart, table. Hidden
          when the user is in the Scenarios empty state. */}
      {!(view === "scenarios" && assumptions.length === 0) ? (
        <>
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

      {/* Insights card differentiates per view:
           Overview  → 'Forecast Insights' (baseline, passive,
                       no scenario assumptions baked in)
           Scenarios → 'Scenario Impact Analysis' (assumption-aware,
                       comparative tone, accent border)        */}
      <div className={`card mb-6 ${view === "scenarios" ? "border-accent/40" : ""}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <div className="font-medium text-slate-100">
            {view === "scenarios" ? "Scenario Impact Analysis" : "Forecast Insights"}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            {view === "scenarios" ? "Compared to current forecast" : "AI baseline outlook"}
          </div>
        </div>
        {insights.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">
            {view === "scenarios"
              ? "Add scenario assumptions to see how each decision moves projected profit."
              : "Not enough data yet — once a few months of history exist, the baseline outlook will populate here."}
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-slate-200">
            {insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-0.5 ${view === "scenarios" ? "text-accent" : "text-slate-500"}`}>•</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-slate-500 mt-4">
          {view === "scenarios"
            ? "Impact is calculated against the AI baseline outlook. Estimates depend on execution and market conditions."
            : "Projections are estimates based on your historical activity. They are not guarantees — actual results depend on execution and market conditions."}
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
        showScenario={view === "scenarios"}
      />

      {/* Detailed month-by-month table — collapsed by default on
          Overview so the page reads as insights-first, not a data
          dump. On Scenarios the table is open by default since the
          user is actively investigating the projection. */}
      <details className="card mb-6 overflow-x-auto" open={view === "scenarios"}>
        <summary className="cursor-pointer font-medium mb-3 select-none">
          Month-by-month projection
        </summary>
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
      </details>
        </>
      ) : null}

    </>
  );
}
