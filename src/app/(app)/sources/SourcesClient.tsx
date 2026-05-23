"use client";

// Financial Sources management.
//
// Two stacked sections:
//   1. Sources list  — add / edit / archive accounts (bank, card, etc.)
//   2. Coverage matrix — sources × months grid, ✅ where data exists,
//      ❌ where the month is missing, ─ where the month is before the
//      source's startMonth (so we don't pester for data we never wanted).
//
// All actions are workspace-scoped via session — no cross-workspace UI.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Archive, AlertTriangle } from "lucide-react";
import CurrencyPicker from "@/components/CurrencyPicker";
import HealthScoreWidget from "@/components/sources/HealthScoreWidget";
import MonthlyChecklist from "@/components/sources/MonthlyChecklist";

type SourceType = "bank" | "credit_card" | "paypal" | "payment_provider" | "cash" | "other";

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "bank",             label: "Bank account" },
  { value: "credit_card",      label: "Credit card" },
  { value: "paypal",           label: "PayPal" },
  { value: "payment_provider", label: "Payment provider (Stripe, Square, Wise…)" },
  { value: "cash",             label: "Cash" },
  { value: "other",            label: "Other" },
];

type Source = {
  id:           string;
  name:         string;
  type:         SourceType;
  currency:     string;
  last4:        string | null;
  startMonth:   string;
  status:       string;
  batchCount:   number;
  lastImportAt: string | null;
  lastImportPeriod: string | null;
};

type Coverage = {
  months: string[];
  sources: {
    id: string;
    name: string;
    type: SourceType;
    currency: string;
    last4: string | null;
    startMonth: string;
    cells: { ym: string; status: "uploaded" | "missing" | "out_of_window"; batches?: number; filenames?: string[] }[];
  }[];
};

export default function SourcesClient({ currency }: { currency: string }) {
  const router = useRouter();
  const [sources, setSources]   = useState<Source[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Source | "new" | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      fetch("/api/financial-sources").then((r) => r.json()).catch(() => ({ sources: [] })),
      fetch("/api/financial-sources/coverage").then((r) => r.json()).catch(() => ({ months: [], sources: [] })),
    ]);
    setSources(s.sources ?? []);
    setCoverage(c);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function archive(id: string) {
    if (!confirm("Archive this source? Its upload history stays in the audit log, but it won't appear in the import picker.")) return;
    const res = await fetch(`/api/financial-sources/${id}`, { method: "DELETE" });
    if (!res.ok) { alert(await res.text()); return; }
    await refresh();
    router.refresh();
  }

  return (
    <>
      <HealthScoreWidget variant="full" />
      <MonthlyChecklist />
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="font-medium">Your sources</div>
            <div className="text-xs text-slate-400">
              Add a source for every place money moves through your business. Each upload belongs to one source.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="btn-primary text-sm inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add source
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-6 text-center">Loading…</div>
        ) : sources.length === 0 ? (
          <div className="text-sm text-slate-400 py-8 text-center">
            No sources yet. Add your first bank account, credit card, or payment provider above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-line/60">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Currency</th>
                <th className="text-left py-2">First month</th>
                <th className="text-left py-2">Imports</th>
                <th className="text-left py-2">Last import</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 text-slate-100 font-medium">
                    {s.name}
                    {s.last4 ? <span className="text-slate-500 ml-2 font-mono text-xs">·{s.last4}</span> : null}
                  </td>
                  <td className="py-2 text-slate-300 text-xs">{labelForType(s.type)}</td>
                  <td className="py-2 text-slate-300 font-mono text-xs">{s.currency}</td>
                  <td className="py-2 text-slate-300 text-xs">{s.startMonth}</td>
                  <td className="py-2 text-slate-300">{s.batchCount}</td>
                  <td className="py-2 text-slate-400 text-xs">
                    {s.lastImportAt
                      ? `${new Date(s.lastImportAt).toLocaleDateString()}${s.lastImportPeriod ? ` · ${s.lastImportPeriod}` : ""}`
                      : "—"}
                  </td>
                  <td className="py-2 text-right space-x-1">
                    <button type="button" onClick={() => setEditing(s)} className="btn-ghost text-xs p-1.5" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => archive(s.id)} className="btn-ghost text-xs p-1.5" title="Archive">
                      <Archive size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Coverage matrix */}
      <div className="card mb-6">
        <div className="font-medium mb-1">Monthly coverage</div>
        <div className="text-xs text-slate-400 mb-4">
          Which months have data for each source. Green = uploaded; orange = missing; grey = before this source started.
        </div>
        {coverage && coverage.sources.length > 0 ? (
          <CoverageMatrix coverage={coverage} />
        ) : (
          <div className="text-sm text-slate-500 py-6 text-center">
            Coverage appears here once you add a source and upload your first file.
          </div>
        )}
      </div>

      {editing ? (
        <SourceFormModal
          initial={editing === "new" ? null : editing}
          defaultCurrency={currency}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh(); router.refresh(); }}
        />
      ) : null}
    </>
  );
}

