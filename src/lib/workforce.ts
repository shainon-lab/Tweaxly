// Workforce financial helpers — cost breakdown per employee, roster
// aggregation, payroll trend & forecast. Used by the /workforce page and any
// consumer that needs payroll intelligence beyond the simple total
// `activeEmployeeCost()` already exposes.

import { prisma } from "./db";
import { shiftYM, todayYM, ymToLabel } from "./format";
import { buildMonthSnapshot } from "./metrics";

// Shape we operate on internally — flexible enough to swallow Prisma's
// EmployeeGetPayload without naming it (so callers don't need to import a
// generated type).
export type EmployeeRow = {
  id: string;
  name: string;
  role: string | null;
  employmentType: string | null;
  department: string | null;
  employerTaxes: number | null;
  pension: number | null;
  benefits: number | null;
  additionalCosts: number | null;
  status: string | null;
  grossMonthlySalary: number;
  employerCostMultiplier: number;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
};

export type EmployeeCostBreakdown = {
  gross: number;
  employerTaxes: number;
  pension: number;
  benefits: number;
  additionalCosts: number;
  total: number;
  annualizedTotal: number;
  hasExplicitBreakdown: boolean;
};

// Real monthly cost. If any of the breakdown fields are set explicitly we
// use them; otherwise we fall back to gross * employerCostMultiplier and
// attribute the overhead share to "employer taxes" so the table still
// renders something sensible for legacy rows.
export function computeEmployeeCost(e: EmployeeRow): EmployeeCostBreakdown {
  const gross = e.grossMonthlySalary;
  const explicit =
    e.employerTaxes != null ||
    e.pension != null ||
    e.benefits != null ||
    e.additionalCosts != null;
  if (explicit) {
    const employerTaxes = e.employerTaxes ?? 0;
    const pension = e.pension ?? 0;
    const benefits = e.benefits ?? 0;
    const additionalCosts = e.additionalCosts ?? 0;
    const total = gross + employerTaxes + pension + benefits + additionalCosts;
    return {
      gross, employerTaxes, pension, benefits, additionalCosts,
      total, annualizedTotal: total * 12,
      hasExplicitBreakdown: true,
    };
  }
  const overhead = gross * Math.max(0, (e.employerCostMultiplier || 1) - 1);
  const total = gross + overhead;
  return {
    gross,
    employerTaxes: overhead,
    pension: 0,
    benefits: 0,
    additionalCosts: 0,
    total,
    annualizedTotal: total * 12,
    hasExplicitBreakdown: false,
  };
}

// Status derived from start/end dates if not explicitly set. "planned" means
// the start date is in the future; "terminated" means the end date has
// passed; otherwise "active".
export function effectiveStatus(e: EmployeeRow, refDate = new Date()): string {
  if (e.status === "active" || e.status === "planned" || e.status === "terminated") return e.status;
  if (e.startDate > refDate) return "planned";
  if (e.endDate && e.endDate < refDate) return "terminated";
  return "active";
}

// Was this employee active on the first day of the given YM?
export function isActiveInMonth(e: EmployeeRow, ym: string): boolean {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const endExclusive = new Date(Date.UTC(y, m, 1));
  if (e.startDate >= endExclusive) return false;
  if (e.endDate && e.endDate < start) return false;
  return true;
}

export type WorkforceSummary = {
  totalMonthly: number;
  activeCount: number;
  plannedCount: number;
  terminatedCount: number;
  contractorCount: number;
  fixedCost: number;     // employees (recurring monthly)
  variableCost: number;  // contractors + freelancers
  avgCostPerEmployee: number;
};

export function summarizeWorkforce(rows: EmployeeRow[], refDate = new Date()): WorkforceSummary {
  let totalMonthly = 0;
  let activeCount = 0;
  let plannedCount = 0;
  let terminatedCount = 0;
  let contractorCount = 0;
  let fixedCost = 0;
  let variableCost = 0;
  for (const e of rows) {
    const status = effectiveStatus(e, refDate);
    if (status === "planned") plannedCount++;
    if (status === "terminated") terminatedCount++;
    if (status !== "active") continue;
    activeCount++;
    const cost = computeEmployeeCost(e).total;
    totalMonthly += cost;
    const type = (e.employmentType ?? "employee").toLowerCase();
    if (type === "contractor" || type === "freelancer") {
      contractorCount++;
      variableCost += cost;
    } else {
      fixedCost += cost;
    }
  }
  return {
    totalMonthly,
    activeCount,
    plannedCount,
    terminatedCount,
    contractorCount,
    fixedCost,
    variableCost,
    avgCostPerEmployee: activeCount > 0 ? totalMonthly / activeCount : 0,
  };
}

// Payroll cost for a given month, using the roster + breakdown logic. This
// is what the workforce charts / forecast use so explicit breakdown fields
// flow through end-to-end.
export function payrollForMonth(rows: EmployeeRow[], ym: string): number {
  let total = 0;
  for (const e of rows) {
    if (!isActiveInMonth(e, ym)) continue;
    total += computeEmployeeCost(e).total;
  }
  return total;
}

