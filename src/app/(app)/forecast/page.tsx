// Forecast tab - decision impact engine.
//
// Two layers:
//   1. Baseline forecast - extrapolates the chosen historical window forward
//   2. Scenario forecast - baseline + manual assumptions (hires, marketing
//      cuts, new contracts, one-time hits, etc.)
//
// The user picks a historical period and a forecast horizon at the top, then
// clicks event cards in the Scenario Builder to add assumptions. The chart,
// summary cards, and insights panel all redraw against both layers.

import PageHeader from "@/components/PageHeader";
import ForecastTabs from "@/components/ForecastTabs";
import { getServerT } from "@/lib/i18n/server";
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
import {
  evaluateReadiness,
  buildForecastEngine,
  isForecastReady,
} from "@/lib/forecastEngine";
import { computeEmployeeCost, effectiveStatus, type EmployeeRow } from "@/lib/workforce";
import { hasFeature, getPlanFor, getQuota } from "@/lib/billing";
import LockedOverlay from "@/components/billing/LockedOverlay";
import ForecastReadinessBanner from "./ForecastReadinessBanner";
import ForecastExplanationPanel from "./ForecastExplanationPanel";
import ForecastSetup from "./ForecastSetup";
import ForecastChart from "./ForecastChart";
import { type RosterMember } from "./ScenarioBuilder";
import ScenarioBuilderPanel from "./ScenarioBuilderPanel";
import ScenarioBuilderTrigger from "./ScenarioBuilderTrigger";
import ActiveScenarioAssumptions from "./ActiveScenarioAssumptions";
import BankIntelligenceEmptyState from "@/components/BankIntelligenceEmptyState";

