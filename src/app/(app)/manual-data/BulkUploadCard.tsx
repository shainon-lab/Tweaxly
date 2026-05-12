"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Preview = {
  headers: string[];
  rows: Record<string, unknown>[];
  filename: string;
  guess: Record<string, string | null>;
};

// "pnl" = use the row's natural sign (negative → outcome, positive → income).
// "income" / "outcome" = coerce every row to that direction (legacy behavior).
type Mode = "pnl" | "income" | "outcome";

// Each section is one (file, month, year) combo. Draft sections are still
// being filled in by the user; confirmed sections are locked and queued for
// upload when the user clicks DONE & UPLOAD.
type Section = {
  id: string;
  status: "draft" | "confirmed";
  preview: Preview | null;
  month: number;
  year: number;
  parsing: boolean;
  parseError: string | null;
};

const MAX_FILES = 12;

// Best-effort client-side parsers, mirroring lib/parsers.parseAmount + parseDate
function parseAmountClient(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  let s = String(raw).trim();
  if (!s) return 0;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  if (/^-/.test(s)) {
    sign = -1;
    s = s.slice(1);
  }
  s = s.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) s = parts.join(".");
    else s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? sign * n : 0;
}

type FileSummary = {
  incomeRows: number; outcomeRows: number;
  incomeTotal: number; outcomeTotal: number;
  total: number; rowCount: number;
  uniqueNames: number;
};

function buildSummary(preview: Preview, mode: Mode): FileSummary | null {
  const amountCol = preview.guess.amount;
  if (!amountCol) return null;
  let incomeRows = 0, outcomeRows = 0;
  let incomeTotal = 0, outcomeTotal = 0;
  const uniqueNames = new Set<string>();
  const nameCol = preview.guess.vendor || preview.guess.description;
  for (const row of preview.rows) {
    const amt = parseAmountClient(row[amountCol]);
    if (Number.isFinite(amt) && amt !== 0) {
      if (mode === "pnl") {
        if (amt > 0) { incomeRows++; incomeTotal += amt; }
        else         { outcomeRows++; outcomeTotal += Math.abs(amt); }
      } else if (mode === "income") {
        incomeRows++; incomeTotal += Math.abs(amt);
      } else {
        outcomeRows++; outcomeTotal += Math.abs(amt);
      }
    }
    if (nameCol) {
      const name = String(row[nameCol] ?? "").trim();
      if (name) uniqueNames.add(name);
    }
  }
  return {
    incomeRows, outcomeRows, incomeTotal, outcomeTotal,
    total: incomeTotal + outcomeTotal,
    rowCount: incomeRows + outcomeRows,
    uniqueNames: uniqueNames.size,
  };
}

function buildAmountSamples(preview: Preview): string[] {
  if (!preview.guess.amount) return [];
  const col = preview.guess.amount;
  const out: string[] = [];
  for (const row of preview.rows) {
    const v = row[col];
    if (v == null || v === "") continue;
    out.push(String(v));
    if (out.length >= 3) break;
  }
  return out;
}

