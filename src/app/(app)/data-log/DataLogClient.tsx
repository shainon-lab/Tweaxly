"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// One unified row type spanning both upload-driven batches and manual
// single-entry rows. `kind` discriminates the two and tells the delete
// flow which endpoint to call.
type Row = {
  id: string;
  kind: "upload" | "manual";
  createdAt: string;
  source: string;
  mode: string;             // "transactions" | "monthly_summary" | "manual"
  label: string;            // upload: filename; manual: "Category · frequency"
  representsMonth: string | null;
  rowCount: number;
  transactions: number;
};

function typePill(row: Row) {
  if (row.kind === "manual") {
    return <span className="pill-accent">Manual entry</span>;
  }
  if (row.mode === "monthly_summary") {
    return <span className="pill-accent">Monthly summary</span>;
  }
  return <span className="pill">Financial activity</span>;
}

function sourcePill(row: Row) {
  if (row.source === "manual") {
    return <span className="pill-accent">Manual</span>;
  }
  return <span className="pill">{row.source}</span>;
}

export default function DataLogClient({
  rows: initial,
  currency,
}: {
  rows: Row[];
  currency: string;
}) {
  void currency;
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reallyDelete(row: Row) {
    setBusyId(row.id);
    try {
      // Upload batches go through /api/uploads; manual entries through
      // /api/manual-entries. The latter cascades to its materialized txns.
      const url =
        row.kind === "manual"
          ? `/api/manual-entries?id=${row.id}`
          : `/api/uploads?id=${row.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      const deletedTxns = data.deletedTransactions ?? row.transactions ?? 0;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setConfirming(null);
      startTransition(() => router.refresh());
      const noun = row.kind === "manual" ? "manual entry" : "upload";
      alert(
        `Removed ${noun} "${row.label}" and ${deletedTxns} transaction${deletedTxns === 1 ? "" : "s"}.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="card">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No data yet. Use the Import tab to upload a file or add a manual entry.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Added</th>
                <th>Type</th>
                <th>Source</th>
                <th>File / Entry</th>
                <th>Represents</th>
                <th className="text-right">Rows</th>
                <th className="text-right">Transactions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-slate-300">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td>{typePill(r)}</td>
                  <td>{sourcePill(r)}</td>
                  <td className="text-slate-200 truncate max-w-[280px]">
                    {r.label}
                  </td>
                  <td className="text-slate-300">{r.representsMonth ?? "—"}</td>
                  <td className="text-right text-slate-300">{r.rowCount}</td>
                  <td className="text-right text-slate-300">{r.transactions}</td>
                  <td className="text-right">
                    <button
                      className="btn-danger py-1"
                      disabled={busyId === r.id || pending}
                      onClick={() => setConfirming(r)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirming ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => (busyId ? null : setConfirming(null))}
        >
          <div
            className="card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold mb-2">
              This action will delete data — are you sure you want to proceed?
            </div>
            <div className="text-sm text-slate-400 mb-4">
              Removing this {confirming.kind === "manual" ? "manual entry" : "upload"} will permanently delete:
            </div>
            <ul className="text-sm text-slate-300 space-y-1 mb-4 border-l-2 border-bad/40 pl-3">
              <li>
                <span className="text-slate-400">
                  {confirming.kind === "manual" ? "Entry:" : "File:"}
                </span>{" "}
                <span className="font-medium">{confirming.label}</span>
              </li>
              <li>
                <span className="text-slate-400">Type:</span>{" "}
                {confirming.kind === "manual"
                  ? "Manual entry"
                  : confirming.mode === "monthly_summary"
                    ? "Monthly summary"
                    : "Financial activity"}
              </li>
              <li>
                <span className="text-slate-400">Represents:</span>{" "}
                {confirming.representsMonth ?? "—"}
              </li>
              <li>
                <span className="text-slate-400">Will delete:</span>{" "}
                <span className="text-bad font-medium">
                  {confirming.transactions} transaction
                  {confirming.transactions === 1 ? "" : "s"}
                </span>
              </li>
            </ul>
            <div className="text-xs text-slate-400 mb-4">
              This cannot be undone. The data will no longer feed into your
              dashboard, forecast, insights, or consultation.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn-ghost"
                disabled={busyId === confirming.id}
                onClick={() => setConfirming(null)}
              >
                No — keep the data
              </button>
              <button
                className="btn-danger"
                disabled={busyId === confirming.id}
                onClick={() => reallyDelete(confirming)}
              >
                {busyId === confirming.id ? "Removing…" : "Yes — remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