function isHistoricalValue(v: string | undefined): v is HistoricalPeriodValue {
  return (
    v === "recommended" || v === "3m" || v === "6m" || v === "12m" ||
    v === "18m" || v === "24m" || v === "ytd" || v === "last_year" || v === "custom"
  );
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
  const canScenarios = await hasFeature(business.id, "scenarioBuilder");
  const currentPlan  = await getPlanFor(business.id);
  const sp = await searchParams;
  const view: "overview" | "scenarios" = sp.view === "scenarios" ? "scenarios" : "overview";

  // Forecast horizon + custom historical range are Pro-only. Free is
  // capped at "Next 3 months" and the preset historical windows. Read
  // the existing forecastMonths quota: Free=3, Pro="unlimited".
  const forecastQuota = await getQuota(business.id, "forecastMonths");
  const canLongForecast = forecastQuota === "unlimited" || forecastQuota > 3;

  // Shared benefit list for the scenario-builder upgrade prompts -
  // used in both the empty-state and populated-state LockedOverlay.
  const scenarioBenefits = [
    "Model hires, cuts, contracts, marketing shifts side by side",
    "Stack multiple scenarios + compare against baseline",
    "Long-term forecasting horizons + confidence bands",
    "Full export to Excel, CSV, PDF",
  ];
  // Forecast workspace splits into three internal views:
  //   "overview"  - passive AI outlook (default)
  //   "scenarios" - interactive scenario builder
  //   Workforce Planning lives on /workforce as its own route
  // (view was already resolved above so we can short-circuit the
  // Scenarios tab when locked / empty without doing the rest of the
  // engine work first.)

  const rawHistorical: HistoricalPeriodValue = isHistoricalValue(sp.historical) ? sp.historical : "12m";
  const rawHorizon = horizonByForecastValue(sp.horizon ?? "12m");
  // Free users only get presets + the 3-month horizon. Quietly clamp
  // anything richer so a Pro→Free downgrade (or a bookmarked URL)
  // doesn't render content that's supposed to be locked. The picker
  // also blocks these choices but the server is the source of truth.
  const historical: HistoricalPeriodValue = !canLongForecast && rawHistorical === "custom" ? "12m" : rawHistorical;
  const horizon = !canLongForecast && rawHorizon.months > 3
    ? horizonByForecastValue("3m")
    : rawHorizon;
  const range = resolveHistoricalRange(historical, sp.hist_from, sp.hist_to);

  // Run the centralized engine so we get the readiness gate,
  // structured explanation, confidence score, and warnings. The
  // existing baseline/scenario rendering below still uses the legacy
  // forecast.ts entry points; the engine output is the *explanation
  // layer* we render alongside.
  const readiness = await evaluateReadiness(business.id);
  const engineBaselineId =
    historical === "recommended" ? "recommended" :
    historical === "3m"          ? "last_quarter" :
    historical === "6m"          ? "last_6m" :
    historical === "12m"         ? "last_12m" :
    historical === "18m"         ? "last_18m" :
    historical === "24m"         ? "last_24m" :
    historical === "custom"      ? "custom" :
    "recommended";
  const engineHorizonId =
    horizon.months <= 3  ? "3m" as const :
    horizon.months <= 6  ? "6m" as const :
    horizon.months <= 12 ? "12m" as const : "24m" as const;

  const [baseline, assumptionRows, employees, totalTxnCount] = await Promise.all([
    loadBaseline(business.id, range.fromYM, range.toYM, range.label),
    prisma.forecastAssumption.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.employee.findMany({
      where: { businessId: business.id },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.count({ where: { businessId: business.id } }),
  ]);
  // True empty state — no transactions of any kind. Replaces the
  // "Forecast unavailable" technical card with the platform-wide
  // bank-intelligence empty state, so this surface speaks the same
  // language as Dashboard / Insights / Consultation.
  const isEmpty = totalTxnCount === 0;

  // The Scenario Builder uses this roster to constrain "Terminate employee",
  // "Remove contractor", and the "Specific employee" salary-increase mode -
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

  // Overview is the clean forecast - it ignores Scenario Builder
  // assumptions entirely (those live in the Scenarios tab). Feed the
  // engine an empty assumption list when on Overview so every
  // downstream UI element (KPI tiles, chart, month-by-month table,
  // insights) automatically respects the same rule with no per-view
  // branching elsewhere.
  const effectiveAssumptions = view === "scenarios" ? assumptions : [];
  const points = runScenario(baseline, horizon.months, effectiveAssumptions);
  const summary = summarizeForecast(points);
  // Baseline run still gets computed for the Scenarios tab (used in
  // the comparison insights). On Overview it's identical to `points`
  // since effectiveAssumptions is empty.
  const baselinePoints = view === "scenarios"
    ? runScenario(baseline, horizon.months, [])
    : points;
  const baselineInsights = generateForecastInsights(baseline, baselinePoints, [], business.currency);
  const scenarioInsights = generateForecastInsights(baseline, points, assumptions, business.currency);
  const insights = view === "scenarios" ? scenarioInsights : baselineInsights;

  const ccy = business.currency;
  const baselineNetDelta = summary.scenarioNetTotal - summary.baselineNetTotal;
  const { t } = await getServerT();

  // Run the engine for the explanation layer. We pass the same
  // assumptions the legacy path uses on the Scenarios view so the
  // engine's `scenariosApplied` matches what the user sees.
  const engineResult = await buildForecastEngine({
    businessId:   business.id,
    baselineId:   engineBaselineId,
    horizonId:    engineHorizonId,
    customFromYM: sp.hist_from,
    customToYM:   sp.hist_to,
    assumptions:  effectiveAssumptions,
  });

  // Two short-circuit states on the Scenarios tab:
  //   • Not upgraded (canScenarios=false) → upgrade flow only
  //   • Upgraded but no assumptions saved  → empty-state message only
  // In both, suppress the engine/banner/KPIs/chart/table and the
  // historical/horizon controls in the page header. The user asked
  // for *nothing else* on the tab in those states.
  const scenariosLocked = view === "scenarios" && !canScenarios;
  const scenariosEmpty  = view === "scenarios" && canScenarios && assumptions.length === 0;
  const scenariosBare   = scenariosLocked || scenariosEmpty;

  return (
    <>
      <PageHeader
        title={t("page.forecast.title")}
        subtitle={
          view === "scenarios"
            ? t("page.forecast.subtitle.scenarios")
            : t("page.forecast.subtitle.overview")
        }
        right={
          scenariosBare ? null : (
            <div className="flex items-end gap-3 flex-wrap justify-end">
              <ForecastSetup
                historical={historical}
                horizon={horizon.value}
                histFrom={sp.hist_from}
                histTo={sp.hist_to}
                canLongForecast={canLongForecast}
                currentPlan={currentPlan}
              />
              {/* Persistent Scenario Builder entry point - only appears
                  on the Scenarios view AFTER the user has at least one
                  assumption in play. */}
              {view === "scenarios" && assumptions.length > 0 && canScenarios ? (
                <ScenarioBuilderTrigger />
              ) : null}
            </div>
          )
        }
      />
      <ForecastTabs />

      {scenariosLocked ? (
        <ScenariosLockedCard plan={currentPlan} benefits={scenarioBenefits} />
      ) : null}

      {scenariosEmpty ? (
        <ScenariosEmptyCard
          roster={roster}
          activePayrollSum={activePayrollSum}
          maxMonthsAhead={horizon.months}
          currency={ccy}
        />
      ) : null}

      {scenariosBare ? null : (<>

      {/* No transactions at all → platform-wide empty state. Replaces
          the technical "Forecast unavailable" card and points the user
          directly at the bank upload flow with consistent copy. */}
      {isEmpty ? (
        <BankIntelligenceEmptyState surface="forecast" />
      ) : !engineResult.ok ? (
        <div className="card mb-6 border-warn/40 bg-warn/10 px-6 py-8">
          <div className="text-base font-semibold text-warn mb-2 uppercase tracking-wide">
            Forecast unavailable
          </div>
          <div className="text-sm text-slate-200 leading-relaxed">
            {engineResult.message}
          </div>
        </div>
      ) : (
        <>
          <ForecastReadinessBanner readiness={readiness} />
          <ForecastExplanationPanel result={engineResult} currency={ccy} />
        </>
      )}

      {/* Forecast body - tiles, chart, table, insights - only renders
          when the engine has produced a usable forecast. The
          "Forecast unavailable" card above replaces this entire
          section otherwise. */}
      {engineResult.ok ? <>

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
          <LockedOverlay
            locked={!canScenarios}
            feature="Scenario Builder"
            plan={currentPlan}
            benefits={scenarioBenefits}
          >
            <ScenarioBuilderPanel
              roster={roster}
              activePayrollSum={activePayrollSum}
              maxMonthsAhead={horizon.months}
              currency={ccy}
            />
          </LockedOverlay>
        </>
      ) : null}

      {/* Forecast body - KPI cards, insights, chart, table. The
          Scenarios empty + locked states are intercepted upstream
          (scenariosBare short-circuit), so this section only runs
          for Overview or for Scenarios with active assumptions. */}
      {/* KPI tiles. On Overview `effectiveAssumptions` is empty, so
          `summary.scenarioRevenueTotal` etc. equal the baseline
          totals and the 'baseline:' / 'vs baseline' subtext folds
          back to the same number - Overview reads clean. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected revenue</div>
          <div className="mt-2 text-xl font-semibold text-good">
            +{fmtMoney(summary.scenarioRevenueTotal, ccy)}
          </div>
          {view === "scenarios" ? (
            <div className="text-xs text-slate-400 mt-1">
              baseline: +{fmtMoney(summary.baselineRevenueTotal, ccy)}
            </div>
          ) : null}
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected expenses</div>
          <div className="mt-2 text-xl font-semibold text-bad">
            −{fmtMoney(summary.scenarioExpensesTotal, ccy)}
          </div>
          {view === "scenarios" ? (
            <div className="text-xs text-slate-400 mt-1">
              baseline: −{fmtMoney(summary.baselineExpensesTotal, ccy)}
            </div>
          ) : null}
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projected net profit</div>
          <div className={`mt-2 text-xl font-semibold ${summary.scenarioNetTotal >= 0 ? "text-good" : "text-bad"}`}>
            {fmtMoney(summary.scenarioNetTotal, ccy)}
          </div>
          {view === "scenarios" ? (
            <div className={`text-xs mt-1 ${baselineNetDelta >= 0 ? "text-good" : "text-bad"}`}>
              {baselineNetDelta >= 0 ? "+" : "−"}{fmtMoney(Math.abs(baselineNetDelta), ccy)} vs baseline
            </div>
          ) : null}
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
              : "Not enough data yet - once a few months of history exist, the baseline outlook will populate here."}
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
            : "Projections are estimates based on your historical activity. They are not guarantees - actual results depend on execution and market conditions."}
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

      {/* Detailed month-by-month table - collapsed by default on
          Overview so the page reads as insights-first, not a data
          dump. On Scenarios the table is open by default since the
          user is actively investigating the projection. */}
      {/* On Overview, `points` is computed with effectiveAssumptions
          = [] so baseline + scenario columns show the same numbers.
          On Scenarios, points includes the manual assumptions so
          the right-hand columns reflect the delta. */}
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
              <th>{view === "scenarios" ? "Active scenarios" : "Notes"}</th>
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
                  {p.notes.length ? p.notes.slice(0, 3).join(", ") + (p.notes.length > 3 ? "…" : "") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      </> : null}

      </>)}

    </>
  );
}

// Scenarios tab — Free plan. Shows ONLY the upgrade flow; KPIs,
// readiness, chart and table are all suppressed by the caller via the
// `scenariosBare` short-circuit. Built on LockedOverlay so the user
// gets the same upgrade modal as every other gated surface.
function ScenariosLockedCard({ plan, benefits }: { plan: string; benefits: string[] }) {
  return (
    <LockedOverlay
      locked={true}
      feature="Scenario Builder"
      plan={plan}
      benefits={benefits}
      blurb="Model hires, contracts, marketing shifts and one-offs against your baseline. Upgrade to Pro to unlock."
    >
      <div className="card min-h-[320px] flex flex-col items-center justify-center text-center">
        <div className="text-base font-semibold text-slate-100 mb-2">Scenario Builder</div>
        <div className="text-sm text-slate-400 max-w-md">
          Stack hires, cuts, contract changes and one-offs against your baseline forecast and see them update live.
        </div>
      </div>
    </LockedOverlay>
  );
}

// Scenarios tab — Pro plan, no assumptions saved yet. Single empty-
// state card with an inline trigger that opens the Scenario Builder
// side panel (mounted alongside so the event has a listener).
function ScenariosEmptyCard({
  roster, activePayrollSum, maxMonthsAhead, currency,
}: {
  roster: RosterMember[];
  activePayrollSum: number;
  maxMonthsAhead: number;
  currency: string;
}) {
  return (
    <>
      <div className="card text-center py-16">
        <div className="text-base font-semibold text-slate-100 mb-2">
          You have no active scenarios
        </div>
        <div className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Build a scenario to model how a hire, contract change, marketing
          shift or one-off would move your forecast.
        </div>
        <div className="flex justify-center">
          <ScenarioBuilderTrigger />
        </div>
      </div>
      <ScenarioBuilderPanel
        roster={roster}
        activePayrollSum={activePayrollSum}
        maxMonthsAhead={maxMonthsAhead}
        currency={currency}
      />
    </>
  );
}