const MIN_YEAR = 2020;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currentYearMonth() {
  const d = new Date();
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function ymString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function ymToLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

let nextSectionId = 1;
function newSection(month: number, year: number): Section {
  return {
    id: String(nextSectionId++),
    status: "draft",
    preview: null,
    month,
    year,
    parsing: false,
    parseError: null,
  };
}

export default function BulkUploadCard({ currency }: { currency: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("pnl");
  const today = useMemo(() => currentYearMonth(), []);
  const [sections, setSections] = useState<Section[]>(() => [
    newSection(today.month, today.year),
  ]);
  const [committingId, setCommittingId] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Upload summary tiles are headlines — show whole dollars, no decimals.
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [currency],
  );

  function patchSection(id: string, patch: Partial<Section>) {
    setSections((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function pickFile(id: string, file: File | null) {
    if (!file) return;
    patchSection(id, { parsing: true, parseError: null });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "manual_bulk");
      const res = await fetch("/api/upload/preview", { method: "POST", body: fd });
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to parse file");
      }
      const data: Preview = await res.json();
      patchSection(id, { preview: data, parsing: false });
    } catch (err) {
      patchSection(id, {
        parsing: false,
        parseError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function changeYear(id: string, nextYear: number) {
    setSections((cur) =>
      cur.map((s) => {
        if (s.id !== id) return s;
        // If switching to current year would put month in the future, snap.
        const month = nextYear === today.year && s.month > today.month
          ? today.month
          : s.month;
        return { ...s, year: nextYear, month };
      }),
    );
  }

  function confirmSection(id: string) {
    setSections((cur) =>
      cur.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s)),
    );
  }

  function unconfirmSection(id: string) {
    setSections((cur) =>
      cur.map((s) => (s.id === id ? { ...s, status: "draft" } : s)),
    );
  }

  function removeSection(id: string) {
    setSections((cur) => {
      const next = cur.filter((s) => s.id !== id);
      // Always keep at least one draft slot so the user can start over.
      if (next.length === 0) {
        return [newSection(today.month, today.year)];
      }
      return next;
    });
  }

  function addAnother() {
    if (sections.length >= MAX_FILES) return;
    if (sections.some((s) => s.status === "draft")) return;
    setSections((cur) => [...cur, newSection(today.month, today.year)]);
  }

  const confirmed = sections.filter((s) => s.status === "confirmed");
  const hasDraft = sections.some((s) => s.status === "draft");
  const reachedCap = sections.length >= MAX_FILES;
  const busy = committingId !== null || pending;

  const aggregate = useMemo(() => {
    let income = 0, outcome = 0, rows = 0;
    for (const s of confirmed) {
      const sum = s.preview ? buildSummary(s.preview, mode) : null;
      if (!sum) continue;
      income += sum.incomeTotal;
      outcome += sum.outcomeTotal;
      rows += sum.rowCount;
    }
    return { income, outcome, rows };
  }, [confirmed, mode]);

  async function commitAll() {
    if (confirmed.length === 0) return;
    setCommitError(null);
    let totalImported = 0;
    try {
      for (const s of confirmed) {
        if (!s.preview) continue;
        setCommittingId(s.id);
        const res = await fetch("/api/upload/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "manual_bulk",
            filename: s.preview.filename,
            rows: s.preview.rows,
            mapping: s.preview.guess,
            signOverride: 1,
            forceDirection: mode === "pnl" ? undefined : mode,
            forceAccountingMonth: ymString(s.year, s.month),
            saveTemplateName: null,
          }),
        });
        if (!res.ok) {
          throw new Error(`${s.preview.filename}: ${(await res.text()) || `HTTP ${res.status}`}`);
        }
        const data = await res.json();
        totalImported += data.imported ?? 0;
      }
      const fileCount = confirmed.length;
      setSections([newSection(today.month, today.year)]);
      setCommittingId(null);
      startTransition(() => router.refresh());
      alert(
        `Imported ${totalImported} transaction${totalImported === 1 ? "" : "s"} from ${fileCount} file${fileCount === 1 ? "" : "s"}.`,
      );
      router.push("/data-flow?range=all");
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : String(err));
      setCommittingId(null);
    }
  }

  return (
    <div className="card mb-6">
      <div className="font-medium mb-1">Bulk upload from file</div>
      <div className="text-sm text-slate-400 mb-3">
        Add up to {MAX_FILES} files. For each file, pick the month and year it belongs to,
        then click <span className="text-slate-200">Confirm</span>. After confirming you can
        either <span className="text-slate-200">+ Add more</span> to upload another file (with
        its own period) or <span className="text-slate-200">DONE &amp; UPLOAD</span> to finish.
        Each file is logged separately so you can remove it from the Data log later.
      </div>
      <div className="card-tight border-warn/40 bg-warn/5 mb-4 flex items-start gap-2">
        <span className="text-warn shrink-0 mt-0.5">ⓘ</span>
        <div className="text-xs text-slate-200 leading-relaxed">
          <span className="font-medium">Tip:</span> make sure the amount cells in your CSV/Excel are
          formatted as <span className="text-slate-100">numbers</span>, not text. In Excel, select
          the column → Format Cells → Number. Numbers stored as text won&apos;t be summed correctly
          and may cause Income / Outcome to show as $0.
        </div>
      </div>

      {/* Upload mode applies to every section in the batch. */}
      <div className="mb-5">
        <label className="label">Upload mode (applies to all files)</label>
        <select
          className="input"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          disabled={busy}
        >
          <option value="pnl">P&amp;L (auto: negative = outcome, positive = income)</option>
          <option value="income">Income (force every row to income)</option>
          <option value="outcome">Outcome (force every row to outcome)</option>
        </select>
        <div className="text-xs text-slate-400 mt-1">
          {mode === "pnl"
            ? "Each row's natural sign decides whether it's income or outcome."
            : `Every row will be imported as ${mode}, regardless of its sign.`}
        </div>
      </div>

      {/* Sections — one per file. */}
      <div className="space-y-4 mb-4">
        {sections.map((s, i) => (
          <SectionCard
            key={s.id}
            index={i + 1}
            section={s}
            today={today}
            mode={mode}
            fmt={fmt}
            disabled={busy}
            isCommitting={committingId === s.id}
            onPickFile={(file) => pickFile(s.id, file)}
            onChangeMonth={(m) => patchSection(s.id, { month: m })}
            onChangeYear={(y) => changeYear(s.id, y)}
            onConfirm={() => confirmSection(s.id)}
            onUnconfirm={() => unconfirmSection(s.id)}
            onRemove={() => removeSection(s.id)}
          />
        ))}
      </div>

      {commitError ? (
        <div className="text-sm text-bad mb-3">{commitError}</div>
      ) : null}

      {/* Bottom actions */}
      <div className="border-t border-line pt-4">
        {confirmed.length > 0 ? (
          <div className="text-xs text-slate-400 mb-3">
            <span className="text-slate-200">{confirmed.length}</span> confirmed file{confirmed.length === 1 ? "" : "s"} ·{" "}
            <span className="text-good">+{fmt.format(aggregate.income)}</span> income ·{" "}
            <span className="text-bad">−{fmt.format(aggregate.outcome)}</span> outcome ·{" "}
            <span className="text-slate-200">{aggregate.rows}</span> row{aggregate.rows === 1 ? "" : "s"} total
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* + Add more — only when last section is confirmed AND under cap. */}
          {!reachedCap && !hasDraft && confirmed.length > 0 ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={addAnother}
              disabled={busy}
            >
              + Add more
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || confirmed.length === 0}
            onClick={commitAll}
            title={
              confirmed.length === 0
                ? "Confirm at least one file first"
                : "Import all confirmed files"
            }
          >
            {committingId !== null
              ? "Uploading…"
              : `DONE & UPLOAD${confirmed.length > 0 ? ` (${confirmed.length})` : ""}`}
          </button>
        </div>
        {reachedCap ? (
          <div className="text-xs text-slate-500 mt-2 text-right">
            Reached the {MAX_FILES}-file limit — finish with DONE &amp; UPLOAD.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({
  index,
  section,
  today,
  mode,
  fmt,
  disabled,
  isCommitting,
  onPickFile,
  onChangeMonth,
  onChangeYear,
  onConfirm,
  onUnconfirm,
  onRemove,
}: {
  index: number;
  section: Section;
  today: { year: number; month: number };
  mode: Mode;
  fmt: Intl.NumberFormat;
  disabled: boolean;
  isCommitting: boolean;
  onPickFile: (file: File | null) => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onRemove: () => void;
}) {
  const monthsForYear = useMemo(() => {
    const max = section.year >= today.year ? today.month : 12;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [section.year, today]);

  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = today.year; y >= MIN_YEAR; y--) out.push(y);
    return out;
  }, [today.year]);

  const summary = useMemo(
    () => (section.preview ? buildSummary(section.preview, mode) : null),
    [section.preview, mode],
  );
  const samples = useMemo(
    () => (section.preview ? buildAmountSamples(section.preview) : []),
    [section.preview],
  );

  const autoOK = !!section.preview?.guess.amount;
  const detectionLooksWrong = !!(
    summary &&
    summary.incomeTotal === 0 &&
    summary.outcomeTotal === 0 &&
    section.preview &&
    section.preview.rows.length > 0
  );

  const isConfirmed = section.status === "confirmed";
  const ymLabel = `${MONTH_NAMES[section.month - 1]} ${section.year}`;
  const canConfirm = !!section.preview && autoOK && !section.parsing && !isCommitting;

  return (
    <div
      className={`rounded-xl border p-4 bg-ink-900/50 ${
        isCommitting ? "border-accent" : isConfirmed ? "border-good/40" : "border-line"
      }`}
      data-surface="sub"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          File {index}
          {isConfirmed ? <span className="ml-2 pill-good">confirmed</span> : null}
          {isCommitting ? <span className="ml-2 text-accent">uploading…</span> : null}
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-bad px-2 text-sm"
          onClick={onRemove}
          disabled={disabled}
          title="Remove this file"
        >
          ✕
        </button>
      </div>

      {/* Inputs — order: file, month, year, confirm. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-3">
          <label className="label">Upload file (CSV / XLSX)</label>
          <input
            className="input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              onPickFile(f);
            }}
            disabled={disabled || isConfirmed}
          />
          {section.preview ? (
            <div className="text-xs text-slate-300 mt-1 truncate">
              <span className="text-slate-500">Loaded: </span>
              {section.preview.filename} — {section.preview.rows.length} row
              {section.preview.rows.length === 1 ? "" : "s"}
            </div>
          ) : null}
          {section.parsing ? (
            <div className="text-xs text-slate-400 mt-1">Parsing…</div>
          ) : null}
          {section.parseError ? (
            <div className="text-xs text-bad mt-1">{section.parseError}</div>
          ) : null}
        </div>
        <div>
          <label className="label">Month</label>
          <select
            className="input"
            value={section.month}
            onChange={(e) => onChangeMonth(Number(e.target.value))}
            disabled={disabled || isConfirmed}
          >
            {monthsForYear.map((m) => (
              <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select
            className="input"
            value={section.year}
            onChange={(e) => onChangeYear(Number(e.target.value))}
            disabled={disabled || isConfirmed}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          {isConfirmed ? (
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={onUnconfirm}
              disabled={disabled}
              title="Edit this file's settings"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={onConfirm}
              disabled={!canConfirm}
              title={
                !section.preview
                  ? "Upload a file first"
                  : !autoOK
                    ? "No Amount column detected — fix the file and re-upload"
                    : "Lock this file & period"
              }
            >
              Confirm
            </button>
          )}
        </div>
      </div>

      {/* Period reminder */}
      <div className="text-xs text-slate-400 mb-3">
        This file will be imported into <span className="text-slate-200">{ymLabel}</span>.
      </div>

      {/* Summary stats once we have a preview */}
      {section.preview ? (
        !autoOK ? (
          <div className="text-xs text-warn">
            ⚠ No Amount column detected — fix the file&apos;s columns and re-upload before
            confirming.
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
              {mode === "pnl" ? (
                <>
                  <div className="rounded-md border border-line px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Income</div>
                    <div className="text-sm font-semibold text-good">
                      +{fmt.format(summary.incomeTotal)}
                    </div>
                    <div className="text-[10px] text-slate-500">{summary.incomeRows} rows</div>
                  </div>
                  <div className="rounded-md border border-line px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Outcome</div>
                    <div className="text-sm font-semibold text-bad">
                      −{fmt.format(summary.outcomeTotal)}
                    </div>
                    <div className="text-[10px] text-slate-500">{summary.outcomeRows} rows</div>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-line px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    Total ({mode})
                  </div>
                  <div className={`text-sm font-semibold ${mode === "income" ? "text-good" : "text-bad"}`}>
                    {mode === "income" ? "+" : "−"}{fmt.format(summary.total)}
                  </div>
                  <div className="text-[10px] text-slate-500">{summary.rowCount} rows</div>
                </div>
              )}
              <div className="rounded-md border border-line px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Categories</div>
                <div className="text-sm font-semibold text-slate-100">{summary.uniqueNames}</div>
                <div className="text-[10px] text-slate-500">unique names</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Auto-detected: Amount = <span className="text-slate-300">{section.preview.guess.amount}</span>
              {samples.length > 0 ? (
                <span className="text-slate-600"> (e.g. {samples.join(", ")})</span>
              ) : null}
              {!section.preview.guess.date ? (
                <span className="text-slate-500">, no date column</span>
              ) : null}
            </div>
            {detectionLooksWrong ? (
              <div className="text-xs text-bad mt-1">
                ⚠ Both Income and Outcome totals are $0 — the detector probably picked the wrong
                column. Fix the file and re-upload before confirming.
              </div>
            ) : null}
          </>
        ) : null
      ) : null}
    </div>
  );
}
