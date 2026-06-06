"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { COUNTRIES, CURRENCIES } from "@/lib/financialReview/context";

// Upload surface for a new Financial Review. Drag & drop or browse,
// multiple files (PDF / XLSX / CSV).
//
// Files are uploaded straight from the browser to Vercel Blob storage
// (which bypasses the 4.5 MB serverless request-body limit, so large
// scanned PDFs work), then we POST the blob references to the API, which
// downloads them, extracts the text and generates the review
// synchronously. While we wait we cycle plain-English status messages so
// the 30-90s feels alive.

const ACCEPT = ".pdf,.xlsx,.xls,.csv";
// Per-file ceiling - matches the upload token + review route guards.
const MAX_BYTES = 20 * 1024 * 1024;
// Files above this use multipart upload (parallel parts + retries).
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;
const STAGES = [
  "Reading report",
  "Extracting financial data",
  "Identifying business trends",
  "Generating recommendations",
  "Building review",
];

function isSupported(name: string) {
  return /\.(pdf|xlsx|xls|csv)$/i.test(name);
}

export default function UploadCard({
  creditCost,
  creditBalance,
}: {
  creditCost: number;
  creditBalance: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [notes, setNotes] = useState("");

  // Advance the status message while processing (stops at the last one).
  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const id = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 12000);
    return () => clearInterval(id);
  }, [busy]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !isSupported(f.name));
    if (bad) {
      setError(`"${bad.name}" is not supported. Upload a PDF, XLSX or CSV.`);
      return;
    }
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is too large (max 20 MB).`);
      return;
    }
    setError(null);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const f of incoming) {
        if (!seen.has(f.name + f.size)) merged.push(f);
      }
      return merged.slice(0, 8);
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 1) Upload each file straight to Blob storage (bypasses the 4.5 MB
      //    function body limit). The route mints a constrained token.
      const blobs: { url: string; pathname: string; name: string }[] = [];
      for (const f of files) {
        const result = await upload(f.name, f, {
          access: "private",
          handleUploadUrl: "/api/financial-review/blob-upload",
          multipart: f.size > MULTIPART_THRESHOLD,
        });
        blobs.push({ url: result.url, pathname: result.pathname, name: f.name });
      }

      // 2) Hand the references to the review API for extraction + analysis.
      const res = await fetch("/api/financial-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobs,
          financialYear: /^\d{4}$/.test(year.trim()) ? year.trim() : undefined,
          reportCountry: country || undefined,
          reportCurrency: currency || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        const need = data?.cost ?? creditCost;
        const have = data?.balance ?? creditBalance;
        setError(
          `Not enough AI credits. This review needs ${need} credit${need === 1 ? "" : "s"} and you have ${have}. Add credits or upgrade your plan in Settings.`,
        );
        setBusy(false);
        return;
      }
      if (!res.ok && res.status !== 502) {
        throw new Error(data?.error || "Upload failed. Please try again.");
      }
      // 201 complete OR 502 failed both return an id -> open the review,
      // which shows either the result or a failed state with retry.
      if (data?.id) {
        router.push(`/financial-review/${data.id}`);
        // Re-fetch server components so the sidebar AI-credits balance
        // reflects the debit immediately (no manual refresh needed).
        router.refresh();
        return;
      }
      throw new Error(data?.error || "Something went wrong. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-center">
        <Loader2 size={28} className="animate-spin text-accent" />
        <div className="t-card mt-4">{STAGES[stage]}…</div>
        <div className="t-meta mt-2 max-w-md text-slate-400">
          Analyzing your report. This usually takes 30-90 seconds - please keep this tab open. If a file is a scanned PDF, we read it with AI vision, which can take a little longer.
        </div>
        <div className="mt-5 flex gap-1.5">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${i <= stage ? "bg-accent" : "bg-ink-700"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? "border-accent bg-accent-soft/40" : "border-line hover:border-accent/60 hover:bg-ink-800/60"
        }`}
      >
        <UploadCloud size={28} className="text-accent" />
        <div className="t-card mt-3">Upload a financial report</div>
        <div className="t-meta mt-1.5 text-slate-400">
          Drag &amp; drop, or click to browse. PDF, XLSX or CSV, up to 20 MB each. You can add several related files.
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <p className="t-meta mt-2.5 text-slate-500">
        Tip: upload the original, text-based PDF exported from your accounting software when you can. Scanned PDFs are supported, but they are read with AI vision - slower and a little less precise.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="fr-country">Reporting country</label>
          <select
            id="fr-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="input"
          >
            <option value="">Auto-detect</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fr-currency">Reporting currency</label>
          <select
            id="fr-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            <option value="">Auto-detect</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fr-year">Financial year</label>
          <input
            id="fr-year"
            inputMode="numeric"
            placeholder="Auto-detect"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            className="input"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="label" htmlFor="fr-notes">Notes (optional)</label>
        <input
          id="fr-notes"
          placeholder="e.g. Final audited version from the CPA"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
        />
      </div>

      <p className="t-meta mt-2 text-slate-500">
        Country and currency are used only to read your report correctly - terminology, language and local conventions. They are never used to recalculate your numbers; the statement is always the source of truth.
      </p>

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={f.name + f.size} className="flex items-center gap-3 rounded-md border border-line bg-ink-800/60 px-3 py-2">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <span className="flex-1 truncate text-sm text-slate-200">{f.name}</span>
              <span className="t-meta text-slate-500">{(f.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="rounded p-1 text-slate-400 hover:bg-ink-700 hover:text-slate-200"
                aria-label={`Remove ${f.name}`}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="t-meta text-slate-500">
          {files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} ready` : "No files selected"}
          {" · "}
          <span className={creditBalance < creditCost ? "text-warn" : ""}>
            Uses {creditCost} AI credit{creditCost === 1 ? "" : "s"} · you have {creditBalance}
          </span>
        </span>
        <button
          type="button"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={files.length === 0}
          onClick={submit}
        >
          Generate review · {creditCost} credits
        </button>
      </div>
    </div>
  );
}
