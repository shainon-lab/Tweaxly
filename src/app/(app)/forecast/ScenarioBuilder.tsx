"use client";

// Scenario builder + assumptions panel.
//
// Three card variants beyond the simple amount/percent form:
//
//   1. Terminate employee  → roster picker filtered to active employees.
//      Selecting an employee auto-fills label + monthly cost; the user just
//      sets a start month and saves.
//   2. Remove contractor   → same idea, filtered to contractors/freelancers.
//   3. Salary increase     → two sub-modes:
//        • Specific employee → pick from roster, enter % OR $ amount.
//          If a % is entered, we compute the dollar amount client-side from
//          the chosen employee's gross salary and store as `amount`.
//        • Overall salary   → no employee picker. Stored as
//          `salary_increase_overall` so the engine applies the % to the
//          baseline payroll (or the flat amount across the team).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssumption } from "./actions";

export type RosterMember = {
  id: string;
  name: string;
  role: string | null;
  employmentType: string;     // "employee" | "contractor" | "freelancer"
  status: string;             // "active" | "planned" | "terminated"
  monthlyCost: number;        // fully-loaded
  grossSalary: number;        // gross monthly — used to compute % raises
};

// Definition of every scenario event card. `fields` decides which inputs
// appear in the form when this card is opened.
type EventDef = {
  key: string;
  family: "revenue" | "expense" | "payroll";
  type: string;
  label: string;
  icon: string;
  fields: ("amount" | "percentage" | "endMonth" | "recurring")[];
  amountHint?: string;
  defaultRecurring?: boolean;
  // If set, opens a roster picker filtered to this employmentType list.
  // The picker also requires status==="active".
  pickFromRoster?: ("employee" | "contractor" | "freelancer")[];
  // If true, the card supports the Specific/Overall mode toggle.
  hasScopeToggle?: boolean;
};

