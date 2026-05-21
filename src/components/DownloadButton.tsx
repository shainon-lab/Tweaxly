"use client";

// Reusable download / export button for every report screen.
//
// Pattern:
//   <DownloadButton payload={...} />
//
// Where `payload` is the ExportPayload the page builds from the same
// in-memory data that drives the on-screen render. Client-side
// generation guarantees the export exactly matches what the user
// sees - no risk of an export endpoint and the UI drifting.
//
// Three formats:
//   • CSV  - raw rows, lightweight, opens in Excel/Sheets
//   • XLSX - full workbook with formatting, totals, frozen header
//   • PDF  - via window.print() with print-friendly CSS in
//            globals.css; the user picks "Save as PDF" in the OS
//            print dialog. Server-side PDF generation is documented
//            as a follow-up.

import { useEffect, useRef, useState } from "react";
import type { ExportPayload } from "@/lib/exporters/types";

interface Props {
  payload?: ExportPayload | null;   // null/undefined when the report is empty
  // Optional override of the "no data" tooltip on the disabled button.
  emptyMessage?: string;
  // Plan gate. When false, the button is replaced by a small upgrade
  // CTA - export is a Pro/Business feature in the freemium model.
  // Default true so existing callers don't have to opt in.
  entitled?: boolean;
  // Optional override of the upgrade-CTA label / href when locked.
  lockedLabel?: string;
  lockedHref?:  string;
}

export default function DownloadButton({
  payload, emptyMessage,
  entitled = true,
  lockedLabel = "Upgrade to export",
  lockedHref  = "/settings/billing",
}: Props) {
  // Plan-gate first: when the workspace's plan doesn't include
  // exports we replace the button entirely with an upgrade CTA so
  // the user can't get to the dropdown at all. No 402 needed because
  // the whole export pipeline is client-side (xlsx/csv built in the
  // browser, PDF via window.print).
  if (!entitled) {
    return (
      <a
        href={lockedHref}
        className="text-sm inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-accent/40 bg-accent-soft/30 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
        title="Excel / CSV / PDF export is available on Pro and Business plans"
      >
        <LockGlyph />
        {lockedLabel}
      </a>
    );
  }
  const [open, setOpen]       = useState(false);
  const [busy, setBusy]       = useState<"csv" | "xlsx" | "pdf" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const wrapRef               = useRef<HTMLDivElement>(null);

  const isEmpty =
    !payload || payload.sections.every((s) => s.rows.length === 0);

  // Close on outside click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function exportCsv() {
    if (!payload) return;
    setError(null);
    setBusy("csv");
    try {
      const { csvBlob } = await import("@/lib/exporters/csv");
      const { downloadBlob } = await import("@/lib/exporters/download");
      downloadBlob(csvBlob(payload), payload.filename, "csv");
    } catch (e) {
      console.error("CSV export failed:", e);
      setError("We couldn't generate the file. Please try again.");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function exportXlsx() {
    if (!payload) return;
    setError(null);
    setBusy("xlsx");
    try {
      const { buildXlsxBlob } = await import("@/lib/exporters/xlsx");
      const { downloadBlob } = await import("@/lib/exporters/download");
      const blob = await buildXlsxBlob(payload);
      downloadBlob(blob, payload.filename, "xlsx");
    } catch (e) {
      console.error("XLSX export failed:", e);
      setError("We couldn't generate the file. Please try again.");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  function exportPdf() {
    // MVP: trigger the browser's native print dialog. The print CSS
    // in globals.css strips the sidebar / header chrome so what
    // prints is the report body + branding. Users select "Save as
    // PDF" from the OS print dialog.
    setError(null);
    setBusy("pdf");
    try {
      document.body.setAttribute("data-printing", "report");
      // Small delay so the data attribute settles before print.
      requestAnimationFrame(() => {
        window.print();
        // Clean up after the dialog returns (works for both Save and Cancel).
        setTimeout(() => {
          document.body.removeAttribute("data-printing");
          setBusy(null);
        }, 200);
      });
    } catch (e) {
      console.error("PDF export failed:", e);
      setError("We couldn't generate the file. Please try again.");
      setBusy(null);
    }
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => isEmpty ? setError(emptyMessage ?? "No data available to download for the selected filters.") : setOpen((v) => !v)}
        disabled={!!busy}
        aria-haspopup="menu"
        aria-expanded={open}
        title={isEmpty ? (emptyMessage ?? "No data available to download for the selected filters.") : undefined}
      >
        {busy ? (
          <>
            <Spinner /> Preparing…
          </>
        ) : (
          <>
            <DownloadGlyph />
            Download
          </>
        )}
      </button>

      {open && !isEmpty ? (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 rounded-lg border border-line bg-ink-900 shadow-2xl shadow-black/50 z-30 overflow-hidden"
        >
          <MenuItem label="Excel (.xlsx)" onClick={() => void exportXlsx()} />
          <MenuItem label="CSV (.csv)"   onClick={() => void exportCsv()} />
          <MenuItem label="PDF (.pdf)"   onClick={exportPdf} />
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="absolute right-0 mt-1 w-72 rounded-lg border border-bad/40 bg-bad/10 text-bad text-xs p-2 z-30"
        >
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-accent-soft hover:text-accent transition"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function DownloadGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path d="M8 2v8m0 0l3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
