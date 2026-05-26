"use client";

// Bank Statement Import Wizard.
//
// Five-step flow for importing transaction-level bank exports:
//   1. Upload        - drag-drop / file picker (.csv, .xls, .xlsx)
//   2. Map columns   - table of detected columns ↔ Tweaxly fields, with
//                      sample values, confidence pills, and "apply saved
//                      template" for repeat imports
//   3. Validate      - counts valid rows, lists rows that can't normalize
//   4. Confirm       - duplicate handling + optional "save template" name
//   5. Done          - summary of imported / flagged-as-duplicate counts
//
// All imports are scoped to the currently active workspace; the wizard
// never asks the user to choose one. Templates are saved per-workspace
// (Prisma model: MappingTemplate, unique on (businessId, name)).
//
// The wizard talks to the existing API surface - no new endpoints other
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
import {
  DATE_FORMATS, type DateFormat, parseDateWithFormat,
  suggestDateFormat, formatDateLong, toIsoDate,
} from "@/lib/dateFormats";

// ─── Field vocabulary ─────────────────────────────────────────────────────
// What the user maps each file column to. "ignore" means the column is
// skipped on import. "amount_combined" is what the parser synthesizes when
// it sees split Debit/Credit columns - shown so the user knows the value
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
  { value: "vendor",      label: "Vendor",                 group: "Required" },
  { value: "amount",      label: "Amount (single column)", group: "Amount" },
  { value: "income",      label: "Income",                 group: "Amount" },
  { value: "expense",     label: "Outcome",                group: "Amount" },
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
type Step = "upload" | "map" | "dateFormat" | "validate" | "confirm" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload",     label: "Upload" },
  { id: "map",        label: "Map columns" },
  { id: "dateFormat", label: "Date format" },
  { id: "validate",   label: "Validate" },
  { id: "confirm",    label: "Confirm" },
  { id: "done",       label: "Done" },
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

// Optional Phase-1 Financial Sources context. When set, the wizard tags
// the created UploadBatch with this source + period, and (if replace
// targets are listed) atomically wipes those old batches as part of
// the commit. When omitted, the wizard behaves like the older bank
// import flow with no source/period attached.
export interface WizardContext {
  sourceId:        string;
  sourceName:      string;
  sourceCurrency:  string;
  periodStart:     string; // YYYY-MM
  periodEnd:       string; // YYYY-MM (= periodStart for single-month uploads)
  replaceBatchIds: string[];
}