const EVENTS: EventDef[] = [
  // ── Revenue ─────────────────────────────────────────────────────────
  { key: "new-rev",    family: "revenue", type: "new_recurring_revenue", label: "Add new revenue",       icon: "↑",  fields: ["amount", "endMonth", "recurring"], amountHint: "Monthly amount", defaultRecurring: true },
  { key: "lose-rev",   family: "revenue", type: "lose_recurring_revenue", label: "Lose revenue",          icon: "↓",  fields: ["amount", "endMonth", "recurring"], amountHint: "Monthly amount lost", defaultRecurring: true },
  { key: "one-rev",    family: "revenue", type: "one_time_revenue",      label: "One-time revenue",       icon: "✦",  fields: ["amount"],                          amountHint: "Lump sum", defaultRecurring: false },
  { key: "rev-grow",   family: "revenue", type: "revenue_growth",        label: "Revenue growth %",       icon: "↗", fields: ["percentage", "endMonth"],          defaultRecurring: true },
  { key: "rev-decl",   family: "revenue", type: "revenue_decline",       label: "Revenue decline %",      icon: "↘", fields: ["percentage", "endMonth"],          defaultRecurring: true },
  // ── Payroll ─────────────────────────────────────────────────────────
  { key: "hire",       family: "payroll", type: "hire",                  label: "Hire employee",          icon: "+", fields: ["amount", "endMonth"],              amountHint: "Monthly salary cost", defaultRecurring: true },
  { key: "term",       family: "payroll", type: "terminate",             label: "Terminate employee",     icon: "−", fields: ["endMonth"],                        defaultRecurring: true, pickFromRoster: ["employee"] },
  { key: "raise",      family: "payroll", type: "salary_increase",       label: "Salary increase",        icon: "↑", fields: ["amount", "percentage", "endMonth"], amountHint: "Monthly raise amount", defaultRecurring: true, hasScopeToggle: true },
  { key: "bonus",      family: "payroll", type: "bonus",                 label: "One-time bonus",         icon: "★", fields: ["amount"],                          amountHint: "One-time bonus amount", defaultRecurring: false },
  { key: "contr-add",  family: "payroll", type: "contractor_add",        label: "Add contractor",         icon: "+", fields: ["amount", "endMonth"],              amountHint: "Monthly cost", defaultRecurring: true },
  { key: "contr-rem",  family: "payroll", type: "contractor_remove",     label: "Remove contractor",      icon: "−", fields: ["endMonth"],                        defaultRecurring: true, pickFromRoster: ["contractor", "freelancer"] },
  // ── Expense ─────────────────────────────────────────────────────────
  { key: "mkt-up",     family: "expense", type: "marketing_change",      label: "Increase marketing",     icon: "↑", fields: ["amount", "endMonth"],              amountHint: "Monthly increase ($)", defaultRecurring: true },
  { key: "mkt-down",   family: "expense", type: "marketing_change",      label: "Reduce marketing",       icon: "↓", fields: ["amount", "endMonth"],              amountHint: "Monthly cut ($, will be subtracted)", defaultRecurring: true },
  { key: "sw-add",     family: "expense", type: "software_change",       label: "Add software cost",      icon: "+", fields: ["amount", "endMonth"],              amountHint: "Monthly cost", defaultRecurring: true },
  { key: "rec-rm",     family: "expense", type: "remove_recurring",      label: "Remove recurring cost",  icon: "−", fields: ["amount", "endMonth"],              amountHint: "Monthly cost removed", defaultRecurring: true },
  { key: "one-exp",    family: "expense", type: "one_time_expense",      label: "One-time expense",       icon: "✦", fields: ["amount"],                          amountHint: "Lump sum", defaultRecurring: false },
  { key: "exp-grow",   family: "expense", type: "expense_growth",        label: "Expense growth %",       icon: "↗", fields: ["percentage", "endMonth"],          defaultRecurring: true },
  { key: "exp-decl",   family: "expense", type: "expense_decline",       label: "Expense decline %",      icon: "↘", fields: ["percentage", "endMonth"],          defaultRecurring: true },
  // ── Custom ──────────────────────────────────────────────────────────
  { key: "custom",     family: "expense", type: "custom",                label: "Custom scenario item",   icon: "✎", fields: ["amount", "endMonth", "recurring"], amountHint: "Signed monthly delta (+/−)", defaultRecurring: true },
];

const EVENT_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Revenue", keys: ["new-rev", "lose-rev", "one-rev", "rev-grow", "rev-decl"] },
  { title: "Payroll", keys: ["hire", "term", "raise", "bonus", "contr-add", "contr-rem"] },
  { title: "Expenses", keys: ["mkt-up", "mkt-down", "sw-add", "rec-rm", "one-exp", "exp-grow", "exp-decl"] },
  { title: "Other", keys: ["custom"] },
];

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

type RaiseScope = "specific" | "overall";

