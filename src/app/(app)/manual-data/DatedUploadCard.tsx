"use client";

// Dated transactions upload card. The companion to BulkUploadCard:
// where Bulk asks the user to pick a month for the whole file, this one
// expects each row to carry its own date and routes each transaction to
// the month that date falls in.
//
// Flow:
//   1. User downloads the Tweaxly CSV template (GET /api/upload/template)
//      OR drops their own bank export with the canonical columns.
//   2. File is parsed via /api/upload/preview (existing XLSX/CSV parser).
//   3. We run the canonical Tweaxly schema validation client-side and
//      render a preview table with per-row status (valid / warning /
//      error) and summary cards.
//   4. On commit, expense rows get a negative sign, and we POST to
//      /api/upload/commit WITHOUT forceAccountingMonth - the existing
//      pipeline derives accountingMonth from each row's date column.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

type Preview = {
  headers: string[];
  rows: Record<string, unknown>[];
  filename: string;
  guess: Record<string, string | null>;
};

type RowStatus = "valid" | "warning" | "error";

type ValidatedRow = {
  index: number;
  date: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  notes: string;
  status: RowStatus;
  issues: string[];
};

// Map common header variations to the canonical Tweaxly columns. The
// user might download our template (exact column names) or hand us a
// bank export - we try a small set of synonyms so the second case
// works without forcing them to rename headers.
const HEADER_ALIASES: Record<string, string[]> = {
  date:        ["date", "transaction date", "txn date", "posted date", "value date"],
  type:        ["type", "direction", "in/out", "income/expense"],
  amount:      ["amount", "value", "total", "sum"],
  currency:    ["currency", "ccy"],
  category:    ["category", "cat", "bucket"],
  description: ["description", "desc", "memo", "details", "narration", "payee"],
  notes:       ["notes", "note", "comments", "comment", "remark", "remarks"],
};

function resolveColumns(headers: string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  const lc = headers.map((h) => ({ raw: h, lc: h.trim().toLowerCase() }));
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    const match = lc.find((h) => aliases.includes(h.lc));
    out[canonical] = match ? match.raw : null;
  }
  return out;
}

function parseAmount(raw: unknown): number {
  if (raw == null) return NaN;
  if (typeof raw === "number") return raw;
  let s = String(raw).trim();
  if (!s) return NaN;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/^-/.test(s)) { sign = -1; s = s.slice(1); }
  s = s.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",") && !s.includes(".")) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) s = parts.join(".");
    else s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? sign * n : NaN;
}

function parseDateStr(raw: unknown): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Accept ISO YYYY-MM-DD directly.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // SheetJS may emit Excel-serial strings or numbers for dates - we already
  // get formatted strings by default, but be defensive.
  // Try Date.parse for everything else (handles slashes, dots, etc.).
  s = s.replace(/\./g, "/");
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  return null;
}

function normalizeType(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "income" || s === "in" || s === "credit") return "income";
  if (s === "expense" || s === "out" || s === "debit" || s === "outcome") return "expense";
  return "";
}

function validateRow(
  raw: Record<string, unknown>,
  cols: Record<string, string | null>,
  index: number,
  defaultCurrency: string,
): ValidatedRow {
  const issues: string[] = [];
  const dateStr = parseDateStr(cols.date ? raw[cols.date] : null);
  if (!dateStr) issues.push("Missing or invalid date");

  const typeStr = normalizeType(cols.type ? raw[cols.type] : null);
  if (!typeStr) issues.push('Type must be "income" or "expense"');

  const amountVal = parseAmount(cols.amount ? raw[cols.amount] : null);
  if (!Number.isFinite(amountVal) || amountVal === 0) {
    issues.push("Amount must be a non-zero number");
  }

  const currencyStr = String((cols.currency ? raw[cols.currency] : "") ?? "")
    .trim()
    .toUpperCase();
  const finalCurrency = currencyStr || defaultCurrency;
  if (!currencyStr) {
    issues.push(`Currency missing - using ${defaultCurrency}`);
  }

  const category = String((cols.category ? raw[cols.category] : "") ?? "").trim();
  const description = String((cols.description ? raw[cols.description] : "") ?? "").trim();
  const notes = String((cols.notes ? raw[cols.notes] : "") ?? "").trim();

  // Errors (block commit) vs warnings (allow).
  const hasError =
    !dateStr ||
    !typeStr ||
    !Number.isFinite(amountVal) ||
    amountVal === 0;
  const hasWarning = !category || !currencyStr;
  const status: RowStatus = hasError ? "error" : hasWarning ? "warning" : "valid";

  return {
    index,
    date: dateStr ?? String(raw[cols.date ?? ""] ?? ""),
    type: typeStr,
    amount: Number.isFinite(amountVal) ? Math.abs(amountVal) : 0,
    currency: finalCurrency,
    category,
    description,
    notes,
    status,
    issues,
  };
}

