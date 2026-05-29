import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { UserPlus, ClipboardList, History } from "lucide-react";
import ForecastTabs from "@/components/ForecastTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EmployeesClient from "./EmployeesClient";
import { activeEmployeeCost } from "@/lib/metrics";
import { todayYM, shiftYM } from "@/lib/format";

export default async function EmployeesPage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
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
        title={t("page.employees.title")}
        subtitle={t("page.employees.subtitle")}
        help={
          <HowItWorks
            title="How the team roster works"
            intro="Your active team - employees and contractors - with their gross monthly cost, start date, and (optional) end date. The roster feeds Workforce Planning's live payroll number and the 12-month forecast, so changes here ripple through every cash projection."
            cards={[
              { icon: <UserPlus size={16} strokeWidth={1.7} />,      title: "Add a person",   body: "Name, role, gross monthly salary, start date. Contractor flag for non-employees so taxes and benefits don't get added on top of their stated rate." },
              { icon: <ClipboardList size={16} strokeWidth={1.7} />, title: "Loaded cost",    body: "Tweaxly adds employer taxes and benefits on top of gross salary using a region-specific payload rate. Contractors are billed at their stated rate with no payload." },
              { icon: <History size={16} strokeWidth={1.7} />,       title: "Events log",     body: "Raises, role changes, end dates - log them as events so the 12-month forecast picks them up at the right moment in time, not just from today." },
            ]}
            outro="Future-dated events (a hire starting in two months, a planned raise next quarter) are honored by the forecast. End-dated employees drop out of the roster automatically when their date passes."
          />
        }
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