export default function ScenarioBuilder({
  roster,
  activePayrollSum,
  maxMonthsAhead,
  currency,
  familyFilter,
}: {
  roster: RosterMember[];
  activePayrollSum: number;
  maxMonthsAhead: number;
  currency: string;
  // When set, the event grid only shows event cards whose family is
  // in this list. Used by the Workforce Scenario Builder so the
  // panel surfaces only payroll/workforce events, not revenue or
  // expense assumptions that aren't relevant from /workforce.
  familyFilter?: ("revenue" | "expense" | "payroll")[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [form, setForm] = useState<{
    label: string;
    amount: string;
    percentagePct: string; // entered as percent (e.g. "5" = 5%)
    startMonth: string;
    endMonth: string;
    isRecurring: boolean;
    notes: string;
    employeeId: string;    // selected from roster picker (terminate / remove contractor / specific raise)
    raiseScope: RaiseScope; // for salary_increase only
  }>({
    label: "", amount: "", percentagePct: "", startMonth: "1", endMonth: "",
    isRecurring: true, notes: "", employeeId: "", raiseScope: "specific",
  });

  const def = openKey ? EVENTS.find((e) => e.key === openKey) ?? null : null;

  // Roster filtered for the currently-open card
  const eligibleRoster = def?.pickFromRoster
    ? roster.filter((r) => r.status === "active" && def.pickFromRoster!.includes(r.employmentType as "employee" | "contractor" | "freelancer"))
    : [];

  // For "Salary increase" we want the same active-employee picker when the
  // scope is "specific".
  const raiseEmployees = roster.filter((r) => r.status === "active" && r.employmentType === "employee");

  function openCard(key: string) {
    const d = EVENTS.find((e) => e.key === key);
    setOpenKey(key);
    setForm({
      label: "",
      amount: "",
      percentagePct: "",
      startMonth: "1",
      endMonth: "",
      isRecurring: d?.defaultRecurring ?? true,
      notes: "",
      employeeId: "",
      raiseScope: "specific",
    });
  }

  async function submit() {
    if (!def) return;

    const startMonth = Math.max(1, Math.min(maxMonthsAhead, Number(form.startMonth || 1)));
    const endMonth = form.endMonth.trim() === ""
      ? null
      : Math.max(startMonth, Math.min(maxMonthsAhead, Number(form.endMonth)));

    // Roster-picker variants: terminate / remove contractor
    if (def.pickFromRoster) {
      const emp = eligibleRoster.find((r) => r.id === form.employeeId);
      if (!emp) {
        alert(`Please pick a ${def.pickFromRoster.includes("employee") ? "n employee" : " contractor"} from the dropdown.`);
        return;
      }
      try {
        await createAssumption({
          family: "payroll",
          type: def.type,
          label: `${emp.name}${emp.role ? ` · ${emp.role}` : ""}`,
          amount: Math.round(emp.monthlyCost * 100) / 100,
          percentage: 0,
          startMonth,
          endMonth,
          isRecurring: true,
          notes: form.notes || null,
        });
        setOpenKey(null);
        startTransition(() => router.refresh());
      } catch (e) {
        alert(`Failed to save: ${(e as Error).message}`);
      }
      return;
    }

    // Salary increase variants
    if (def.type === "salary_increase") {
      const pct = Number(form.percentagePct || 0) / 100;
      const amtFromForm = Number(form.amount || 0);
      if (form.raiseScope === "specific") {
        const emp = raiseEmployees.find((r) => r.id === form.employeeId);
        if (!emp) { alert("Pick an employee for the raise."); return; }
        // Resolve $ amount: if user entered a percent, compute it against
        // the employee's gross salary; otherwise use the typed amount.
        const monthlyDelta = pct > 0 ? emp.grossSalary * pct : amtFromForm;
        if (monthlyDelta <= 0) { alert("Enter a positive percent OR amount for the raise."); return; }
        try {
          await createAssumption({
            family: "payroll",
            type: "salary_increase",
            label: `${emp.name}${emp.role ? ` · ${emp.role}` : ""}`,
            amount: Math.round(monthlyDelta * 100) / 100,
            percentage: pct,
            startMonth,
            endMonth,
            isRecurring: true,
            notes: form.notes || null,
          });
          setOpenKey(null);
          startTransition(() => router.refresh());
        } catch (e) {
          alert(`Failed to save: ${(e as Error).message}`);
        }
        return;
      }
      // Overall: stored as a different type so the engine handles it
      // against the baseline payroll instead of as a single per-employee delta.
      if (pct <= 0 && amtFromForm <= 0) {
        alert("Enter a positive percent OR amount for the overall raise.");
        return;
      }
      try {
        await createAssumption({
          family: "payroll",
          type: "salary_increase_overall",
          label: pct > 0
            ? `Overall raise · +${(pct * 100).toFixed(1)}%`
            : `Overall raise · +${fmtMoney(amtFromForm, currency)}/mo`,
          amount: amtFromForm > 0 ? Math.round(amtFromForm * 100) / 100 : 0,
          percentage: pct,
          startMonth,
          endMonth,
          isRecurring: true,
          notes: form.notes || null,
        });
        setOpenKey(null);
        startTransition(() => router.refresh());
      } catch (e) {
        alert(`Failed to save: ${(e as Error).message}`);
      }
      return;
    }

    // ── Default form path (everything else) ──────────────────────────
    if (!form.label.trim()) { alert("Please add a short label."); return; }
    const amt = Number(form.amount || 0);
    const pct = Number(form.percentagePct || 0) / 100;
    const isReductionUI = ["mkt-down"].includes(def.key);
    const signedAmount = isReductionUI ? -Math.abs(amt) : amt;

    try {
      await createAssumption({
        family: def.family,
        type: def.type,
        label: form.label.trim(),
        amount: signedAmount,
        percentage: pct,
        startMonth,
        endMonth,
        isRecurring: form.isRecurring,
        notes: form.notes || null,
      });
      setOpenKey(null);
      startTransition(() => router.refresh());
      // The builder now lives in a side panel — the user keeps
      // seeing the forecast chart behind it, so we no longer
      // scroll the page on save (that used to disorient when the
      // builder was inline at the bottom of the page).
    } catch (e) {
      alert(`Failed to save: ${(e as Error).message}`);
    }
  }

  const selectedRosterEmp = eligibleRoster.find((r) => r.id === form.employeeId);
  const selectedRaiseEmp = raiseEmployees.find((r) => r.id === form.employeeId);

  return (
    <>
      <div id="scenario-builder" className="card mb-4 scroll-mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Scenario Builder</div>
          <div className="text-xs text-slate-400">Click an event to model a business decision</div>
        </div>
        {EVENT_GROUPS.map((g) => {
          // Filter the group's keys to only events whose family is
          // allowed by familyFilter (when supplied). Hide the whole
          // group if no eligible events remain.
          const keys = familyFilter
            ? g.keys.filter((k) => {
                const e = EVENTS.find((x) => x.key === k);
                return e ? familyFilter.includes(e.family) : false;
              })
            : g.keys;
          if (keys.length === 0) return null;
          return (
          <div key={g.title} className="mb-4 last:mb-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">{g.title}</div>
            <div className="flex flex-wrap gap-2">
              {keys.map((k) => {
                const e = EVENTS.find((x) => x.key === k);
                if (!e) return null;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`px-3 py-2 rounded-md text-sm border border-line bg-ink-800 hover:bg-ink-700 transition flex items-center gap-2 ${openKey === k ? "ring-1 ring-accent" : ""}`}
                    onClick={() => openCard(k)}
                  >
                    <span className="w-4 text-center text-slate-400">{e.icon}</span>
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}

        {def ? (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="font-medium mb-3">{def.label}</div>

            {/* Salary-increase scope toggle */}
            {def.hasScopeToggle ? (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">Apply to</span>
                <button
                  type="button"
                  className={`text-xs px-3 py-1 rounded-md border transition ${
                    form.raiseScope === "specific"
                      ? "bg-accent-soft border-accent text-accent"
                      : "border-line text-slate-300 hover:bg-ink-700"
                  }`}
                  onClick={() => setForm({ ...form, raiseScope: "specific" })}
                >
                  Specific employee
                </button>
                <button
                  type="button"
                  className={`text-xs px-3 py-1 rounded-md border transition ${
                    form.raiseScope === "overall"
                      ? "bg-accent-soft border-accent text-accent"
                      : "border-line text-slate-300 hover:bg-ink-700"
                  }`}
                  onClick={() => setForm({ ...form, raiseScope: "overall" })}
                >
                  Overall salary
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              {/* Roster picker (terminate / remove contractor) */}
              {def.pickFromRoster ? (
                <div className="md:col-span-3">
                  <label className="label">
                    {def.pickFromRoster.includes("employee") ? "Employee" : "Contractor"}
                  </label>
                  {eligibleRoster.length === 0 ? (
                    <div className="text-xs text-slate-400 px-3 py-2 rounded-md border border-line">
                      No active {def.pickFromRoster.includes("employee") ? "employees" : "contractors"} on the roster. Add one in the Employees tab.
                    </div>
                  ) : (
                    <select
                      className="input"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">— pick from roster —</option>
                      {eligibleRoster.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}{r.role ? ` · ${r.role}` : ""} — {fmtMoney(r.monthlyCost, currency)}/mo
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedRosterEmp ? (
                    <div className="text-xs text-slate-400 mt-1">
                      Fully-loaded monthly cost: <span className="text-slate-200">{fmtMoney(selectedRosterEmp.monthlyCost, currency)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Salary-increase: specific scope — employee picker */}
              {def.type === "salary_increase" && form.raiseScope === "specific" ? (
                <div className="md:col-span-3">
                  <label className="label">Employee</label>
                  {raiseEmployees.length === 0 ? (
                    <div className="text-xs text-slate-400 px-3 py-2 rounded-md border border-line">
                      No active employees yet. Add one in the Employees tab.
                    </div>
                  ) : (
                    <select
                      className="input"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">— pick from roster —</option>
                      {raiseEmployees.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}{r.role ? ` · ${r.role}` : ""} — gross {fmtMoney(r.grossSalary, currency)}/mo
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedRaiseEmp ? (
                    <div className="text-xs text-slate-400 mt-1">
                      Current gross: <span className="text-slate-200">{fmtMoney(selectedRaiseEmp.grossSalary, currency)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Salary-increase: overall — global hint */}
              {def.type === "salary_increase" && form.raiseScope === "overall" ? (
                <div className="md:col-span-3">
                  <label className="label">Scope</label>
                  <div className="text-xs text-slate-400 px-3 py-2 rounded-md border border-line">
                    Applied across the active roster (~{fmtMoney(activePayrollSum, currency)}/mo total payroll baseline).
                  </div>
                </div>
              ) : null}

              {/* Label — only needed when there's no roster pick AND no overall scope */}
              {!def.pickFromRoster && def.type !== "salary_increase" ? (
                <div className="md:col-span-2">
                  <label className="label">Label</label>
                  <input
                    className="input"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Marketing manager, Acme contract"
                  />
                </div>
              ) : null}

              {/* Amount field — shown for all non-roster cards that include it */}
              {!def.pickFromRoster && def.fields.includes("amount") ? (
                <div>
                  <label className="label">
                    {def.type === "salary_increase" && form.raiseScope === "overall"
                      ? "Or flat amount ($/mo, all team)"
                      : def.type === "salary_increase"
                        ? "Or flat amount ($/mo)"
                        : "Amount"}
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder={def.amountHint ?? "Amount"}
                  />
                </div>
              ) : null}

              {/* Percent field */}
              {!def.pickFromRoster && def.fields.includes("percentage") ? (
                <div>
                  <label className="label">
                    {def.type === "salary_increase" ? "Percent raise" : "Percent"}
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={form.percentagePct}
                    onChange={(e) => setForm({ ...form, percentagePct: e.target.value })}
                    placeholder="e.g. 5"
                  />
                </div>
              ) : null}

              <div>
                <label className="label">Start month</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={maxMonthsAhead}
                  value={form.startMonth}
                  onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                />
              </div>
              {def.fields.includes("endMonth") ? (
                <div>
                  <label className="label">End month (optional)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={maxMonthsAhead}
                    value={form.endMonth}
                    onChange={(e) => setForm({ ...form, endMonth: e.target.value })}
                    placeholder="open-ended"
                  />
                </div>
              ) : null}
              {def.fields.includes("recurring") ? (
                <div>
                  <label className="label">Recurring</label>
                  <select
                    className="input"
                    value={form.isRecurring ? "yes" : "no"}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.value === "yes" })}
                  >
                    <option value="yes">Recurring</option>
                    <option value="no">One-time</option>
                  </select>
                </div>
              ) : null}
              <div className="md:col-span-6">
                <label className="label">Notes</label>
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional context"
                />
              </div>
              <div className="md:col-span-6 flex items-center gap-2">
                <button type="button" className="btn-primary" onClick={submit} disabled={pending}>Save assumption</button>
                <button type="button" className="btn-ghost" onClick={() => setOpenKey(null)} disabled={pending}>Cancel</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