function fmtMoney(n: number, ccy: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: ccy,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${ccy} ${n.toFixed(0)}`;
  }
}

export default function DatedUploadCard({ currency }: { currency: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const cols = useMemo(
    () => (preview ? resolveColumns(preview.headers) : null),
    [preview],
  );

  const validated: ValidatedRow[] = useMemo(() => {
    if (!preview || !cols) return [];
    return preview.rows.map((r, i) => validateRow(r, cols, i, currency));
  }, [preview, cols, currency]);

  const summary = useMemo(() => {
    let valid = 0, warning = 0, error = 0;
    let income = 0, expense = 0;
    let uncategorized = 0;
    let incomeTotal = 0, expenseTotal = 0;
    for (const r of validated) {
      if (r.status === "valid") valid++;
      else if (r.status === "warning") warning++;
      else error++;
      if (r.type === "income") { income++; incomeTotal += r.amount; }
      if (r.type === "expense") { expense++; expenseTotal += r.amount; }
      if (!r.category) uncategorized++;
    }
    return {
      total: validated.length,
      valid, warning, error,
      income, expense, uncategorized,
      incomeTotal, expenseTotal,
    };
  }, [validated]);

  const commitable = summary.total > 0 && summary.error === 0;

  async function uploadFile(file: File) {
    setParsing(true);
    setParseError(null);
    setCommitError(null);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "manual_bulk");
      const res = await fetch("/api/upload/preview", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.text()) || "Could not parse the file");
      const data: Preview = await res.json();
      setPreview(data);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setParsing(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  async function commit() {
    if (!preview || !cols || !commitable) return;
    setCommitting(true);
    setCommitError(null);
    try {
      // Flip the sign on expense rows so the downstream pipeline (which
      // infers type from amount sign) marks them as expenses. Income rows
      // stay positive.
      const rows = validated
        .filter((r) => r.status !== "error")
        .map((r) => ({
          date: r.date,
          amount: r.type === "expense" ? -r.amount : r.amount,
          currency: r.currency,
          category: r.category,
          description: r.description,
          notes: r.notes,
        }));

      const res = await fetch("/api/upload/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual_bulk",
          filename: preview.filename,
          rows,
          mapping: {
            date: "date",
            amount: "amount",
            description: "description",
            currency: "currency",
            txnId: null,
            source: null,
            category: "category",
            notes: "notes",
            vendor: null,
          },
          signOverride: 1,
          // No forceAccountingMonth - each row's date drives its month.
          saveTemplateName: null,
        }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const imported = data.imported ?? 0;
      setPreview(null);
      setCommitting(false);
      startTransition(() => router.refresh());
      notify.alert(
        `Your business data was uploaded successfully.\n\n${imported} transaction${imported === 1 ? "" : "s"} imported. We're now analyzing your income, expenses, trends, and business activity to generate insights and forecasts.`,
      );
      router.push("/data-flow?range=all");
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : String(err));
      setCommitting(false);
    }
  }

  const busy = parsing || committing || pending;
  const headersResolved = cols ? Object.values(cols).filter(Boolean).length : 0;

  return (
    <div className="card mb-6">
      <div className="font-medium mb-1">Upload your business transactions</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">
        Download our CSV template, fill it in with your business activity, and upload it back.
        Each row needs a date, a type (income or expense), an amount, and a currency - the rest is optional.
        Your bank&apos;s export usually works too if it has these columns.
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <a
          href="/api/upload/template"
          className="btn-ghost text-sm"
          download="tweaxly-template.csv"
        >
          ⬇ Download CSV template
        </a>
        <label className="btn-primary text-sm cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFile(f);
              e.target.value = "";
            }}
          />
          ⬆ Upload CSV
        </label>
      </div>

      {/* Drop zone */}
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-accent bg-accent-soft/30"
              : "border-line bg-ink-900/30"
          }`}
        >
          <div className="text-sm text-slate-300">
            {parsing
              ? "Reading your file…"
              : "Drag a CSV or Excel file here, or use the buttons above."}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Required columns: date, type, amount, currency.
          </div>
          {parseError ? (
            <div className="mt-3 text-sm text-bad">{parseError}</div>
          ) : null}
        </div>
      ) : null}

      {/* Preview + summary */}
      {preview && cols ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-slate-300">
              <span className="font-medium text-slate-100">{preview.filename}</span>
              <span className="text-slate-500 ml-2">· {validated.length} row{validated.length === 1 ? "" : "s"}</span>
              {headersResolved < 4 ? (
                <span className="pill-warn ml-2 text-[10px]">
                  Some required columns weren&apos;t recognized
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={() => { setPreview(null); setParseError(null); setCommitError(null); }}
            >
              Pick a different file
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <SummaryTile label="Total rows" value={String(summary.total)} />
            <SummaryTile
              label="Income"
              value={`${summary.income} · ${fmtMoney(summary.incomeTotal, currency)}`}
              tone="good"
            />
            <SummaryTile
              label="Expense"
              value={`${summary.expense} · ${fmtMoney(summary.expenseTotal, currency)}`}
              tone="bad"
            />
            <SummaryTile
              label="Uncategorized"
              value={String(summary.uncategorized)}
              tone={summary.uncategorized > 0 ? "warn" : "neutral"}
            />
            <SummaryTile
              label="Invalid rows"
              value={String(summary.error)}
              tone={summary.error > 0 ? "bad" : "good"}
            />
          </div>

          {/* Per-row preview */}
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th>Currency</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {validated.slice(0, 100).map((r) => (
                  <tr key={r.index} className={
                    r.status === "error" ? "bg-bad/5" :
                    r.status === "warning" ? "bg-warn/5" : ""
                  }>
                    <td>
                      <StatusPill row={r} />
                    </td>
                    <td className="whitespace-nowrap">{r.date || "-"}</td>
                    <td>
                      {r.type ? (
                        <span className={r.type === "income" ? "pill-good text-[10px]" : "pill-bad text-[10px]"}>
                          {r.type}
                        </span>
                      ) : <span className="text-slate-500">-</span>}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {r.amount > 0 ? fmtMoney(r.amount, r.currency || currency) : "-"}
                    </td>
                    <td>{r.currency || "-"}</td>
                    <td>{r.category || <span className="text-slate-500">-</span>}</td>
                    <td className="text-slate-300">{r.description || <span className="text-slate-500">-</span>}</td>
                    <td className="text-slate-400 text-xs max-w-xs truncate" title={r.notes}>
                      {r.notes || <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validated.length > 100 ? (
              <div className="text-xs text-slate-500 text-center py-2 border-t border-line">
                Showing first 100 of {validated.length} rows. All rows will upload.
              </div>
            ) : null}
          </div>

          {/* Commit row */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-line">
            <div className="text-xs text-slate-400">
              {summary.error > 0
                ? `Fix the ${summary.error} invalid row${summary.error === 1 ? "" : "s"} above before uploading.`
                : summary.warning > 0
                  ? `${summary.warning} row${summary.warning === 1 ? "" : "s"} have warnings - they'll still upload.`
                  : "All rows look good."}
            </div>
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              disabled={!commitable || busy}
              onClick={() => void commit()}
            >
              {committing ? "Uploading…" : `Upload ${summary.total - summary.error} transaction${summary.total - summary.error === 1 ? "" : "s"}`}
            </button>
          </div>

          {commitError ? (
            <div className="text-sm text-bad">{commitError}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const valueClass =
    tone === "good" ? "text-good" :
    tone === "warn" ? "text-warn" :
    tone === "bad"  ? "text-bad"  :
                      "text-slate-100";
  return (
    <div className="card-tight">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 font-semibold text-sm ${valueClass}`}>{value}</div>
    </div>
  );
}

function StatusPill({ row }: { row: ValidatedRow }) {
  if (row.status === "valid") {
    return <span className="pill-good text-[10px]" title="OK">✓</span>;
  }
  if (row.status === "warning") {
    return (
      <span
        className="pill-warn text-[10px] cursor-help"
        title={row.issues.join(" · ")}
      >
        warn
      </span>
    );
  }
  return (
    <span
      className="pill-bad text-[10px] cursor-help"
      title={row.issues.join(" · ")}
    >
      error
    </span>
  );
}
