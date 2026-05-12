"use client";

// Scenario builder + assumptions panel. The user clicks an event card to open
// a small form panel, fills in the fields relevant to that event type, and
// submits — the assumption is persisted server-side and the page re-renders
// with the scenario line updated.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssumption, deleteAssumption, clearAllAssumptions } from "./actions";

type AssumptionRow = {
  id: string;
  family: string;
  type: string;
  label: string;
  category: string | null;
  amount: number;
  percentage: number;
  startMonth: number;
  endMonth: number | null;
  isRecurring: boolean;
  notes: string | null;
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
  { key: "term",       family: "payroll", type: "terminate",             label: "Terminate employee",     icon: "−", fields: ["amount", "endMonth"],              amountHint: "Monthly salary saved", defaultRecurring: true },
  { key: "raise",      family: "payroll", type: "salary_increase",       label: "Salary increase",        icon: "↑", fields: ["amount", "endMonth"],              amountHint: "Monthly raise amount", defaultRecurring: true },
  { key: "bonus",      family: "payroll", type: "bonus",                 label: "One-time bonus",         icon: "★", fields: ["amount"],                          amountHint: "One-time bonus amount", defaultRecurring: false },
  { key: "contr-add",  family: "payroll", type: "contractor_add",        label: "Add contractor",         icon: "+", fields: ["amount", "endMonth"],              amountHint: "Monthly cost", defaultRecurring: true },
  { key: "contr-rem",  family: "payroll", type: "contractor_remove",     label: "Remove contractor",      icon: "−", fields: ["amount", "endMonth"],              amountHint: "Monthly cost removed", defaultRecurring: true },
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
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default function ScenarioBuilder({
  assumptions,
  maxMonthsAhead,
  currency,
}: {
  assumptions: AssumptionRow[];
  maxMonthsAhead: number;
  currency: string;
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
  }>({
    label: "", amount: "", percentagePct: "", startMonth: "1", endMonth: "",
    isRecurring: true, notes: "",
  });

  const def = openKey ? EVENTS.find((e) => e.key === openKey) ?? null : null;

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
    });
  }

  async function submit() {
    if (!def) return;
    if (!form.label.trim()) { alert("Please add a short label."); return; }
    const amt = Number(form.amount || 0);
    const pct = Number(form.percentagePct || 0) / 100;
    // For "Reduce marketing" / "Remove cost" we want the amount to be applied
    // as a negative (cost reduction). The engine handles signs per type, but
    // we normalize the input here: the user types a positive number and we
    // flip when the event is a "down/reduce/remove" semantically.
    const isReductionUI = ["mkt-down"].includes(def.key);
    const signedAmount = isReductionUI ? -Math.abs(amt) : amt;

    const startMonth = Math.max(1, Math.min(maxMonthsAhead, Number(form.startMonth || 1)));
    const endMonth = form.endMonth.trim() === ""
      ? null
      : Math.max(startMonth, Math.min(maxMonthsAhead, Number(form.endMonth)));

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
    } catch (e) {
      alert(`Failed to save: ${(e as Error).message}`);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this assumption?")) return;
    await deleteAssumption(id);
    startTransition(() => router.refresh());
  }

  async function clearAll() {
    if (!confirm("Remove all scenario assumptions?")) return;
    await clearAllAssumptions();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div id="scenario-builder" className="card mb-4 scroll-mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Scenario builder</div>
          <div className="text-xs text-slate-400">Click an event to model a business decision</div>
        </div>
        {EVENT_GROUPS.map((g) => (
          <div key={g.title} className="mb-4 last:mb-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">{g.title}</div>
            <div className="flex flex-wrap gap-2">
              {g.keys.map((k) => {
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
        ))}

        {def ? (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="font-medium mb-3">{def.label}</div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="label">Label</label>
                <input
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Marketing manager, Acme contract"
                />
              </div>
              {def.fields.includes("amount") ? (
                <div>
                  <label className="label">Amount</label>
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
              {def.fields.includes("percentage") ? (
                <div>
                  <label className="label">Percent</label>
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

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Scenario assumptions</div>
          {assumptions.length > 0 ? (
            <button type="button" className="btn-ghost text-xs" onClick={clearAll} disabled={pending}>Clear all</button>
          ) : null}
        </div>
        {assumptions.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">
            No assumptions yet. Click an event above to start modeling decisions.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Family</th>
                <th>Event</th>
                <th>Label</th>
                <th className="text-right">Amount</th>
                <th className="text-right">%</th>
                <th>Months</th>
                <th>Cadence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map((a) => (
                <tr key={a.id}>
                  <td><span className="pill">{a.family}</span></td>
                  <td className="text-slate-300">{prettyType(a.type)}</td>
                  <td className="font-medium">{a.label}</td>
                  <td className={`text-right ${a.amount >= 0 ? "text-slate-200" : "text-good"}`}>
                    {a.amount === 0 ? "—" : fmtMoney(a.amount, currency)}
                  </td>
                  <td className="text-right text-slate-300">
                    {a.percentage === 0 ? "—" : `${(a.percentage * 100).toFixed(1)}%`}
                  </td>
                  <td className="text-slate-300">
                    M{a.startMonth}{a.endMonth ? ` → M${a.endMonth}` : "+"}
                  </td>
                  <td>{a.isRecurring ? <span className="pill-good">recurring</span> : <span className="pill-warn">one-time</span>}</td>
                  <td className="text-right">
                    <button className="btn-danger py-1" disabled={pending} onClick={() => remove(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function prettyType(t: string): string {
  return t.replace(/_/g, " ");
}
