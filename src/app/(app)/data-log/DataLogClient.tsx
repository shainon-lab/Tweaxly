"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Batch = {
  id: string;
  createdAt: string;
  source: string;
  mode: string;
  filename: string;
  rowCount: number;
  representsMonth: string | null;
  transactions: number;
};

export default function DataLogClient({
  batches: initial,
  currency,
}: {
  batches: Batch[];
  currency: string;
}) {
  void currency;
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>(initial);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Batch | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reallyDelete(batch: Batch) {
    setBusyId(batch.id);
    try {
      const res = await fetch(`/api/uploads?id=${batch.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      setConfirming(null);
      startTransition(() => router.refresh());
      alert(
        `Removed upload "${batch.filename}" and ${data.deletedTransactions} transaction${data.deletedTransactions === 1 ? "" : "s"}.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="card">
        {batches.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No uploads yet. Use the Upload tab to add data.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Uploaded</th>
                <th>Type</th>
                <th>Source</th>
                <th>File</th>
                <th>Represents</th>
                <th className="text-right">Rows</th>
                <th className="text-right">Transactions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="text-slate-300">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={
                        b.mode === "monthly_summary" ? "pill-accent" : "pill"
                      }
                    >
                      {b.mode === "monthly_summary"
                        ? "Monthly summary"
                        : "Financial activity"}
                    </span>
                  </td>
                  <td>
                    <span className="pill">{b.source}</span>
                  </td>
                  <td className="text-slate-200 truncate max-w-[280px]">
                    {b.filename}
                  </td>
                  <td className="text-slate-300">
                    {b.representsMonth ?? "—"}
                  </td>
                  <td className="text-right text-slate-300">{b.rowCount}</td>
                  <td className="text-right text-slate-300">
                    {b.transactions}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn-danger py-1"
                      disabled={busyId === b.id || pending}
                      onClick={() => setConfirming(b)}
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
              Removing this upload will permanently delete:
            </div>
            <ul className="text-sm text-slate-300 space-y-1 mb-4 border-l-2 border-bad/40 pl-3">
              <li>
                <span className="text-slate-400">File:</span>{" "}
                <span className="font-medium">{confirming.filename}</span>
              </li>
              <li>
                <span className="text-slate-400">Type:</span>{" "}
                {confirming.mode === "monthly_summary"
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
