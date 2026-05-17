import PageHeader from "@/components/PageHeader";
import ForecastTabs from "@/components/ForecastTabs";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EmployeesClient from "./EmployeesClient";
import { activeEmployeeCost } from "@/lib/metrics";
import { todayYM, shiftYM } from "@/lib/format";

export default async function EmployeesPage() {
  const { business } = await requireBusiness();
  const [employees, events] = await Promise.all([
    prisma.employee.findMany({ where: { businessId: business.id }, orderBy: { startDate: "desc" } }),
    prisma.employeeEvent.findMany({ where: { businessId: business.id }, orderBy: { effectiveDate: "desc" } }),
  ]);
  const ym = todayYM();
  const next = shiftYM(ym, 1);
  const [now, future] = await Promise.all([
    activeEmployeeCost(business.id, ym),
    activeEmployeeCost(business.id, next),
  ]);
  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle="Workforce Planning · Edit Roster — manage employees, salaries, and lifecycle events."
      />
      <ForecastTabs />
      <EmployeesClient
        employees={employees.map((e) => ({
          id: e.id, name: e.name, role: e.role,
          grossMonthlySalary: e.grossMonthlySalary,
          employerCostMultiplier: e.employerCostMultiplier,
          startDate: e.startDate.toISOString().slice(0, 10),
          endDate: e.endDate ? e.endDate.toISOString().slice(0, 10) : null,
          notes: e.notes,
        }))}
        events={events.map((ev) => ({
          id: ev.id, type: ev.type, employeeId: ev.employeeId,
          effectiveDate: ev.effectiveDate.toISOString().slice(0, 10),
          amount: ev.amount, notes: ev.notes,
        }))}
        currency={business.currency}
        nowCost={now}
        futureCost={future}
        nowYM={ym}
        nextYM={next}
      />
    </>
  );
}
