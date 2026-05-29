// Workforce Planning - financial intelligence about the team. Lives
// under Forecast as a planning lever, NOT as a standalone HR product.
// It answers: how much does the team cost, how fast is payroll
// growing, can the business afford additional hires, and what's the
// impact of workforce changes on profit / cashflow.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ForecastHelp from "@/components/ForecastHelp";
import ForecastTabs from "@/components/ForecastTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildPayrollSeries,
  buildWorkforceInsights,
  computeEmployeeCost,
  effectiveStatus,
  summarizeWorkforce,
  type EmployeeRow,
} from "@/lib/workforce";
import { buildMonthSnapshot } from "@/lib/metrics";
import { shiftYM, todayYM, fmtMoney, fmtPct } from "@/lib/format";
import EmployeeTable, { type WorkforceEmployeeRow } from "./EmployeeTable";
import WorkforcePayrollChart from "./WorkforcePayrollChart";
import ScenarioBuilderPanel from "../forecast/ScenarioBuilderPanel";
import WorkforceBuilderTrigger from "./WorkforceBuilderTrigger";
import { type RosterMember } from "../forecast/ScenarioBuilder";
import { hasFeature, getPlanFor } from "@/lib/billing";
import LockedOverlay from "@/components/billing/LockedOverlay";

const LEVEL_BAR: Record<string, string> = {
  good: "border-good/40",
  warn: "border-warn/40",
  bad:  "border-bad/40",
  info: "border-accent/40",
};