export default function BankImportWizard({
  defaultCurrency,
  context,
  onAfterDone,
}: {
  defaultCurrency: string;
  context?: WizardContext;
  onAfterDone?: () => void;
}) {
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
  // null = not chosen yet (auto-suggested on first entry to the dateFormat
  // step). Once the user picks, we hold their choice through commit even
  // if they go back and tweak the column mapping.
  const [dateFormat, setDateFormat] = useState<DateFormat | null>(null);
  // Row indices the user explicitly chose to skip on the Validate step.
  // Lifted up so the decision survives back-navigation. Reset by reset()
  // (new file) and whenever the user goes back to Map and changes things.
  const [skipRows, setSkipRows] = useState<Set<number>>(new Set());

  // Saved templates for this workspace (auto-suggest on second+ uploads).
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Step 4 confirm state
  const [saveAsName, setSaveAsName] = useState<string>("");
  const [importing, setImporting]   = useState(false);
  const [, startTransition] = useTransition();

  // Step 5 done state
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicateGroups: number;
    settlementsApplied: number;
    settlementSamples: { source: string; ym: string; amount: number; kind?: string }[];
    settlementBreakdown?: { cardCount: number; paypalCount: number; transferCount: number; providerCount: number };
  } | null>(null);

  // Pull saved templates once - used in the Map step.
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
    setDateFormat(null);
    setSkipRows(new Set());
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
      // Skip the meta key we stash the date format under.
      if (field === "__dateFormat__") continue;
      if (typeof header !== "string") continue;
      if (!headers.includes(header)) continue;
      const mapped = mapServerFieldToClient(field);
      if (mapped) next[header] = mapped;
    }
    setAssignments(next);
    setAppliedTemplateId(t.id);
    // Restore the saved date format so the user doesn't have to re-pick
    // it on every monthly upload from the same bank.
    const savedFmt = t.mapping["__dateFormat__"];
    if (typeof savedFmt === "string" && (DATE_FORMATS as readonly string[]).includes(savedFmt)) {
      setDateFormat(savedFmt as DateFormat);
    }
  }

  // ── Validation derived from current assignments ──────────────────────
  const validation = useMemo(() => computeValidation(assignments, preview), [assignments, preview]);

  return (
    <div className="card mb-6">
      <div className="font-medium mb-1">Source statement import</div>
      <div className="text-xs text-slate-400 mb-4">
        Upload a CSV, XLS, or XLSX export from any source - bank, credit card,
        PayPal, Stripe, and more. The wizard auto-detects the columns; you
        confirm the mapping and we handle currency conversion, categorization,
        and duplicate detection.
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
          onNext={() => setStep("dateFormat")}
        />
      )}

      {step === "dateFormat" && preview && (
        <DateFormatStep
          preview={preview}
          assignments={assignments}
          dateFormat={dateFormat}
          setDateFormat={setDateFormat}
          onBack={() => setStep("map")}
          onNext={() => setStep("validate")}
        />
      )}

      {step === "validate" && preview && (
        <ValidateStep
          preview={preview}
          assignments={assignments}
          defaultCcy={defaultCcy}
          dateFormat={dateFormat}
          skipRows={skipRows}
          setSkipRows={setSkipRows}
          onBack={() => { setSkipRows(new Set()); setStep("dateFormat"); }}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && preview && (
        <ConfirmStep
          preview={preview}
          assignments={assignments}
          skipRows={skipRows}
          replaceCount={context?.replaceBatchIds.length ?? 0}
          saveAsName={saveAsName}
          setSaveAsName={setSaveAsName}
          importing={importing}
          onBack={() => setStep("validate")}
          onImport={async () => {
            setImporting(true);
            try {
              let mapping = toServerMapping(assignments);
              // Drop any rows the user explicitly chose to skip on the
              // Validate step. We filter *before* the date/amount synthesis
              // passes so index-based skipRows still lines up with the
              // remaining payload.
              let rows: Record<string, unknown>[] = preview.rows.filter((_, i) => !skipRows.has(i));

              // Rewrite the date column to ISO YYYY-MM-DD using the user-
              // confirmed format. Deterministic - never relies on
              // browser/locale auto-parsing. Cells the format can't parse
              // pass through untouched so per-row validation flags them.
              const dateH = headerFor(assignments, "date");
              if (dateH && dateFormat) {
                rows = rows.map((r) => ({ ...r, [dateH]: toIsoDate(r[dateH], dateFormat) }));
              }

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

              // Stash the date format inside the mapping payload so it
              // round-trips when the user opts to save this as a template.
              // The server stores `mapping` as opaque JSON; downstream
              // callers ignore unknown keys.
              const mappingWithMeta: Record<string, unknown> = { ...mapping };
              if (dateFormat) mappingWithMeta["__dateFormat__"] = dateFormat;
              const res = await fetch("/api/upload/commit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  source: "bank",
                  filename: preview.filename,
                  rows,
                  mapping: mappingWithMeta,
                  saveTemplateName: saveAsName.trim() || null,
                  // Phase 1 Financial Sources fields - passed through only
                  // when the guided wrapper supplied them.
                  financialSourceId: context?.sourceId ?? null,
                  periodStart:       context?.periodStart ?? null,
                  periodEnd:         context?.periodEnd ?? null,
                  replaceBatchIds:   context?.replaceBatchIds ?? [],
                }),
              });
              if (!res.ok) {
                const txt = await res.text();
                let msg = txt || `Import failed (${res.status})`;
                try { msg = JSON.parse(txt).error ?? msg; } catch { /* keep raw */ }
                throw new Error(msg);
              }
              const data = await res.json();
              setImportResult({
                imported:            data.imported ?? 0,
                duplicateGroups:     data.duplicateGroups ?? 0,
                settlementsApplied:  data.settlementsApplied ?? 0,
                settlementSamples:   data.settlementSamples ?? [],
                settlementBreakdown: data.settlementBreakdown,
              });
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
          settlementsApplied={importResult.settlementsApplied}
          settlementSamples={importResult.settlementSamples}
          settlementBreakdown={importResult.settlementBreakdown}
          templateSaved={!!saveAsName.trim()}
          onAnother={() => { reset(); onAfterDone?.(); }}
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
          {uploading ? "Reading file…" : "Drop a source statement here, or click to browse"}
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

      {/* Optional: download the Tweaxly template. Used to be its own
          upload mode but it makes more sense as a "preparing your file"
          aid here - the user can either drop their raw source export
          (mapping wizard handles it) or grab the template, fill it in,
          and skip the mapping step. */}
      <div className="mt-4 rounded-md border border-line/60 bg-ink-900/30 px-3 py-2.5 flex items-start gap-3 flex-wrap">
        <div className="text-xs text-slate-400 flex-1 min-w-[240px]">
          <span className="font-medium text-slate-200">Want to skip the mapping step?</span> Download our pre-formatted CSV template (Date · Description · Amount), fill it in, then drop it above.
        </div>
        <a
          href="/templates/tweaxly-transactions-template.csv"
          download
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-accent/40 text-accent hover:bg-accent-soft/30 transition inline-flex items-center gap-1.5 shrink-0"
        >
          Download Tweaxly template
        </a>
      </div>

      {templateCount > 0 ? (
        <div className="mt-4 text-xs text-slate-400">
          {templateCount} saved {templateCount === 1 ? "mapping" : "mappings"} available - if your file's
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
                      <span className="text-[11px] text-slate-600"> - </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Default currency picker - only when no currency column is mapped */}
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

// ─── Step 3: Date format ──────────────────────────────────────────────────
// Sits between Map and Validate. The user picks the format; we never guess
// silently. Sample values come from the mapped date column, and each one
// is shown next to a long-form preview ("3 April 2026") so the choice is
// visually obvious.
function DateFormatStep({
  preview, assignments, dateFormat, setDateFormat, onBack, onNext,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  dateFormat: DateFormat | null;
  setDateFormat: (f: DateFormat) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const dateHeader = headerFor(assignments, "date");

  // Pull up to 10 non-empty distinct date-shaped samples. Many bank
  // exports include a leftover header/title row (e.g. "Value Date" or
  // its Hebrew "תאריך ערך" equivalent) mid-data; we skip those at the
  // gate so they don't block Continue. The commit step skips rows whose
  // date doesn't parse anyway, so dropping them here is purely a UX win.
  const samples = useMemo<unknown[]>(() => {
    if (!dateHeader) return [];
    const seen = new Set<string>();
    const out: unknown[] = [];
    for (const r of preview.rows) {
      const v = r[dateHeader];
      if (v == null || v === "") continue;
      if (v instanceof Date) {
        const k = v.toISOString();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      } else {
        const s = String(v).trim();
        if (!s) continue;
        // A real date has ≥4 digit characters (DD + MM + YY at minimum,
        // and most files use 4-digit years). Below that, the cell is
        // almost certainly a header label that leaked into the data.
        const digitCount = (s.match(/\d/g) || []).length;
        if (digitCount < 4) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(v);
      }
      if (out.length >= 10) break;
    }
    return out;
  }, [preview.rows, dateHeader]);

  // Auto-suggest on first entry. Once the user picks, their choice wins
  // even if they navigate back and forth.
  const suggestion = useMemo(() => suggestDateFormat(samples), [samples]);
  useEffect(() => {
    if (dateFormat === null) setDateFormat(suggestion.suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion.suggested]);

  const fmt: DateFormat = dateFormat ?? suggestion.suggested;

  // Validate the current pick against all samples - if anything fails,
  // block Continue and surface the row so the user can switch formats.
  const validation = useMemo(() => {
    const fails: { sample: string; reason: string }[] = [];
    for (const s of samples) {
      const parsed = parseDateWithFormat(s, fmt);
      if (!parsed) {
        const raw = s instanceof Date ? s.toISOString() : String(s);
        // Distinguish "doesn't fit the format" from "impossible date" so the
        // error is actionable.
        const rawParts = raw.split(/[\/\-.]/).map((p) => p.trim());
        const reason =
          rawParts.length !== fmt.split(/[\/\-.]/).length
            ? "doesn't match this format's structure"
            : "produces an impossible date (e.g. day 31 in a 30-day month)";
        fails.push({ sample: raw, reason });
      }
    }
    return { ok: fails.length === 0, fails };
  }, [samples, fmt]);

  if (!dateHeader) {
    return (
      <div>
        <div className="text-sm text-bad mb-3">
          No date column was mapped. Go back and pick a column for "Transaction date".
        </div>
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-slate-300 mb-3">
        Pick the date format used in <span className="font-medium text-slate-100">{dateHeader}</span>.
        We never guess between DD/MM and MM/DD silently - confirm the format and we'll apply it to every row.
      </div>

      {suggestion.ambiguous ? (
        <div className="card-tight border-warn/40 bg-warn/5 mb-4 flex items-start gap-2">
          <AlertTriangle size={14} className="text-warn shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200 leading-relaxed">
            Some dates can be interpreted in more than one way. Please confirm the correct date format before importing.
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <div>
          <label className="label">Date format</label>
          <select
            className="input"
            value={fmt}
            onChange={(e) => setDateFormat(e.target.value as DateFormat)}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-1">
            Showing {samples.length} unique sample{samples.length === 1 ? "" : "s"} from the file.
          </div>
        </div>

        <div className="rounded-md border border-line overflow-hidden" dir="ltr">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/60 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Original</th>
                <th className="text-left px-3 py-2">Parsed as</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-xs text-slate-500 text-center">
                    No date values found in this column.
                  </td>
                </tr>
              ) : samples.map((s, i) => {
                const raw = s instanceof Date ? s.toISOString().slice(0, 10) : String(s).trim();
                const parsed = parseDateWithFormat(s, fmt);
                return (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-300">{raw}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {parsed ? (
                        <span className="text-good">{formatDateLong(parsed)}</span>
                      ) : (
                        <span className="text-bad inline-flex items-center gap-1">
                          <XIcon size={12} /> invalid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!validation.ok ? (
        <div className="mt-4 space-y-1">
          {validation.fails.slice(0, 5).map((f, i) => (
            <div key={i} className="text-xs text-bad inline-flex items-start gap-1.5">
              <XIcon size={14} className="mt-0.5 shrink-0" />
              <span><span className="font-mono">{f.sample}</span> - {f.reason}</span>
            </div>
          ))}
          {validation.fails.length > 5 ? (
            <div className="text-[11px] text-slate-500">+ {validation.fails.length - 5} more failures</div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-5">
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
        <button
          type="button"
          onClick={onNext}
          disabled={!validation.ok || samples.length === 0}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Validate ──────────────────────────────────────────────────────
// Walk every row with the chosen mapping; surface unparseable rows ONE AT
// A TIME with the row's actual contents so the user can confirm each one
// is either OK to drop ("Skip this row") or worth letting through anyway
// ("Import as-is"). Bulk actions exist for files with many of the same
// kind of error. Continue is blocked until every error has been addressed.
function ValidateStep({
  preview, assignments, defaultCcy, dateFormat,
  skipRows, setSkipRows,
  onBack, onNext,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  defaultCcy: string;
  dateFormat: DateFormat | null;
  skipRows: Set<number>;
  setSkipRows: (s: Set<number>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const result = useMemo(
    () => dryRun(preview.rows, assignments, defaultCcy, dateFormat),
    [preview.rows, assignments, defaultCcy, dateFormat],
  );

  // `addressed` tracks which error rows the user has explicitly resolved
  // (skip OR import-anyway). Lives in local state since it only matters
  // while the user is on this step - the skip set carries forward via
  // skipRows in parent state.
  const [addressed, setAddressed] = useState<Set<number>>(() => new Set(skipRows));

  // If the error set changes (e.g. user went back to Map and remapped),
  // reset to whatever the current skipRows says.
  const errorSignature = result.issues.map((i) => i.row).join(",");
  useEffect(() => {
    setAddressed(new Set(skipRows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorSignature]);

  const errorRows  = result.issues.map((iss) => iss.row);
  const pending    = errorRows.filter((r) => !addressed.has(r));
  const currentRow = pending[0] ?? null;
  const currentIss = currentRow == null ? null : result.issues.find((i) => i.row === currentRow) ?? null;
  const reviewedCount = errorRows.length - pending.length;
  const willImport = result.total - skipRows.size;

  function markSkip(row: number) {
    const nextSkip = new Set(skipRows); nextSkip.add(row); setSkipRows(nextSkip);
    const nextAdd = new Set(addressed); nextAdd.add(row); setAddressed(nextAdd);
  }
  function markImport(row: number) {
    const nextAdd = new Set(addressed); nextAdd.add(row); setAddressed(nextAdd);
  }
  function skipAllPending() {
    const nextSkip = new Set(skipRows); for (const r of pending) nextSkip.add(r); setSkipRows(nextSkip);
    const nextAdd = new Set(addressed); for (const r of pending) nextAdd.add(r); setAddressed(nextAdd);
  }
  function importAllPending() {
    const nextAdd = new Set(addressed); for (const r of pending) nextAdd.add(r); setAddressed(nextAdd);
  }

  const canContinue = pending.length === 0 && willImport > 0;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total rows"   value={result.total.toLocaleString()} />
        <Stat label="Valid rows"   value={result.valid.toLocaleString()} tone="good" />
        <Stat label="Will skip"    value={skipRows.size.toLocaleString()} tone={skipRows.size > 0 ? "warn" : "muted"} />
        <Stat label="To import"    value={willImport.toLocaleString()} tone="good" />
      </div>

      {errorRows.length === 0 ? (
        <div className="rounded-md border border-good/30 bg-good/10 px-4 py-3 text-sm text-good inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> All {result.total} rows parse cleanly with this mapping.
        </div>
      ) : currentIss ? (
        <div className="rounded-md border border-warn/40 bg-warn/5 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="text-sm text-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 mr-2">
                Error {reviewedCount + 1} of {errorRows.length}
              </span>
              Row <span className="font-mono">{currentIss.row + 1}</span> - <span className="text-warn">{currentIss.message}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button type="button" onClick={importAllPending} className="btn-ghost py-1 text-xs">Import all anyway</button>
              <button type="button" onClick={skipAllPending}   className="btn-ghost py-1 text-xs">Skip all</button>
            </div>
          </div>
          <RowPreview row={preview.rows[currentIss.row]} assignments={assignments} />
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => markSkip(currentIss.row)}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-warn/50 text-warn hover:bg-warn/10 transition"
            >
              Skip this row
            </button>
            <button
              type="button"
              onClick={() => markImport(currentIss.row)}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-line text-slate-200 hover:bg-ink-700 transition"
            >
              Import as-is
            </button>
            <span className="text-[11px] text-slate-500 ml-auto">
              Import as-is keeps the row in the file. If the server can't normalize it either, it's skipped silently.
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-good/30 bg-good/10 px-4 py-3 text-sm text-good">
          <CheckCircle2 size={16} className="inline mr-1.5 -mt-0.5" />
          All {errorRows.length} errors reviewed.
          {skipRows.size > 0 ? ` ${skipRows.size} row${skipRows.size === 1 ? "" : "s"} will be skipped on import.` : ""}
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="btn-primary text-sm disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// Compact preview of one row's mapped fields. Shows just what the user
// mapped (so 100-column files don't dump every cell), plus the row index.
function RowPreview({ row, assignments }: { row: Record<string, unknown>; assignments: Assignments }) {
  const mapped = Object.entries(assignments).filter(([, f]) => f !== "ignore");
  return (
    <div className="rounded-md border border-line/60 bg-ink-900/40 px-3 py-2">
      <div className="space-y-1 text-xs">
        {mapped.length === 0 ? (
          <div className="text-slate-500 italic">No columns are mapped - every cell will be ignored.</div>
        ) : mapped.map(([header, field]) => (
          <div key={header} className="flex items-baseline gap-2">
            <span className="text-slate-500 w-28 shrink-0">{labelForField(field)}</span>
            <span className="text-slate-200 font-mono break-all" dir="auto">
              {formatCell(row[header])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelForField(f: FieldKey): string {
  return FIELD_OPTIONS.find((o) => o.value === f)?.label ?? f;
}

function formatCell(v: unknown): string {
  if (v == null || v === "") return " - ";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
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
// Last stop before the actual /api/upload/commit POST. Shows a
// reconciliation preview so the owner sees what's about to land:
// import count, income/expense totals from the mapped columns, skipped-
// row count, and a note about settlement + duplicate detection running
// post-import.
function ConfirmStep({
  preview, assignments, skipRows, replaceCount,
  saveAsName, setSaveAsName, importing, onBack, onImport,
}: {
  preview: PreviewResponse;
  assignments: Assignments;
  skipRows: Set<number>;
  replaceCount: number;
  saveAsName: string;
  setSaveAsName: (s: string) => void;
  importing: boolean;
  onBack: () => void;
  onImport: () => void;
}) {
  const summary = useMemo(
    () => buildReconciliation(preview.rows, assignments, skipRows),
    [preview.rows, assignments, skipRows],
  );

  return (
    <div>
      {/* Reconciliation preview - totals + counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="To import"    value={summary.toImport.toLocaleString()} tone="good" />
        <Stat label="Skipped"      value={summary.skipped.toLocaleString()} tone={summary.skipped > 0 ? "warn" : "muted"} />
        <Stat label="Income total" value={fmtAmt(summary.incomeTotal)} tone={summary.incomeTotal > 0 ? "good" : "muted"} />
        <Stat label="Outcome total" value={fmtAmt(summary.expenseTotal)} tone={summary.expenseTotal > 0 ? "warn" : "muted"} />
      </div>

      <div className="card-tight border-line/60 mb-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">What happens after you click Import</div>
        <ul className="text-xs text-slate-300 space-y-1.5">
          {replaceCount > 0 ? (
            <li className="text-bad inline-flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-medium">{replaceCount} previous import{replaceCount === 1 ? "" : "s"} will be replaced.</span> Old transactions are deleted; the import history stays for audit.
              </span>
            </li>
          ) : null}
          <li className="inline-flex items-start gap-1.5">
            <span className="text-good">✓</span>
            <span>
              <span className="font-medium">{summary.toImport.toLocaleString()}</span> transaction{summary.toImport === 1 ? "" : "s"} from <span className="font-medium">{preview.filename}</span> will be created with their original dates and currencies preserved.
            </span>
          </li>
          <li className="inline-flex items-start gap-1.5">
            <span className="text-accent">⇆</span>
            <span>
              Credit-card / PayPal <span className="font-medium">settlements</span> are auto-detected (matched against your other sources' monthly totals) and excluded from P&amp;L - the detailed lines count instead.
            </span>
          </li>
          <li className="inline-flex items-start gap-1.5">
            <span className="text-warn">⚠</span>
            <span>
              Likely <span className="font-medium">duplicates</span> (same date + amount + vendor across sources) are flagged for review on the Data Log. They're never silently dropped.
            </span>
          </li>
        </ul>
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
          {importing ? (<><Loader2 size={14} className="animate-spin" /> Importing…</>) : `Import ${summary.toImport.toLocaleString()} transaction${summary.toImport === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}

// Client-side reconciliation summary used by the Confirm step. Mirrors
// the same row-walk as dryRun() but reports totals + counts rather than
// per-row issues. Lives client-side so the user doesn't pay another
// network round-trip just to see "what am I about to import".
function buildReconciliation(
  rows: Record<string, unknown>[],
  a: Assignments,
  skipRows: Set<number>,
): { toImport: number; skipped: number; incomeTotal: number; expenseTotal: number } {
  const amountH  = headerFor(a, "amount");
  const incomeH  = headerFor(a, "income");
  const expenseH = headerFor(a, "expense");
  let toImport = 0;
  let skipped  = 0;
  let income   = 0;
  let expense  = 0;
  for (let i = 0; i < rows.length; i++) {
    if (skipRows.has(i)) { skipped++; continue; }
    toImport++;
    const r = rows[i];
    if (amountH) {
      const n = parseNum(r[amountH]);
      if (n > 0) income  += n;
      else       expense += Math.abs(n);
    } else if (incomeH || expenseH) {
      const inc = incomeH  ? Math.abs(parseNum(r[incomeH]))  : 0;
      const exp = expenseH ? Math.abs(parseNum(r[expenseH])) : 0;
      income  += inc;
      expense += exp;
    }
  }
  return { toImport, skipped, incomeTotal: income, expenseTotal: expense };
}

function fmtAmt(n: number): string {
  if (!Number.isFinite(n)) return " - ";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Step 5: Done ──────────────────────────────────────────────────────────
function DoneStep({
  imported, duplicateGroups, settlementsApplied, settlementSamples, settlementBreakdown,
  templateSaved, onAnother, onViewTxns,
}: {
  imported: number;
  duplicateGroups: number;
  settlementsApplied: number;
  settlementSamples: { source: string; ym: string; amount: number; kind?: string }[];
  settlementBreakdown?: { cardCount: number; paypalCount: number; transferCount: number; providerCount: number };
  templateSaved: boolean;
  onAnother: () => void;
  onViewTxns: () => void;
}) {
  const breakdown: { label: string; count: number }[] = settlementBreakdown
    ? [
        { label: "credit-card",       count: settlementBreakdown.cardCount },
        { label: "PayPal",            count: settlementBreakdown.paypalCount },
        { label: "bank transfer",     count: settlementBreakdown.transferCount },
        { label: "provider payout",   count: settlementBreakdown.providerCount },
      ].filter((b) => b.count > 0)
    : [];
  return (
    <div>
      <div className="text-center py-4">
        <CheckCircle2 size={36} className="text-good mx-auto mb-2" />
        <div className="text-lg font-semibold text-slate-100">
          Imported {imported.toLocaleString()} transaction{imported === 1 ? "" : "s"}
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {duplicateGroups > 0 ? `${duplicateGroups} duplicate group${duplicateGroups === 1 ? "" : "s"} flagged for review.` : "No duplicates found."}
          {templateSaved ? " Mapping template saved." : ""}
        </div>
      </div>

      {settlementsApplied > 0 ? (
        <div className="card-tight border-good/40 bg-good/5 my-4">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 size={16} className="text-good shrink-0 mt-0.5" />
            <div className="text-sm text-slate-200">
              <span className="font-medium">
                {settlementsApplied} auto-classified transaction{settlementsApplied === 1 ? "" : "s"} excluded from P&amp;L.
              </span>
              {breakdown.length > 0 ? (
                <div className="text-xs text-slate-400 mt-0.5">
                  {breakdown.map((b, i) => (
                    <span key={b.label}>
                      {i > 0 ? " · " : ""}
                      <span className="text-slate-200">{b.count}</span> {b.label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="text-xs text-slate-400 mt-1">
                Card / PayPal payments match the detailed lines instead. Bank-to-bank transfers are internal moves, not P&amp;L. Provider payouts (Stripe, Square…) are the bank reflection of revenue already recorded on the provider side. Undo any single match from the Transactions page.
              </div>
            </div>
          </div>
          {settlementSamples.length > 0 ? (
            <ul className="text-xs text-slate-400 space-y-0.5 mt-2 pl-6">
              {settlementSamples.map((s, i) => (
                <li key={i} className="list-disc">
                  {fmtYmDone(s.ym)} · {labelForKind(s.kind)} · {s.source} · {s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </li>
              ))}
              {settlementsApplied > settlementSamples.length ? (
                <li className="list-none text-slate-500">+ {settlementsApplied - settlementSamples.length} more</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-2 mt-5">
        <button type="button" onClick={onAnother} className="btn-ghost text-sm">Import another</button>
        <button type="button" onClick={onViewTxns} className="btn-primary text-sm">View transactions →</button>
      </div>
    </div>
  );
}

function fmtYmDone(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function labelForKind(kind: string | undefined): string {
  switch (kind) {
    case "credit_card": return "card payment";
    case "paypal":      return "PayPal";
    case "transfer":    return "bank transfer";
    case "provider":    return "provider payout";
    default:            return "settlement";
  }
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
      // posting - see toServerRowsForIncomeExpense in the commit caller.
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
  // Don't allow mixing - a single signed Amount column shouldn't coexist
  // with separate Income/Outcome columns; the wizard wouldn't know which
  // sign to honor for each row.
  if (amountCount > 0 && (incomeCount > 0 || expenseCount > 0)) {
    errors.push("Pick either a single Amount column OR Income/Outcome columns - not both.");
  }

  const amountSig = amountCount > 0 || (incomeCount + expenseCount > 0);
  if (!amountSig) errors.push("Map an Amount column, OR an Income/Outcome column.");

  // Soft warnings.
  if (incomeCount > 0 && expenseCount === 0 && amountCount === 0) {
    warnings.push("Only Income mapped - every row will be imported as positive (income).");
  }
  if (expenseCount > 0 && incomeCount === 0 && amountCount === 0) {
    warnings.push("Only Outcome mapped - every row will be imported as negative (outcome), regardless of how it appears in the file.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

type DryRunResult = {
  total:   number;
  valid:   number;
  invalid: number;
  issues:  { row: number; message: string }[];
};

function dryRun(
  rows: Record<string, unknown>[],
  a: Assignments,
  defaultCcy: string,
  dateFormat: DateFormat | null,
): DryRunResult {
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
      // With a user-confirmed format, use the deterministic parser. Without
      // one (shouldn't happen - the wizard blocks Continue) fall back to
      // the loose heuristic so we still produce a useful preview.
      const parsedOk = dateFormat
        ? parseDateWithFormat(v, dateFormat) !== null
        : looksLikeDate(v);
      if (v == null || v === "" || !parsedOk) probs.push("date couldn't be parsed");
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
