"use client";

// Bank Statement Import Wizard.
//
// Five-step flow for importing transaction-level bank exports:
//   1. Upload        — drag-drop / file picker (.csv, .xls, .xlsx)
//   2. Map columns   — table of detected columns ↔ Tweaxly fields, with
//                      sample values, confidence pills, and "apply saved
//                      template" for repeat imports
//   3. Validate      — counts valid rows, lists rows that can't normalize
//   4. Confirm       — duplicate handling + optional "save template" name
//   5. Done          — summary of imported / flagged-as-duplicate counts
//
// All imports are scoped to the currently active workspace; the wizard
// never asks the user to choose one. Templates are saved per-workspace
// (Prisma model: MappingTemplate, unique on (businessId, name)).
//
// The wizard talks to the existing API surface — no new endpoints other
// than GET /api/upload/templates added in this PR. Heavy lifting (currency
// conversion, categorization, duplicate detection) all happens server-side
// in /api/upload/commit.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload as UploadIcon,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X as XIcon,
  Loader2,
} from "lucide-react";
import CurrencyPicker from "@/components/CurrencyPicker";

// ─── Field vocabulary ─────────────────────────────────────────────────────
// What the user maps each file column to. "ignore" means the column is
// skipped on import. "amount_combined" is what the parser synthesizes when
// it sees split Debit/Credit columns — shown so the user knows the value
// came from two source columns.
type FieldKey =
  | "ignore"
  | "date"
  | "description"
  | "vendor"
  | "amount"
  | "income"
  | "expense"
  | "currency"
  | "balance"
  | "txnId"
  | "category"
  | "notes";

const FIELD_OPTIONS: { value: FieldKey; label: string; group?: string }[] = [
  { value: "ignore",      label: "Ignore" },
  { value: "date",        label: "Transaction date",       group: "Required" },
  { value: "description", label: "Description",            group: "Required" },
  { value: "vendor",      label: "Vendor / payee",         group: "Required" },
  { value: "amount",      label: "Amount (single column)", group: "Amount" },
  { value: "income",      label: "Income amount",          group: "Amount" },
  { value: "expense",     label: "Expense amount",         group: "Amount" },
  { value: "currency",    label: "Currency",               group: "Optional" },
  { value: "balance",     label: "Balance",                group: "Optional" },
  { value: "txnId",       label: "Reference / txn ID",     group: "Optional" },
  { value: "category",    label: "Category",               group: "Optional" },
  { value: "notes",       label: "Notes",                  group: "Optional" },
];

// What we receive from /api/upload/preview.
type PreviewResponse = {
  headers:    string[];
  rows:       Record<string, unknown>[];
  filename:   string;
  encoding:   string | null;
  guess:      Record<string, string | null>;       // legacy shape
  confidence: Record<string, { field: string; header: string | null; confidence: number; source: string }>;
};

type SavedTemplate = {
  id:       string;
  name:     string;
  source:   string;
  mapping:  Record<string, string | null>;
  createdAt: string;
};

// Wizard's local column-mapping shape: per-column field assignment.
// Converted to the server's ColumnMapping (single header per field) just
// before posting to /api/upload/commit.
type Assignments = Record<string /* header */, FieldKey>;

// ─── Step ids ─────────────────────────────────────────────────────────────
type Step = "upload" | "map" | "validate" | "confirm" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload",   label: "Upload" },
  { id: "map",      label: "Map columns" },
  { id: "validate", label: "Validate" },
  { id: "confirm",  label: "Confirm" },
  { id: "done",     label: "Done" },
];

const COL_LETTERS = (i: number): string => {
  // Excel-style: A..Z, AA..ZZ, ...
  let s = "";
  let n = i;
  while (true) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return s;
};

