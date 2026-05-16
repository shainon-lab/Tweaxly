"use client";

// Sits high on the Forecast page (right under the setup card) so the user
// can see which scenario assumptions are currently feeding the projection
// at a glance. Empty state hides the card so a clean page stays clean.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAssumption, clearAllAssumptions } from "./actions";

type AssumptionRow = {
  id: string;
  family: string;
  type: string;
  label: string;
  amount: number;
  percentage: number;
  startMonth: number;
  endMonth: number | null;
  isRecurring: boolean;
};

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

function prettyType(t: string): string {
  return t.replace(/_/g, " ");
}

export default function ActiveScenarioAssumptions({
  assumptions,
  currency,
}: {
  assumptions: AssumptionRow[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (assumptions.length === 0) return null;

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
    <div className="card mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="font-medium">Active scenario assumptions</div>
          <div className="text-xs text-slate-400">
            {assumptions.length} feeding the scenario line below
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost text-xs" onClick={clearAll} disabled={pending}>
            Clear all
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}