function labelForType(t: SourceType): string {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

// ─── Coverage matrix ──────────────────────────────────────────────────
// Renders one row per source and one column per month. Cells are
// compact — hover tooltip shows the underlying filename(s).
function CoverageMatrix({ coverage }: { coverage: Coverage }) {
  const months = coverage.months;
  // Reverse so the most recent month is on the left (closer to what
  // owners care about). The startMonth filter happens server-side.
  const monthsReversed = useMemo(() => [...months].reverse(), [months]);
  return (
    <div className="overflow-x-auto -mx-3">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-ink-900/60 text-left px-3 py-2 text-slate-500 uppercase tracking-wider text-[10px] z-10 min-w-[180px]">
              Source
            </th>
            {monthsReversed.map((ym) => (
              <th key={ym} className="px-2 py-2 text-slate-500 text-[10px] font-medium whitespace-nowrap">
                {fmtYm(ym)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {coverage.sources.map((s) => {
            const cellByYm = new Map(s.cells.map((c) => [c.ym, c]));
            return (
              <tr key={s.id} className="border-t border-line/40">
                <td className="sticky left-0 bg-ink-900/60 px-3 py-2 text-slate-200 min-w-[180px] z-10">
                  {s.name}
                  <div className="text-[10px] text-slate-500 font-mono">{s.currency}{s.last4 ? ` ·${s.last4}` : ""}</div>
                </td>
                {monthsReversed.map((ym) => {
                  const cell = cellByYm.get(ym);
                  return <CoverageCell key={ym} cell={cell} ym={ym} />;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CoverageCell({ cell, ym }: { cell: Coverage["sources"][number]["cells"][number] | undefined; ym: string }) {
  if (!cell || cell.status === "out_of_window") {
    return <td className="px-2 py-2 text-center"><span className="text-slate-700">–</span></td>;
  }
  if (cell.status === "missing") {
    return (
      <td className="px-2 py-2 text-center" title={`${fmtYm(ym)} — missing`}>
        <span className="inline-block w-5 h-5 rounded bg-warn/15 border border-warn/30 text-warn text-[10px] leading-5 font-semibold">×</span>
      </td>
    );
  }
  const title = `${fmtYm(ym)} — ${cell.batches} import${(cell.batches ?? 0) === 1 ? "" : "s"}${cell.filenames && cell.filenames.length > 0 ? `\n${cell.filenames.join("\n")}` : ""}`;
  return (
    <td className="px-2 py-2 text-center" title={title}>
      <span className="inline-block w-5 h-5 rounded bg-good/15 border border-good/30 text-good text-[10px] leading-5 font-semibold">✓</span>
    </td>
  );
}

function fmtYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

// ─── Add / Edit source modal ──────────────────────────────────────────
function SourceFormModal({
  initial, defaultCurrency, onClose, onSaved,
}: {
  initial: Source | null;
  defaultCurrency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName]         = useState(initial?.name ?? "");
  const [type, setType]         = useState<SourceType>(initial?.type ?? "bank");
  const [ccy, setCcy]           = useState<string>(initial?.currency ?? defaultCurrency);
  const [last4, setLast4]       = useState<string>(initial?.last4 ?? "");
  const [startMonth, setStart]  = useState<string>(initial?.startMonth ?? defaultStartMonth());
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), type, currency: ccy, last4: last4.trim() || null, startMonth };
      const url = isEdit ? `/api/financial-sources/${initial!.id}` : "/api/financial-sources";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).error ?? msg; } catch { /* keep raw */ }
        setError(msg || `Save failed (${res.status})`);
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="card w-full max-w-md">
        <div className="text-lg font-semibold text-slate-100 mb-1">
          {isEdit ? "Edit source" : "Add source"}
        </div>
        <div className="text-sm text-slate-400 mb-4">
          {isEdit
            ? "Update the source details. Existing imports stay tied to this source."
            : "Add a bank account, credit card, or payment provider."}
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Business Bank ILS"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as SourceType)} disabled={isEdit}>
                {SOURCE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Currency</label>
              {isEdit ? (
                <input className="input" value={ccy} disabled />
              ) : (
                <CurrencyPicker value={ccy} onChange={setCcy} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Last 4 digits <span className="text-slate-500">(optional)</span></label>
              <input
                className="input"
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="label">First relevant month</label>
              <input
                className="input"
                type="month"
                value={startMonth}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
          </div>
          {isEdit ? (
            <div className="text-xs text-slate-500 inline-flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 text-warn" />
              Type and currency can't be changed once a source is created — they're load-bearing for currency conversion.
            </div>
          ) : null}
          {error ? <div className="text-sm text-bad">{error}</div> : null}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-ghost text-sm" disabled={saving}>Cancel</button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save" : "Add source"}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultStartMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
