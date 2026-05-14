"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Txn = {
  id: string;
  transactionDate: string;
  accountingMonth: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  vendor: string | null;
  description: string;
  isRecurring: boolean;
  isOneTime: boolean;
  isExcludedFromPnl: boolean;
  excludeNote: string | null;
  isDuplicateCandidate: boolean;
  categoryId: string | null;
  categoryName: string;
};

type IgnoreTarget =
  | { kind: "single"; txn: Txn }
  | { kind: "bulk"; ids: string[] };

type Category = { id: string; name: string; kind: string };

export default function TransactionsClient({
  txns,
  categories,
  months,
  sources,
  currency,
  filters,
}: {
  txns: Txn[];
  categories: Category[];
  months: string[];
  sources: string[];
  currency: string;
  filters: { q: string; source: string; ym: string; uncategorized: boolean };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [q, setQ] = useState(filters.q);
  const [src, setSrc] = useState(filters.source);
  const [ym, setYm] = useState(filters.ym);
  const [unc, setUnc] = useState(filters.uncategorized);
  const [ignoreTarget, setIgnoreTarget] = useState<IgnoreTarget | null>(null);
  const [ignoreNote, setIgnoreNote] = useState<string>("");
  const [ignoreSaving, setIgnoreSaving] = useState(false);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [currency]
  );

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === txns.length) setSelected(new Set());
    else setSelected(new Set(txns.map((t) => t.id)));
  }

  function applyFilters() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (src) sp.set("source", src);
    if (ym) sp.set("ym", ym);
    if (unc) sp.set("uncategorized", "1");
    router.push("/transactions" + (sp.toString() ? "?" + sp.toString() : ""));
  }

  async function bulk(action: string, payload: Record<string, unknown> = {}) {
    if (selected.size === 0) return;
    const res = await fetch("/api/transactions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action, ...payload }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setSelected(new Set());
    setBulkCategory("");
    startTransition(() => router.refresh());
  }

  async function updateOne(id: string, patch: Partial<Txn>) {
    const res = await fetch("/api/transactions/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    startTransition(() => router.refresh());
  }

  function openIgnoreSingle(txn: Txn) {
    setIgnoreTarget({ kind: "single", txn });
    setIgnoreNote(txn.excludeNote ?? "");
  }
  function openIgnoreBulk() {
    if (selected.size === 0) return;
    setIgnoreTarget({ kind: "bulk", ids: Array.from(selected) });
    setIgnoreNote("");
  }
  function closeIgnoreModal() {
    if (ignoreSaving) return;
    setIgnoreTarget(null);
    setIgnoreNote("");
  }
  async function saveIgnore() {
    if (!ignoreTarget) return;
    const note = ignoreNote.trim();
    setIgnoreSaving(true);
    try {
      if (ignoreTarget.kind === "single") {
        await updateOne(ignoreTarget.txn.id, {
          isExcludedFromPnl: true,
          excludeNote: note.length > 0 ? note : null,
        } as never);
      } else {
        const res = await fetch("/api/transactions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: ignoreTarget.ids,
            action: "markIgnore",
            value: true,
            note: note.length > 0 ? note : undefined,
          }),
        });
        if (!res.ok) { alert(await res.text()); return; }
        setSelected(new Set());
        startTransition(() => router.refresh());
      }
      setIgnoreTarget(null);
      setIgnoreNote("");
    } finally {
      setIgnoreSaving(false);
    }
  }
  async function unIgnoreOne(t: Txn) {
    await updateOne(t.id, {
      isExcludedFromPnl: false,
      excludeNote: null,
    } as never);
  }

  async function dismissDup(t: Txn) {
    const res = await fetch("/api/transactions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [t.id], action: "dismissDup" }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="label">Search description / vendor</label>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Stripe, Google" />
          </div>
          <div>
            <label className="label">Source</label>
            <select className="input" value={src} onChange={(e) => setSrc(e.target.value)}>
              <option value="">Any</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Accounting month</label>
            <select className="input" value={ym} onChange={(e) => setYm(e.target.value)}>
              <option value="">Any</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <input type="checkbox" checked={unc} onChange={(e) => setUnc(e.target.checked)} />
              Uncategorized
            </label>
            <button className="btn-primary mb-0" onClick={applyFilters}>Apply</button>
          </div>
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="card-tight mb-3 flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-300">{selected.size} selected</div>
          <select className="input max-w-[260px]" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
            <option value="">Set category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.kind})</option>)}
          </select>
          <button className="btn-ghost" disabled={!bulkCategory || pending} onClick={() => bulk("setCategory", { categoryId: bulkCategory })}>Apply category</button>
          <button className="btn-ghost" disabled={pending} onClick={() => bulk("toggleOneTime", { value: true })}>Mark one-time</button>
          <button className="btn-ghost" disabled={pending} onClick={() => bulk("toggleRecurring", { value: true })}>Mark recurring</button>
          <button className="btn-ghost" disabled={pending} onClick={openIgnoreBulk}>Mark as ignore</button>
          <button className="btn-ghost" disabled={pending} onClick={() => bulk("markIgnore", { value: false })}>Unignore (re-include)</button>
        </div>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[1200px]">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" checked={selected.size === txns.length && txns.length > 0} onChange={toggleAll} /></th>
              <th>Date</th>
              <th>Acct. month</th>
              <th>Source</th>
              <th>Description / Vendor</th>
              <th className="text-right">Amount</th>
              <th>Category</th>
              <th>Flags</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => {
              const sign = t.amount >= 0;
              const ignored = t.isExcludedFromPnl;
              const rowTone = selected.has(t.id)
                ? "bg-accent-soft/40"
                : ignored
                  ? "opacity-60"
                  : "";
              const textTone = ignored ? "text-slate-500" : "";
              return (
                <tr key={t.id} className={rowTone}>
                  <td>
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                  </td>
                  <td className={`whitespace-nowrap text-slate-300 ${textTone}`}>{t.transactionDate.slice(0, 10)}</td>
                  <td className="whitespace-nowrap">
                    <input
                      className="input max-w-[100px] py-1"
                      defaultValue={t.accountingMonth}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== t.accountingMonth && /^\d{4}-\d{2}$/.test(v)) {
                          updateOne(t.id, { accountingMonth: v });
                        }
                      }}
                    />
                  </td>
                  <td>
                    {t.source === "manual" ? (
                      <span className="pill-accent" title="Added via manual entry">Manual</span>
                    ) : (
                      <span className="pill">{t.source}</span>
                    )}
                  </td>
                  <td className="max-w-[360px]">
                    <div className="flex items-start gap-2">
                      {t.isDuplicateCandidate ? (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 mt-0.5 shrink-0 rounded-full bg-bad text-white text-[11px] font-bold leading-none"
                          title="Possible duplicate — review the matching transaction; ignore one of them or dismiss the alert."
                          aria-label="Possible duplicate"
                        >
                          !
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <div className={`truncate ${ignored ? "line-through text-slate-500" : "text-slate-100"}`} title={t.description}>
                          {t.description || "—"}
                        </div>
                        {t.vendor ? <div className={`text-xs truncate ${ignored ? "text-slate-600" : "text-slate-400"}`}>{t.vendor}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className={`text-right font-medium whitespace-nowrap ${ignored ? "line-through text-slate-500" : sign ? "text-good" : "text-bad"}`}>
                    {sign ? "+" : "−"}{fmt.format(Math.abs(t.amount))}
                  </td>
                  <td>
                    <select
                      className="input max-w-[200px] py-1"
                      value={t.categoryId ?? ""}
                      onChange={(e) => updateOne(t.id, { categoryId: e.target.value || null } as never)}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="space-x-1 whitespace-nowrap">
                    {t.isOneTime ? <span className="pill-warn">one-time</span> : null}
                    {t.isRecurring ? <span className="pill-accent">recurring</span> : null}
                    {t.isDuplicateCandidate ? (
                      <button
                        type="button"
                        className="pill-bad cursor-pointer hover:opacity-80"
                        title="Click to dismiss the duplicate alert (e.g. these are two real charges)"
                        onClick={() => dismissDup(t)}
                      >
                        possible duplicate · dismiss
                      </button>
                    ) : null}
                    {ignored ? (
                      <button
                        type="button"
                        className="pill cursor-pointer hover:border-accent/60"
                        title={t.excludeNote ? t.excludeNote : "Click to add a reason"}
                        onClick={() => openIgnoreSingle(t)}
                      >
                        not calculated{t.excludeNote ? " ⓘ" : ""}
                      </button>
                    ) : null}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {ignored ? (
                      <button
                        className="btn-ghost py-1"
                        disabled={pending}
                        onClick={() => unIgnoreOne(t)}
                        title="Re-include this transaction in P&L calculations"
                      >
                        Re-include
                      </button>
                    ) : (
                      <button
                        className="btn-ghost py-1"
                        disabled={pending}
                        onClick={() => openIgnoreSingle(t)}
                        title="Mark this transaction as not relevant to the business"
                      >
                        Ignore
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {txns.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-400">No transactions match these filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {ignoreTarget ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={closeIgnoreModal}
        >
          <div
            className="card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold mb-2">
              {ignoreTarget.kind === "single"
                ? ignoreTarget.txn.isExcludedFromPnl
                  ? "Edit reason for ignoring"
                  : "Mark as not calculated"
                : `Mark ${ignoreTarget.ids.length} transaction${ignoreTarget.ids.length === 1 ? "" : "s"} as not calculated`}
            </div>
            <div className="text-sm text-slate-400 mb-3">
              {ignoreTarget.kind === "single"
                ? "This transaction will be grayed out and excluded from your dashboard, forecast, insights, and consultation. Add a short reason — it'll show on hover."
                : "These will be excluded from all P&L calculations. Add a single reason that applies to all of them."}
            </div>
            {ignoreTarget.kind === "single" ? (
              <div className="text-xs text-slate-500 mb-3 border-l-2 border-line pl-3">
                <div className="text-slate-300 truncate">{ignoreTarget.txn.description || "—"}</div>
                <div>{ignoreTarget.txn.transactionDate.slice(0, 10)} · {ignoreTarget.txn.source} · {ignoreTarget.txn.amount >= 0 ? "+" : "−"}{fmt.format(Math.abs(ignoreTarget.txn.amount))}</div>
              </div>
            ) : null}
            <label className="label">Reason (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={ignoreNote}
              onChange={(e) => setIgnoreNote(e.target.value)}
              placeholder='e.g. "Personal — bought a TV for home" or "Birthday gift, not business income"'
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="btn-ghost"
                disabled={ignoreSaving}
                onClick={closeIgnoreModal}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={ignoreSaving}
                onClick={saveIgnore}
              >
                {ignoreSaving ? "Saving…" : "Mark as not calculated"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