export default function BankImportWizard({ defaultCurrency }: { defaultCurrency: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");

  // Step 1 state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2+ state (set after a successful preview)
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [defaultCcy, setDefaultCcy] = useState<string>(defaultCurrency);

  // Saved templates for this workspace (auto-suggest on second+ uploads).
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Step 4 confirm state
  const [saveAsName, setSaveAsName] = useState<string>("");
  const [importing, setImporting]   = useState(false);
  const [, startTransition] = useTransition();

  // Step 5 done state
  const [importResult, setImportResult] = useState<{ imported: number; duplicateGroups: number } | null>(null);

  // Pull saved templates once — used in the Map step.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/upload/templates");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTemplates(data.templates ?? []);
      } catch { /* best-effort */ }
    })();
    return () => { cancelled = true };
  }, []);

  function reset() {
    setStep("upload");
    setFile(null);
    setUploading(false);
    setUploadError(null);
    setPreview(null);
    setAssignments({});
    setAppliedTemplateId(null);
    setSaveAsName("");
    setImporting(false);
    setImportResult(null);
  }

  async function runPreview(f: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/upload/preview", { method: "POST", body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Preview failed (${res.status})`);
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);

      // Seed assignments from the auto-detected guess. Headers not in the
      // guess default to "ignore" so nothing gets imported by accident.
      const seed: Assignments = {};
      for (const h of data.headers) seed[h] = "ignore";
      for (const [field, header] of Object.entries(data.guess)) {
        if (!header) continue;
        // The guess uses the server-side field names which mostly match our
        // FieldKey; map the few that differ.
        const mapped = mapServerFieldToClient(field);
        if (mapped) seed[header] = mapped;
      }
      // If a saved template exists with the SAME header set, apply it
      // automatically and tell the user we did.
      const match = templates.find((t) => sameHeaderSet(t.mapping, data.headers));
      if (match) {
        applyTemplate(match, seed, data.headers);
        setAppliedTemplateId(match.id);
      } else {
        setAssignments(seed);
      }
      setStep("map");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function applyTemplate(t: SavedTemplate, base: Assignments, headers: string[]) {
    const next: Assignments = { ...base };
    // Reset everything to ignore, then apply the template's mapping.
    for (const h of headers) next[h] = "ignore";
    for (const [field, header] of Object.entries(t.mapping)) {
      if (!header) continue;
      if (!headers.includes(header)) continue;
      const mapped = mapServerFieldToClient(field);
      if (mapped) next[header] = mapped;
    }
    setAssignments(next);
    setAppliedTemplateId(t.id);
  }

  // ── Validation derived from current assignments ──────────────────────
  const validation = useMemo(() => computeValidation(assignments, preview), [assignments, preview]);

  return (
    <div className="card mb-6">
      <div className="font-medium mb-1">Bank statement import</div>
      <div className="text-xs text-slate-400 mb-4">
        Upload a CSV, XLS, or XLSX from any bank. The wizard auto-detects the
        columns; you confirm the mapping and we handle currency conversion,
        categorization, and duplicate detection.
      </div>

      <Stepper current={step} />

      {step === "upload" && (
        <UploadStep
          file={file}
          uploading={uploading}
          error={uploadError}
          fileInputRef={fileInputRef}
          onPick={(f) => { setFile(f); void runPreview(f); }}
          templateCount={templates.length}
        />
      )}

      {step === "map" && preview && (
        <MapStep
          preview={preview}
          assignments={assignments}
          setAssignments={setAssignments}
          defaultCcy={defaultCcy}
          setDefaultCcy={setDefaultCcy}
          templates={templates}
          appliedTemplateId={appliedTemplateId}
          onApplyTemplate={(t) => applyTemplate(t, assignments, preview.headers)}
          validation={validation}
          onBack={() => setStep("upload")}
          onNext={() => setStep("validate")}
        />
      )}

      {step === "validate" && preview && (
        <ValidateStep
          preview={preview}
          assignments={assignments}
          defaultCcy={defaultCcy}
          onBack={() => setStep("map")}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && preview && (
        <ConfirmStep
          preview={preview}
          assignments={assignments}
          saveAsName={saveAsName}
          setSaveAsName={setSaveAsName}
          importing={importing}
          onBack={() => setStep("confirm" === step ? "validate" : "confirm")}
          onImport={async () => {
            setImporting(true);
            try {
              let mapping = toServerMapping(assignments);
              let rows: Record<string, unknown>[] = preview.rows;

              // Income/expense split: synthesize a signed "__amt__" column.
              // Income contributes positive, expense contributes negative,
              // matching the convention parseFileBuffer uses for Debit/Credit.
              const incomeH  = headerFor(assignments, "income");
              const expenseH = headerFor(assignments, "expense");
              if (!mapping.amount && (incomeH || expenseH)) {
                rows = rows.map((r) => {
                  const inc = incomeH  ? parseNum(r[incomeH])  : 0;
                  const exp = expenseH ? parseNum(r[expenseH]) : 0;
                  return { ...r, __amt__: Math.abs(inc) - Math.abs(exp) };
                });
                mapping = { ...mapping, amount: "__amt__" };
              }

              // Default currency fallback: attach a synthesized currency
              // column so every row carries the user's chosen default.
              if (defaultCcy && !mapping.currency) {
                rows = rows.map((r) => ({ ...r, __ccy__: defaultCcy }));
                mapping = { ...mapping, currency: "__ccy__" };
              }
              const res = await fetch("/api/upload/commit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  source: "bank",
                  filename: preview.filename,
                  rows,
                  mapping,
                  saveTemplateName: saveAsName.trim() || null,
                }),
              });
              if (!res.ok) {
                const txt = await res.text();
                let msg = txt || `Import failed (${res.status})`;
                try { msg = JSON.parse(txt).error ?? msg; } catch { /* keep raw */ }
                throw new Error(msg);
              }
              const data = await res.json();
              setImportResult({ imported: data.imported ?? 0, duplicateGroups: data.duplicateGroups ?? 0 });
              setStep("done");
              startTransition(() => router.refresh());
            } catch (err) {
              alert(err instanceof Error ? err.message : "Import failed");
            } finally {
              setImporting(false);
            }
          }}
        />
      )}

      {step === "done" && importResult && (
        <DoneStep
          imported={importResult.imported}
          duplicateGroups={importResult.duplicateGroups}
          templateSaved={!!saveAsName.trim()}
          onAnother={() => reset()}
          onViewTxns={() => router.push("/transactions")}
        />
      )}
    </div>
  );
}

