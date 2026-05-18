"use client";

// Interactive employee table for the Workforce Overview tab. Read-only —
// editing still lives on /employees; this view is the financial breakdown
// (gross + breakdown + total) with sort/filter/search.

import { useMemo, useState } from "react";

export type WorkforceEmployeeRow = {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  employmentType: string;
  status: string;
  gross: number;
  employerTaxes: number;
  pension: number;
  benefits: number;
  additionalCosts: number;
  totalMonthly: number;
  annualizedTotal: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

type SortKey =
  | "name" | "role" | "department" | "type" | "status"
  | "gross" | "total" | "startDate";

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

const STATUS_PILL: Record<string, string> = {
  active:     "pill-good",
  planned:    "pill-accent",
  terminated: "pill-warn",
};

export default function EmployeeTable({
  rows,
  currency,
}: {
  rows: WorkforceEmployeeRow[];
  currency: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.employmentType !== typeFilter) return false;
      if (q) {
        const hay = [r.name, r.role, r.department].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, typeFilter]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const va = pluck(a, sortKey);
      const vb = pluck(b, sortKey);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" || k === "role" || k === "department" || k === "type" || k === "status" ? "asc" : "desc"); }
  }

  function SortHead({ k, label, right }: { k: SortKey; label: string; right?: boolean }) {
    const active = sortKey === k;
    return (
      <th
        className={`cursor-pointer select-none ${right ? "text-right" : ""}`}
        onClick={() => toggleSort(k)}
      >
        <span className={active ? "text-slate-100" : ""}>{label}</span>
        <span className="text-slate-500 ml-1">{active ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
      </th>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="font-medium">Employees</div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="input w-56"
            placeholder="Search name, role, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="terminated">Terminated</option>
          </select>
          <select
            className="input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <SortHead k="name" label="Name" />
              <SortHead k="role" label="Role" />
              <SortHead k="department" label="Department" />
              <SortHead k="type" label="Type" />
              <SortHead k="status" label="Status" />
              <SortHead k="gross" label="Gross" right />
              <th className="text-right">Taxes</th>
              <th className="text-right">Pension</th>
              <th className="text-right">Benefits</th>
              <th className="text-right">Other</th>
              <SortHead k="total" label="Total / mo" right />
              <th className="text-right">Annualized</th>
              <SortHead k="startDate" label="Start" />
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={14} className="text-center text-slate-400 py-6">No employees match the filters.</td></tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-slate-300">{r.role ?? "—"}</td>
                  <td className="text-slate-300">{r.department ?? "—"}</td>
                  <td><span className="pill text-[10px] capitalize">{r.employmentType}</span></td>
                  <td><span className={`${STATUS_PILL[r.status] ?? "pill"} text-[10px] capitalize`}>{r.status}</span></td>
                  <td className="text-right">{fmtMoney(r.gross, currency)}</td>
                  <td className="text-right text-slate-300">{r.employerTaxes ? fmtMoney(r.employerTaxes, currency) : "—"}</td>
                  <td className="text-right text-slate-300">{r.pension ? fmtMoney(r.pension, currency) : "—"}</td>
                  <td className="text-right text-slate-300">{r.benefits ? fmtMoney(r.benefits, currency) : "—"}</td>
                  <td className="text-right text-slate-300">{r.additionalCosts ? fmtMoney(r.additionalCosts, currency) : "—"}</td>
                  <td className="text-right font-semibold">{fmtMoney(r.totalMonthly, currency)}</td>
                  <td className="text-right text-slate-400">{fmtMoney(r.annualizedTotal, currency)}</td>
                  <td className="text-slate-300">{r.startDate}</td>
                  <td className="text-slate-300">{r.endDate ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500 mt-3">
        Real monthly cost = gross + employer taxes + pension + benefits + additional costs.
        {" "}
        For employees without an explicit breakdown, the legacy employer-cost multiplier is rolled into the &quot;Taxes&quot; column.
      </div>
    </div>
  );
}

function pluck(r: WorkforceEmployeeRow, k: SortKey): string | number {
  switch (k) {
    case "name":       return r.name;
    case "role":       return r.role ?? "";
    case "department": return r.department ?? "";
    case "type":       return r.employmentType;
    case "status":     return r.status;
    case "gross":      return r.gross;
    case "total":      return r.totalMonthly;
    case "startDate":  return r.startDate;
  }
}