export default async function WorkforcePage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  const ccy = business.currency;

  // Workforce Planning is Pro-only. Free users get the same locked
  // upgrade card pattern as the Scenarios tab - PageHeader and
  // ForecastTabs render, everything else is suppressed in favor of
  // a single LockedOverlay card.
  const canWorkforce = await hasFeature(business.id, "workforcePlanning");
  const currentPlan  = await getPlanFor(business.id);

  if (!canWorkforce) {
    return (
      <>
        <PageHeader
          title={t("page.workforce.title")}
          subtitle={t("page.workforce.subtitle")}
        />
        <ForecastTabs />
        <LockedOverlay
          locked={true}
          feature="Workforce Planning"
          plan={currentPlan}
          benefits={[
            "Live payroll cost, % of revenue, change vs. last month, and 12-month forecast",
            "Model hires, cuts, contract changes and one-offs",
            "Revenue + monthly cost per employee, affordable-hires estimate",
            "Full Excel / CSV / PDF export",
          ]}
          blurb="See team cost, payroll trends and hiring headroom at a glance. Upgrade to Pro to unlock."
        >
          <div className="card min-h-[320px] flex flex-col items-center justify-center text-center">
            <div className="text-base font-semibold text-slate-100 mb-2">Workforce Planning</div>
            <div className="text-sm text-slate-400 max-w-md">
              Financial intelligence about your team - how much it costs, how fast
              payroll is growing, and what hires you can afford.
            </div>
          </div>
        </LockedOverlay>
      </>
    );
  }

  const employees = await prisma.employee.findMany({
    where: { businessId: business.id },
    orderBy: { startDate: "desc" },
  });

  const rows: EmployeeRow[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    employmentType: e.employmentType,
    department: e.department,
    employerTaxes: e.employerTaxes,
    pension: e.pension,
    benefits: e.benefits,
    additionalCosts: e.additionalCosts,
    status: e.status,
    grossMonthlySalary: e.grossMonthlySalary,
    employerCostMultiplier: e.employerCostMultiplier,
    startDate: e.startDate,
    endDate: e.endDate,
    notes: e.notes,
  }));

  const summary = summarizeWorkforce(rows);

  // Build the roster the Scenario Builder needs. Workforce Planning
  // surfaces the same payroll/team scenario events as Forecast, so
  // it can reuse the same Builder component - just scoped to
  // payroll-family events via the filter on the open trigger.
  const roster: RosterMember[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role ?? null,
    employmentType: (r.employmentType ?? "employee").toLowerCase(),
    status: effectiveStatus(r),
    monthlyCost: computeEmployeeCost(r).total,
    grossSalary: r.grossMonthlySalary,
  }));
  const activePayrollSum = roster
    .filter((r) => r.status === "active" && r.employmentType === "employee")
    .reduce((s, r) => s + r.monthlyCost, 0);
  // Workforce Planning doesn't have its own horizon picker yet;
  // default to a 12-month modelling window which matches Forecast's
  // default. The number only controls how far out the assumption's
  // end-month picker goes, not what's shown in the chart.
  const builderMaxMonthsAhead = 12;

  // Payroll vs revenue (last 6 months). Use last complete month as anchor so
  // an in-progress month doesn't drag the trend down.
  const anchor = shiftYM(todayYM(), -1);
  const series = await buildPayrollSeries(business.id, rows, 6, 12, anchor);

  // Latest complete month's revenue for the % of revenue card.
  const lastSnap = await buildMonthSnapshot(business.id, anchor);
  const lastPayrollActual = lastSnap.payroll > 0 ? lastSnap.payroll : summary.totalMonthly;
  const lastRevenue = lastSnap.income;
  const payrollPctRevenue = lastRevenue > 0 ? lastPayrollActual / lastRevenue : null;

  // MoM payroll change
  const prevSnap = await buildMonthSnapshot(business.id, shiftYM(anchor, -1));
  const prevPayroll = prevSnap.payroll > 0 ? prevSnap.payroll : lastPayrollActual;
  const payrollMoM = prevPayroll > 0
    ? (lastPayrollActual - prevPayroll) / prevPayroll
    : null;

  // Forecasted total payroll over the next 12 months from the roster.
  const forecast12 = series
    .filter((s) => s.forecastPayroll > 0)
    .reduce((s, m) => s + m.forecastPayroll, 0);

  // Affordable additional hires - what's left in monthly profit divided by
  // the average cost per active employee. Capped so the insight stays sane.
  const monthlyProfit = lastSnap.income - lastSnap.expenses;
  const avgCost = summary.avgCostPerEmployee;
  const affordableHires = avgCost > 0 && monthlyProfit > 0
    ? Math.min(20, Math.floor(monthlyProfit / avgCost))
    : 0;

  const insights = buildWorkforceInsights(series, summary, affordableHires);

  // Trailing 3-month revenue for "revenue per employee" / "burn per employee".
  const trail3 = series.filter((s) => s.historicalPayroll > 0).slice(-3);
  const avgMonthlyRevenue = trail3.length > 0
    ? trail3.reduce((s, m) => s + m.revenue, 0) / trail3.length
    : 0;
  const revenuePerEmployee = summary.activeCount > 0
    ? avgMonthlyRevenue / summary.activeCount
    : 0;
  const burnPerEmployee = summary.activeCount > 0
    ? summary.totalMonthly / summary.activeCount
    : 0;

  // Determine card tones based on healthy/warning/risky bands.
  const payrollPctTone =
    payrollPctRevenue == null ? "text-slate-200" :
    payrollPctRevenue >= 0.5  ? "text-bad"        :
    payrollPctRevenue >= 0.35 ? "text-warn"       :
                                "text-good";
  const momTone =
    payrollMoM == null ? "text-slate-300" :
    payrollMoM >= 0.10 ? "text-bad"        :
    payrollMoM >= 0.03 ? "text-warn"       :
    payrollMoM <= -0.03 ? "text-good"      :
                          "text-slate-300";

  const tableRows: WorkforceEmployeeRow[] = rows.map((r) => {
    const cost = computeEmployeeCost(r);
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      department: r.department,
      employmentType: (r.employmentType ?? "employee").toLowerCase(),
      status: effectiveStatus(r),
      gross: cost.gross,
      employerTaxes: cost.employerTaxes,
      pension: cost.pension,
      benefits: cost.benefits,
      additionalCosts: cost.additionalCosts,
      totalMonthly: cost.total,
      annualizedTotal: cost.annualizedTotal,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate ? r.endDate.toISOString().slice(0, 10) : null,
      notes: r.notes,
    };
  });

  return (
    <>
      <PageHeader
        title={t("page.workforce.title")}
        subtitle={t("page.workforce.subtitle")}
        help={<ForecastHelp />}
        right={
          <div className="flex items-center gap-2">
            <Link href="/employees" className="btn-ghost">Edit roster</Link>
            <WorkforceBuilderTrigger />
          </div>
        }
      />
      <ForecastTabs />

      {rows.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-lg font-medium">No employees on the roster yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Add the team in the Employees tab. Every workforce metric on this page is derived from that roster.
          </div>
          <div className="mt-4">
            <Link href="/employees" className="btn-primary">Go to Employees</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="card-tight" title="Real employee cost includes salary, employer taxes, pension, benefits, and additional expenses.">
              <div className="text-xs uppercase tracking-wide text-slate-400">Total monthly payroll</div>
              <div className="mt-2 text-xl font-semibold">{fmtMoney(summary.totalMonthly, ccy)}</div>
              <div className="text-xs text-slate-400 mt-1">salary + taxes + pension + benefits + other</div>
            </div>
            <div className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">Payroll % of revenue</div>
              <div className={`mt-2 text-xl font-semibold ${payrollPctTone}`}>
                {payrollPctRevenue == null ? "-" : fmtPct(payrollPctRevenue)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                healthy &lt; 35% · warning 35–50% · risky &gt; 50%
              </div>
            </div>
            <div className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">Avg cost / employee</div>
              <div className="mt-2 text-xl font-semibold">{fmtMoney(summary.avgCostPerEmployee, ccy)}</div>
              <div className="text-xs text-slate-400 mt-1">across active roster</div>
            </div>
            <div className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">Active employees</div>
              <div className="mt-2 text-xl font-semibold">{summary.activeCount}</div>
              <div className="text-xs text-slate-400 mt-1">
                {summary.plannedCount > 0 ? `+${summary.plannedCount} planned · ` : ""}{summary.contractorCount} contractor{summary.contractorCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">Payroll change vs. last month</div>
              <div className={`mt-2 text-xl font-semibold ${momTone}`}>
                {payrollMoM == null ? "-" : (payrollMoM >= 0 ? "+" : "") + fmtPct(payrollMoM)}
              </div>
              <div className="text-xs text-slate-400 mt-1">vs prior month booked</div>
            </div>
            <div className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">Forecasted (next 12 mo)</div>
              <div className="mt-2 text-xl font-semibold">{fmtMoney(forecast12, ccy)}</div>
              <div className="text-xs text-slate-400 mt-1">roster-derived</div>
            </div>
          </div>

          {/* Workforce Insights / Signals feed */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Workforce signals</div>
              <span className="pill-accent text-[10px]">Auto-generated</span>
            </div>
            {insights.length === 0 ? (
              <div className="text-sm text-slate-400 py-4 text-center">
                Nothing notable in the trailing window. Once payroll moves more than 5% compared to last month or its share of revenue shifts, signals will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map((i, idx) => (
                  <div key={idx} className={`flex items-start gap-3 border-l-2 pl-3 ${LEVEL_BAR[i.level]}`}>
                    <div className="text-sm text-slate-200">{i.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <WorkforcePayrollChart data={series} />

          {/* Key metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <Metric label="Revenue per employee" value={fmtMoney(revenuePerEmployee, ccy)} hint="avg trailing 3 mo" />
            <Metric label="Burn per employee"    value={fmtMoney(burnPerEmployee, ccy)}     hint="current monthly cost / heads" />
            <Metric label="Fixed workforce cost" value={fmtMoney(summary.fixedCost, ccy)}   hint="salaried employees" />
            <Metric label="Variable workforce"   value={fmtMoney(summary.variableCost, ccy)} hint="contractors + freelancers" />
            <Metric
              label="Contractor share"
              value={summary.activeCount > 0 ? fmtPct(summary.contractorCount / summary.activeCount) : "-"}
              hint="vs total active"
            />
            <Metric
              label="Affordable hires"
              value={String(affordableHires)}
              hint="at current monthly profit"
            />
          </div>

          <EmployeeTable rows={tableRows} currency={ccy} />
        </>
      )}

      {/* Panel mounted at the page level - listens for the workforce-
          scoped open event dispatched by WorkforceBuilderTrigger in
          the header. Stays mounted even on the empty-roster state so
          the trigger keeps working. */}
      <ScenarioBuilderPanel
        roster={roster}
        activePayrollSum={activePayrollSum}
        maxMonthsAhead={builderMaxMonthsAhead}
        currency={ccy}
      />
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-tight">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
      {hint ? <div className="text-xs text-slate-400 mt-1">{hint}</div> : null}
    </div>
  );
}