// Historical payroll from accounting transactions (the "actuals"). Falls
// back to roster-derived payroll for months with no booked payroll, so the
// chart isn't full of zero bars for businesses that haven't categorized
// their payroll yet.
export async function buildPayrollSeries(
  businessId: string,
  rows: EmployeeRow[],
  monthsBack: number,
  forecastMonths: number,
  anchorYM?: string,
): Promise<{
  ym: string;
  label: string;
  historicalPayroll: number;
  forecastPayroll: number;
  revenue: number;
}[]> {
  const anchor = anchorYM ?? shiftYM(todayYM(), -1); // last complete month
  const out: {
    ym: string;
    label: string;
    historicalPayroll: number;
    forecastPayroll: number;
    revenue: number;
  }[] = [];
  // Historical
  for (let i = monthsBack - 1; i >= 0; i--) {
    const ym = shiftYM(anchor, -i);
    const snap = await buildMonthSnapshot(businessId, ym);
    const booked = snap.payroll;
    const rostered = payrollForMonth(rows, ym);
    out.push({
      ym,
      label: ymToLabel(ym),
      historicalPayroll: booked > 0 ? booked : rostered,
      forecastPayroll: 0,
      revenue: snap.income,
    });
  }
  // Forecast: forward from current month using roster
  const forecastStart = todayYM();
  for (let i = 0; i < forecastMonths; i++) {
    const ym = shiftYM(forecastStart, i);
    out.push({
      ym,
      label: ymToLabel(ym),
      historicalPayroll: 0,
      forecastPayroll: payrollForMonth(rows, ym),
      revenue: 0,
    });
  }
  return out;
}

export type WorkforceInsight = {
  level: "info" | "good" | "warn" | "bad";
  text: string;
};

// Compute a small set of plain-English insights from the payroll series and
// the current summary. Pulled into the page as a "Workforce Insights" feed.
export function buildWorkforceInsights(
  series: { ym: string; historicalPayroll: number; revenue: number }[],
  summary: WorkforceSummary,
  affordableHires: number,
): WorkforceInsight[] {
  const out: WorkforceInsight[] = [];
  // 6-month delta on payroll
  const hist = series.filter((s) => s.historicalPayroll > 0);
  if (hist.length >= 6) {
    const window = hist.slice(-6);
    const first = window[0].historicalPayroll;
    const last = window[window.length - 1].historicalPayroll;
    if (first > 0) {
      const pct = (last - first) / first;
      if (Math.abs(pct) >= 0.05) {
        out.push({
          level: pct > 0.15 ? "warn" : pct > 0 ? "info" : "good",
          text: `Payroll ${pct > 0 ? "increased" : "decreased"} ${(Math.abs(pct) * 100).toFixed(1)}% over the last 6 months.`,
        });
      }
    }
  }
  // Payroll vs revenue trend
  if (hist.length >= 3) {
    const window = hist.slice(-3);
    const totalPay = window.reduce((s, m) => s + m.historicalPayroll, 0);
    const totalRev = window.reduce((s, m) => s + m.revenue, 0);
    if (totalRev > 0) {
      const ratio = totalPay / totalRev;
      out.push({
        level: ratio > 0.5 ? "warn" : ratio > 0.35 ? "info" : "good",
        text: `Payroll represents ${(ratio * 100).toFixed(1)}% of revenue across the trailing 3 months.`,
      });
    }
    // Faster-than-revenue growth
    if (window.length === 3) {
      const payDelta = window[2].historicalPayroll - window[0].historicalPayroll;
      const revDelta = window[2].revenue - window[0].revenue;
      if (window[0].historicalPayroll > 0 && window[0].revenue > 0) {
        const payPct = payDelta / window[0].historicalPayroll;
        const revPct = revDelta / window[0].revenue;
        if (payPct > 0.05 && payPct > revPct + 0.05) {
          out.push({
            level: "warn",
            text: "Payroll is growing faster than revenue.",
          });
        }
      }
    }
  }
  // Contractor share
  if (summary.activeCount > 0) {
    const share = summary.contractorCount / summary.activeCount;
    if (share > 0.4) {
      out.push({
        level: "info",
        text: `${(share * 100).toFixed(0)}% of the active workforce is contractors or freelancers — variable cost weighted.`,
      });
    }
  }
  // Affordable hires (cap to non-silly numbers)
  if (affordableHires > 0 && summary.activeCount > 0) {
    out.push({
      level: "info",
      text: `At the current pace, the business can support roughly ${affordableHires} additional employee${affordableHires === 1 ? "" : "s"} without trimming other expenses.`,
    });
  }
  if (summary.plannedCount > 0) {
    out.push({
      level: "info",
      text: `${summary.plannedCount} planned hire${summary.plannedCount === 1 ? "" : "s"} on the roster — projected payroll already reflects ${summary.plannedCount === 1 ? "this" : "these"} once ${summary.plannedCount === 1 ? "it" : "they"} start.`,
    });
  }
  return out;
}
