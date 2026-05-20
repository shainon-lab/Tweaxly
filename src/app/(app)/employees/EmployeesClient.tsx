"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: string; name: string; role: string | null;
  grossMonthlySalary: number; employerCostMultiplier: number;
  startDate: string; endDate: string | null; notes: string | null;
};

type EmpEvent = {
  id: string; type: string; employeeId: string | null;
  effectiveDate: string; amount: number | null; notes: string | null;
};

type EmpCost = { recurring: number; oneTime: number; total: number; employeeCount: number };

export default function EmployeesClient({
  employees, events, currency, nowCost, futureCost, nowYM, nextYM,
}: {
  employees: Employee[];
  events: EmpEvent[];
  currency: string;
  nowCost: EmpCost;
  futureCost: EmpCost;
  nowYM: string;
  nextYM: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [empDraft, setEmpDraft] = useState<Partial<Employee>>({
    name: "", role: "", grossMonthlySalary: 0, employerCostMultiplier: 1.25,
    startDate: new Date().toISOString().slice(0, 10), endDate: null, notes: "",
  });
  const [evDraft, setEvDraft] = useState<Partial<EmpEvent>>({
    type: "bonus", employeeId: employees[0]?.id ?? null,
    effectiveDate: new Date().toISOString().slice(0, 10), amount: 0, notes: "",
  });

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const delta = futureCost.total - nowCost.total;

  async function addEmployee() {
    if (!empDraft.name || !empDraft.grossMonthlySalary) return;
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empDraft),
    });
    if (!res.ok) { alert(await res.text()); return; }
    setEmpDraft({ ...empDraft, name: "", role: "", notes: "", grossMonthlySalary: 0 });
    startTransition(() => router.refresh());
  }

  async function terminate(id: string) {
    const date = prompt("End date (YYYY-MM-DD)?", new Date().toISOString().slice(0, 10));
    if (!date) return;
    await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, endDate: date }),
    });
    startTransition(() => router.refresh());
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Delete this employee record? Events will be unlinked, not deleted.")) return;
    await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  async function addEvent() {
    const res = await fetch("/api/employees/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evDraft),
    });
    if (!res.ok) { alert(await res.text()); return; }
    setEvDraft({ ...evDraft, amount: 0, notes: "" });
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Payroll cost - {nowYM}</div>
          <div className="mt-2 text-2xl font-semibold">{fmt.format(nowCost.total)}</div>
          <div className="text-xs text-slate-400 mt-1">{nowCost.employeeCount} active · {fmt.format(nowCost.recurring)} recurring{nowCost.oneTime > 0 ? ` + ${fmt.format(nowCost.oneTime)} one-time` : ""}</div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Forecast - {nextYM}</div>
          <div className="mt-2 text-2xl font-semibold">{fmt.format(futureCost.total)}</div>
          <div className="text-xs text-slate-400 mt-1">{futureCost.employeeCount} expected active</div>
        </div>
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Month-over-month delta</div>
          <div className={`mt-2 text-2xl font-semibold ${delta < 0 ? "text-good" : delta > 0 ? "text-warn" : "text-slate-100"}`}>
            {delta >= 0 ? "+" : "−"}{fmt.format(Math.abs(delta))}
          </div>
          <div className="text-xs text-slate-400 mt-1">Driven by hires, terminations, and one-time events on the schedule.</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="font-medium mb-3">Add employee</div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div className="md:col-span-2"><label className="label">Name</label><input className="input" value={empDraft.name ?? ""} onChange={(e) => setEmpDraft({ ...empDraft, name: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Role</label><input className="input" value={empDraft.role ?? ""} onChange={(e) => setEmpDraft({ ...empDraft, role: e.target.value })} /></div>
          <div><label className="label">Gross / month</label><input className="input" type="number" value={empDraft.grossMonthlySalary ?? 0} onChange={(e) => setEmpDraft({ ...empDraft, grossMonthlySalary: Number(e.target.value) })} /></div>
          <div><label className="label">Employer cost ×</label><input className="input" type="number" step="0.01" value={empDraft.employerCostMultiplier ?? 1.25} onChange={(e) => setEmpDraft({ ...empDraft, employerCostMultiplier: Number(e.target.value) })} /></div>
          <div><label className="label">Start</label><input className="input" type="date" value={empDraft.startDate ?? ""} onChange={(e) => setEmpDraft({ ...empDraft, startDate: e.target.value })} /></div>
          <div className="md:col-span-7 flex justify-end"><button className="btn-primary" onClick={addEmployee}>Add employee</button></div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="font-medium mb-3">Roster</div>
        {employees.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">No employees yet.</div>
        ) : (
          <table className="table-base">
            <thead>
              <tr><th>Name</th><th>Role</th><th className="text-right">Gross/mo</th><th className="text-right">Full cost/mo</th><th>Start</th><th>End</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td>
                  <td className="text-slate-300">{e.role}</td>
                  <td className="text-right">{fmt.format(e.grossMonthlySalary)}</td>
                  <td className="text-right">{fmt.format(e.grossMonthlySalary * e.employerCostMultiplier)}</td>
                  <td className="text-slate-300">{e.startDate}</td>
                  <td className="text-slate-300">{e.endDate ?? <span className="pill-good">active</span>}</td>
                  <td className="space-x-2 text-right">
                    {!e.endDate ? <button className="btn-ghost py-1" disabled={pending} onClick={() => terminate(e.id)}>Terminate</button> : null}
                    <button className="btn-danger py-1" disabled={pending} onClick={() => deleteEmployee(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card mb-6">
        <div className="font-medium mb-3">Add employee event</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div><label className="label">Type</label>
            <select className="input" value={evDraft.type} onChange={(e) => setEvDraft({ ...evDraft, type: e.target.value })}>
              <option value="bonus">Bonus</option>
              <option value="salary_change">Salary change</option>
              <option value="one_time">One-time payment</option>
              <option value="hire">Hire (note)</option>
              <option value="termination">Termination (note)</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Employee</label>
            <select className="input" value={evDraft.employeeId ?? ""} onChange={(e) => setEvDraft({ ...evDraft, employeeId: e.target.value || null })}>
              <option value="">- None -</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div><label className="label">Effective</label><input className="input" type="date" value={evDraft.effectiveDate ?? ""} onChange={(e) => setEvDraft({ ...evDraft, effectiveDate: e.target.value })} /></div>
          <div><label className="label">Amount</label><input className="input" type="number" value={evDraft.amount ?? 0} onChange={(e) => setEvDraft({ ...evDraft, amount: Number(e.target.value) })} /></div>
          <div className="md:col-span-1 flex justify-end"><button className="btn-primary" onClick={addEvent}>Add</button></div>
          <div className="md:col-span-6"><label className="label">Notes</label><input className="input" value={evDraft.notes ?? ""} onChange={(e) => setEvDraft({ ...evDraft, notes: e.target.value })} /></div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Events log</div>
        {events.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">No events yet.</div>
        ) : (
          <table className="table-base">
            <thead><tr><th>Date</th><th>Type</th><th>Employee</th><th className="text-right">Amount</th><th>Notes</th></tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td className="text-slate-300">{ev.effectiveDate}</td>
                  <td><span className="pill">{ev.type}</span></td>
                  <td>{employees.find((e) => e.id === ev.employeeId)?.name ?? <span className="text-slate-500">-</span>}</td>
                  <td className="text-right">{ev.amount != null ? fmt.format(ev.amount) : "-"}</td>
                  <td className="text-slate-300">{ev.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
