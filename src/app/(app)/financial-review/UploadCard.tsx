"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";

// Upload surface for a new Financial Review. Drag & drop or browse,
// multiple files (PDF / XLSX / CSV), then POST to the API which extracts
// the text and generates the review synchronously. While we wait we
// cycle plain-English status messages so the 30-90s feels alive.

const ACCEPT = ".pdf,.xlsx,.xls,.csv";
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

export default function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await fetch("/api/financial-review", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 502) {
        throw new Error(data?.error || "Upload failed. Please try again.");
      }
      // 201 complete OR 502 failed both return an id -> open the review,
      // which shows either the result or a failed state with retry.
      if (data?.id) {
        router.push(`/financial-review/${data.id}`);
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
        <div className="t-meta mt-2 text-slate-400">
          Analyzing your report. This usually takes 30-90 seconds - please keep this tab open.
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
          Drag &amp; drop, or click to browse. PDF, XLSX or CSV. You can add several related files.
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="t-meta text-slate-500">
          {files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} ready` : "No files selected"}
        </span>
        <button
          type="button"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={files.length === 0}
          onClick={submit}
        >
          Generate review
        </button>
      </div>
    </div>
  );
}