// ─── Stepper header ────────────────────────────────────────────────────────
function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-2 mb-5">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold ${
                active ? "bg-accent text-white" :
                done   ? "bg-good/20 text-good" :
                         "bg-ink-700 text-slate-500"
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={`text-xs ${active ? "text-slate-100 font-medium" : done ? "text-slate-300" : "text-slate-500"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 ? (
              <ChevronRight size={14} className="text-slate-600 mx-1" aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Upload ────────────────────────────────────────────────────────
function UploadStep({
  file, uploading, error, fileInputRef, onPick, templateCount,
}: {
  file: File | null;
  uploading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPick: (f: File) => void;
  templateCount: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPick(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed ${dragOver ? "border-accent bg-accent-soft/20" : "border-line bg-ink-900/40"} px-6 py-10 text-center cursor-pointer transition`}
      >
        <UploadIcon size={28} strokeWidth={1.5} className="mx-auto text-slate-400 mb-2" />
        <div className="text-sm font-medium text-slate-100">
          {uploading ? "Reading file…" : "Drop a bank statement here, or click to browse"}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          CSV, XLS, XLSX up to 10 MB. Hebrew (Windows-1255) files are auto-detected.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </div>
      {file ? (
        <div className="mt-3 text-xs text-slate-300 flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          {file.name} · {(file.size / 1024).toFixed(1)} KB
        </div>
      ) : null}
      {error ? <div className="mt-3 text-sm text-bad">{error}</div> : null}
      {templateCount > 0 ? (
        <div className="mt-4 text-xs text-slate-400">
          {templateCount} saved {templateCount === 1 ? "template" : "templates"} available — if your file's
          column headers match a saved one, the mapping will be applied automatically.
        </div>
      ) : null}
    </div>
  );
}

// ─── Step 2: Map columns ───────────────────────────────────────────────────
type Validation = {
  ok: boolean;
  warnings: string[];
  errors:   string[];
};

