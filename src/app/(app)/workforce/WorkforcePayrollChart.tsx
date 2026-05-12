"use client";

// Payroll trend chart for /workforce. Two views:
//   "payroll"          — historical actuals + roster-projected payroll
//   "payroll_vs_rev"   — payroll & revenue side-by-side over the historical window

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { fmtMoney } from "@/lib/format";

type Point = {
  ym: string;
  label: string;
  historicalPayroll: number;
  forecastPayroll: number;
  revenue: number;
};

function fmtCompact(v: number): string {
  if (!isFinite(v)) return "—";
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function WorkforcePayrollChart({ data }: { data: Point[] }) {
  const [view, setView] = useState<"payroll" | "payroll_vs_rev">("payroll");

  const series = useMemo(() => {
    if (view === "payroll_vs_rev") {
      return data
        .filter((p) => p.historicalPayroll > 0 || p.revenue > 0)
        .map((p) => ({
          label: p.label,
          payroll: p.historicalPayroll,
          revenue: p.revenue,
        }));
    }
    return data.map((p) => ({
      label: p.label,
      actual: p.historicalPayroll || null,
      projected: p.forecastPayroll || null,
    }));
  }, [data, view]);

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="font-medium">Payroll trend</div>
          <div className="text-xs text-slate-400">
            {view === "payroll" ? "Historical actuals followed by roster-projected payroll" : "Payroll vs revenue across the historical window"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`text-xs px-3 py-1 rounded-md border transition ${
              view === "payroll"
                ? "bg-accent-soft border-accent text-accent"
                : "border-line text-slate-300 hover:bg-ink-700"
            }`}
            onClick={() => setView("payroll")}
          >
            Payroll
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1 rounded-md border transition ${
              view === "payroll_vs_rev"
                ? "bg-accent-soft border-accent text-accent"
                : "border-line text-slate-300 hover:bg-ink-700"
            }`}
            onClick={() => setView("payroll_vs_rev")}
          >
            Payroll vs revenue
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <ComposedChart data={series} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#272c3a" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => fmtCompact(v)} />
            <Tooltip formatter={(v: number) => fmtMoney(v)} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            {view === "payroll" ? (
              <>
                <Line type="monotone" dataKey="actual"    name="Historical" stroke="#5b8def" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="projected" name="Projected"  stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} />
              </>
            ) : (
              <>
                <Bar dataKey="revenue" name="Revenue" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payroll" name="Payroll" fill="#5b8def" radius={[4, 4, 0, 0]} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
