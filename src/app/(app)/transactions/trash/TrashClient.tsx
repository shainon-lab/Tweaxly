"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

type Sample = {
  id:              string;
  transactionDate: string;
  amount:          number;
  currency:        string;
  description:     string;
  vendor:          string | null;
};

type Batch = {
  id:               string;
  createdAt:        string;
  daysUntilExpiry:  number;
  reason:           string | null;
  transactionCount: number;
  sample:           Sample[];
};

export default function TrashClient({
  batches: initial,
  retentionDays,
  currency,
}: {
  batches: Batch[];
  retentionDays: number;
  currency: string;
}) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function restore(b: Batch) {
    if (!(await notify.confirm({ title: "Restore transactions?", body: `Restore ${b.transactionCount} transaction${b.transactionCount === 1 ? "" : "s"} from this batch?`, confirmLabel: "Restore" }))) return;
    setBusy(b.id);
    try {
      const res = await fetch(`/api/transactions/trash/${b.id}`, { method: "POST" });
      if (!res.ok) { notify.alert(await res.text()); return; }
      setBatches((prev) => prev.filter((x) => x.id !== b.id));
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function purgeNow(b: Batch) {
    if (!(await notify.confirm({ title: "Permanently delete?", body: `Permanently delete ${b.transactionCount} transaction${b.transactionCount === 1 ? "" : "s"} now? This cannot be undone.`, confirmLabel: "Delete permanently", danger: true }))) return;
    setBusy(b.id);
    try {
      const res = await fetch(`/api/transactions/trash/${b.id}`, { method: "DELETE" });
      if (!res.ok) { notify.alert(await res.text()); return; }
      setBatches((prev) => prev.filter((x) => x.id !== b.id));
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Link href="/transactions" className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to Transactions
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="card text-sm text-slate-400 py-10 text-center">
          Trash is empty. Anything you move to trash from Transactions will appear here for {retentionDays} days.
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => {
            const expiryTone =
              b.daysUntilExpiry <= 3 ? "text-bad"
              : b.daysUntilExpiry <= 7 ? "text-warn"
              : "text-slate-400";
            return (
              <div key={b.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      {b.transactionCount} transaction{b.transactionCount === 1 ? "" : "s"}
                      {b.reason ? <span className="text-slate-400 font-normal"> · {b.reason}</span> : null}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Trashed {new Date(b.createdAt).toLocaleString()}
                      {" · "}
                      <span className={expiryTone}>
                        {b.daysUntilExpiry === 0
                          ? "expires today"
                          : b.daysUntilExpiry === 1
                            ? "1 day until permanent deletion"
                            : `${b.daysUntilExpiry} days until permanent deletion`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => restore(b)}
                      disabled={busy === b.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-accent/40 text-accent hover:bg-accent-soft/30 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => purgeNow(b)}
                      disabled={busy === b.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-bad/40 text-bad hover:bg-bad/10 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Delete now
                    </button>
                  </div>
                </div>
                {b.sample.length > 0 ? (
                  <div className="rounded-md border border-line/60 bg-ink-900/40 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                        <tr className="border-b border-line/60">
                          <th className="text-left px-3 py-1.5">Date</th>
                          <th className="text-left px-3 py-1.5">Description / Vendor</th>
                          <th className="text-right px-3 py-1.5">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        {b.sample.map((s) => (
                          <tr key={s.id}>
                            <td className="px-3 py-1 text-slate-400">{s.transactionDate.slice(0, 10)}</td>
                            <td className="px-3 py-1 text-slate-300 truncate max-w-[400px]">
                              {s.vendor ?? s.description ?? " - "}
                            </td>
                            <td className="px-3 py-1 text-right text-slate-300 font-mono">
                              {s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {s.currency || currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {b.transactionCount > b.sample.length ? (
                      <div className="px-3 py-1.5 text-[11px] text-slate-500 border-t border-line/60">
                        + {b.transactionCount - b.sample.length} more in this batch
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