function MapStep({
  preview, assignments, setAssignments, defaultCcy, setDefaultCcy,
  templates, appliedTemplateId, onApplyTemplate, validation, onBack, onNext,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  setAssignments: (a: Assignments) => void;
  defaultCcy: string;
  setDefaultCcy: (c: string) => void;
  templates: SavedTemplate[];
  appliedTemplateId: string | null;
  onApplyTemplate: (t: SavedTemplate) => void;
  validation: Validation;
  onBack: () => void;
  onNext: () => void;
}) {
  const currencyMapped = Object.values(assignments).some((f) => f === "currency");
  return (
    <div>
      {/* Top utilities */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {preview.encoding && preview.encoding !== "utf-8" ? (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent-soft/30 text-accent border border-accent/30">
            Encoding: {preview.encoding}
          </span>
        ) : null}
        <span className="text-xs text-slate-400">
          {preview.headers.length} columns · {preview.rows.length} rows
        </span>
        {templates.length > 0 ? (
          <select
            className="input py-1 text-xs max-w-[260px] ml-auto"
            value={appliedTemplateId ?? ""}
            onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value);
              if (t) onApplyTemplate(t);
            }}
          >
            <option value="">Apply saved template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      {/* Mapping table */}
      <div className="rounded-md border border-line overflow-x-auto" dir="ltr">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/60 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 w-10">Col</th>
              <th className="text-left px-3 py-2">Header</th>
              <th className="text-left px-3 py-2">Sample values</th>
              <th className="text-left px-3 py-2 w-[200px]">Map to</th>
              <th className="text-left px-3 py-2 w-[80px]">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {preview.headers.map((h, idx) => {
              const samples = preview.rows.slice(0, 4).map((r) => r[h]).filter((v) => v != null && v !== "");
              const conf = findConfidenceForHeader(preview.confidence, h);
              const value = assignments[h] ?? "ignore";
              return (
                <tr key={h} className={value === "ignore" ? "opacity-60" : ""}>
                  <td className="px-3 py-2 text-slate-500 font-mono text-xs align-top">{COL_LETTERS(idx)}</td>
                  <td className="px-3 py-2 text-slate-100 align-top">
                    <span dir="auto">{h}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400 align-top max-w-[280px]" dir="auto">
                    {samples.length === 0 ? (
                      <span className="italic text-slate-600">empty</span>
                    ) : samples.map((v, i) => (
                      <div key={i} className="truncate">{String(v)}</div>
                    ))}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className="input py-1 text-xs"
                      value={value}
                      onChange={(e) => setAssignments({ ...assignments, [h]: e.target.value as FieldKey })}
                    >
                      {FIELD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    {conf && conf.confidence > 0 ? <ConfidencePill value={conf.confidence} /> : (
                      <span className="text-[11px] text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Default currency picker — only when no currency column is mapped */}
      {!currencyMapped ? (
        <div className="mt-4 max-w-xs">
          <label className="label">Default currency for this file</label>
          <CurrencyPicker value={defaultCcy} onChange={setDefaultCcy} />
          <div className="text-xs text-slate-500 mt-1">
            No currency column was detected. Every row will be treated as {defaultCcy}.
          </div>
        </div>
      ) : null}

      {/* Validation summary */}
      {validation.errors.length > 0 || validation.warnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {validation.errors.map((e, i) => (
            <div key={`e${i}`} className="text-xs text-bad inline-flex items-start gap-1.5">
              <XIcon size={14} className="mt-0.5 shrink-0" /> {e}
            </div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`w${i}`} className="text-xs text-warn inline-flex items-start gap-1.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-5">
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
        <button
          type="button"
          onClick={onNext}
          disabled={!validation.ok}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls =
    pct >= 90 ? "bg-good/20 text-good border-good/30" :
    pct >= 70 ? "bg-accent-soft/30 text-accent border-accent/30" :
                "bg-warn/20 text-warn border-warn/30";
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {pct}%
    </span>
  );
}

// ─── Step 3: Validate ──────────────────────────────────────────────────────
function ValidateStep({
  preview, assignments, defaultCcy, onBack, onNext,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  defaultCcy: string;
  onBack: () => void;
  onNext: () => void;
}) {
  // Client-side dry run: walk the rows with the chosen mapping and count
  // how many would normalize cleanly. Date + Amount (or Income/Expense)
  // are the must-haves; everything else is best-effort.
  const result = useMemo(() => dryRun(preview.rows, assignments, defaultCcy), [preview.rows, assignments, defaultCcy]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Stat label="Total rows"        value={result.total.toLocaleString()} />
        <Stat label="Valid rows"        value={result.valid.toLocaleString()} tone="good" />
        <Stat label="Rows with issues"  value={result.invalid.toLocaleString()} tone={result.invalid > 0 ? "warn" : "muted"} />
      </div>
      {result.issues.length > 0 ? (
        <div className="rounded-md border border-line bg-ink-900/40 max-h-[260px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-ink-900/80 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 w-16">Row</th>
                <th className="text-left px-3 py-2">Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {result.issues.slice(0, 50).map((iss, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 text-slate-400 font-mono">{iss.row + 1}</td>
                  <td className="px-3 py-1.5 text-warn">{iss.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.issues.length > 50 ? (
            <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-line">
              + {result.issues.length - 50} more issues — they'll be flagged after import.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-md border border-good/30 bg-good/10 px-4 py-3 text-sm text-good inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> All {result.total} rows parse cleanly with this mapping.
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
        <button
          type="button"
          onClick={onNext}
          disabled={result.valid === 0}
          className="btn-primary text-sm disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "good" | "warn" | "muted" }) {
  const cls = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : "text-slate-100";
  return (
    <div className="rounded-md border border-line bg-ink-900/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

// ─── Step 4: Confirm ───────────────────────────────────────────────────────
function ConfirmStep({
  preview, assignments, saveAsName, setSaveAsName, importing, onBack, onImport,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  saveAsName: string;
  setSaveAsName: (s: string) => void;
  importing: boolean;
  onBack: () => void;
  onImport: () => void;
}) {
  void assignments;
  return (
    <div>
      <div className="text-sm text-slate-300 mb-3">
        About to import <span className="font-semibold text-slate-100">{preview.rows.length}</span> rows
        from <span className="font-medium">{preview.filename}</span>.
      </div>
      <div className="card-tight border-warn/40 bg-warn/5 mb-4 flex items-start gap-2">
        <AlertTriangle size={14} className="text-warn shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed">
          Duplicates (same date + amount + vendor) are flagged automatically and
          shown for review in <span className="text-slate-100">Data Log</span> after import — they're never silently dropped.
        </div>
      </div>
      <div className="max-w-md mb-5">
        <label className="label">Save this mapping as a template (optional)</label>
        <input
          className="input"
          value={saveAsName}
          onChange={(e) => setSaveAsName(e.target.value)}
          placeholder="e.g. Bank Hapoalim checking"
          disabled={importing}
        />
        <div className="text-xs text-slate-500 mt-1">
          Next time you upload a file with the same column headers, this mapping is suggested automatically.
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-ghost text-sm" disabled={importing}>← Back</button>
        <button
          type="button"
          onClick={onImport}
          disabled={importing}
          className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {importing ? (<><Loader2 size={14} className="animate-spin" /> Importing…</>) : "Import"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Done ──────────────────────────────────────────────────────────
function DoneStep({
  imported, duplicateGroups, templateSaved, onAnother, onViewTxns,
}: {
  imported: number;
  duplicateGroups: number;
  templateSaved: boolean;
  onAnother: () => void;
  onViewTxns: () => void;
}) {
  return (
    <div className="text-center py-6">
      <CheckCircle2 size={36} className="text-good mx-auto mb-2" />
      <div className="text-lg font-semibold text-slate-100">
        Imported {imported.toLocaleString()} transaction{imported === 1 ? "" : "s"}
      </div>
      <div className="text-sm text-slate-400 mt-1">
        {duplicateGroups > 0 ? `${duplicateGroups} duplicate group${duplicateGroups === 1 ? "" : "s"} flagged for review.` : "No duplicates found."}
        {templateSaved ? " Mapping template saved." : ""}
      </div>
      <div className="flex items-center justify-center gap-2 mt-5">
        <button type="button" onClick={onAnother} className="btn-ghost text-sm">Import another</button>
        <button type="button" onClick={onViewTxns} className="btn-primary text-sm">View transactions →</button>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

// The server-side guess uses field keys like `date`, `amount`, `description`,
// `vendor`, `currency`, `txnId`, `source`, `category`, `notes`. The wizard's
// FieldKey vocabulary overlaps but has extras (income/expense/balance) for
// split-amount files. Map the overlap; ignore unknown server keys.
function mapServerFieldToClient(serverField: string): FieldKey | null {
  const m: Record<string, FieldKey> = {
    date: "date",
    amount: "amount",
    description: "description",
    vendor: "vendor",
    currency: "currency",
    txnId: "txnId",
    category: "category",
    notes: "notes",
    balance: "balance",
  };
  return m[serverField] ?? null;
}

// Convert wizard-side per-header assignments into the server's ColumnMapping
// shape (one header per canonical field). Income + Expense get folded into a
// signed amount column the user can see in Validate.
function toServerMapping(a: Assignments): Record<string, string | null> {
  const result: Record<string, string | null> = {
    date: null, amount: null, description: null, currency: null,
    txnId: null, source: null, category: null, notes: null, vendor: null,
  };
  for (const [header, field] of Object.entries(a)) {
    if (field === "ignore") continue;
    if (field === "income" || field === "expense") {
      // Handled by synthesizing a combined amount column on the rows before
      // posting — see toServerRowsForIncomeExpense in the commit caller.
      continue;
    }
    if (field === "balance") continue;
    if (field in result) result[field] = header;
  }
  return result;
}

function sameHeaderSet(mapping: Record<string, string | null>, headers: string[]): boolean {
  const mapped = Object.values(mapping).filter((h): h is string => !!h);
  if (mapped.length === 0) return false;
  return mapped.every((h) => headers.includes(h));
}

function findConfidenceForHeader(
  confidence: PreviewResponse["confidence"],
  header: string,
): { confidence: number } | null {
  for (const v of Object.values(confidence)) {
    if (v.header === header) return { confidence: v.confidence };
  }
  return null;
}

function computeValidation(a: Assignments, preview: PreviewResponse | null): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!preview) return { ok: false, errors, warnings };

  const values = Object.values(a);
  const dateCount   = values.filter((v) => v === "date").length;
  const descCount   = values.filter((v) => v === "description" || v === "vendor").length;
  const amountCount = values.filter((v) => v === "amount").length;
  const incomeCount = values.filter((v) => v === "income").length;
  const expenseCount = values.filter((v) => v === "expense").length;

  if (dateCount === 0)   errors.push("A Transaction date column is required.");
  if (dateCount > 1)     errors.push("Transaction date is mapped to more than one column.");
  if (descCount === 0)   errors.push("A Description or Vendor column is required.");
  if (amountCount > 1)   errors.push("Amount is mapped to more than one column.");

  const amountSig = amountCount > 0 || (incomeCount > 0 && expenseCount > 0) || (incomeCount + expenseCount > 0);
  if (!amountSig) errors.push("Map an Amount column, OR map both Income and Expense columns.");

  // Soft warnings.
  if (incomeCount > 0 && expenseCount === 0 && amountCount === 0) {
    warnings.push("Only Income mapped — every row will be imported as income.");
  }
  if (expenseCount > 0 && incomeCount === 0 && amountCount === 0) {
    warnings.push("Only Expense mapped — every row will be imported as expense.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

type DryRunResult = {
  total:   number;
  valid:   number;
  invalid: number;
  issues:  { row: number; message: string }[];
};

function dryRun(rows: Record<string, unknown>[], a: Assignments, defaultCcy: string): DryRunResult {
  void defaultCcy;
  // Pick the columns we care about for validation: date + amount (single or split).
  const dateHeader     = headerFor(a, "date");
  const amountHeader   = headerFor(a, "amount");
  const incomeHeader   = headerFor(a, "income");
  const expenseHeader  = headerFor(a, "expense");
  const descHeader     = headerFor(a, "description") ?? headerFor(a, "vendor");

  const issues: DryRunResult["issues"] = [];
  let valid = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const probs: string[] = [];
    if (dateHeader) {
      const v = r[dateHeader];
      if (v == null || v === "" || !looksLikeDate(v)) probs.push("date couldn't be parsed");
    }
    let hasAmount = false;
    if (amountHeader) {
      const v = r[amountHeader];
      const n = parseNum(v);
      if (Number.isFinite(n) && n !== 0) hasAmount = true;
    }
    if (!hasAmount && (incomeHeader || expenseHeader)) {
      const inc = incomeHeader  ? parseNum(r[incomeHeader])  : 0;
      const exp = expenseHeader ? parseNum(r[expenseHeader]) : 0;
      if (Math.abs(inc) + Math.abs(exp) > 0) hasAmount = true;
    }
    if (!hasAmount) probs.push("no amount found");
    if (descHeader) {
      const v = r[descHeader];
      if (v == null || String(v).trim() === "") probs.push("empty description");
    }
    if (probs.length === 0) valid++;
    else issues.push({ row: i, message: probs.join(", ") });
  }
  return { total: rows.length, valid, invalid: rows.length - valid, issues };
}

function headerFor(a: Assignments, field: FieldKey): string | null {
  for (const [h, f] of Object.entries(a)) if (f === field) return h;
  return null;
}

function looksLikeDate(v: unknown): boolean {
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (!Number.isNaN(new Date(s).getTime())) return true;
  return /^\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}$/.test(s);
}

function parseNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/^-/.test(s)) { sign = -1; s = s.slice(1); }
  s = s.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",") && !s.includes(".")) {
    const parts = s.split(",");
    s = parts.length === 2 && parts[1].length <= 2 ? parts.join(".") : s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? sign * n : 0;
}
