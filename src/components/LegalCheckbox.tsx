"use client";

// Required legal acceptance checkbox for the registration form.
// Acknowledges both the Terms of Service AND the Privacy Policy in a
// single statement; clicking either name opens the relevant document
// inline as a modal. The server re-validates the acceptTerms hidden
// value as the source of truth, but the surrounding <form> blocks
// submission until this is checked.

import { useState } from "react";
import { X as XIcon } from "lucide-react";
import TermsContent, { TERMS_LAST_UPDATED } from "./TermsContent";
import PrivacyContent, { PRIVACY_LAST_UPDATED } from "./PrivacyContent";

type DocKind = null | "terms" | "privacy";

export default function LegalCheckbox({
  onChange,
  checked,
}: {
  onChange: (accepted: boolean) => void;
  checked: boolean;
}) {
  const [open, setOpen] = useState<DocKind>(null);

  return (
    <>
      <label className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug cursor-pointer select-none">
        <input
          type="checkbox"
          name="acceptTerms"
          value="yes"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="mt-0.5 size-4 shrink-0 rounded border-line bg-ink-900 accent-brand-purple"
        />
        <span>
          I have read and agree to the{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setOpen("terms"); }}
            className="text-accent hover:underline"
          >
            Terms of Service
          </button>
          {" "}and{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setOpen("privacy"); }}
            className="text-accent hover:underline"
          >
            Privacy Policy
          </button>
          .
        </span>
      </label>

      {open ? <LegalModal kind={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function LegalModal({ kind, onClose }: { kind: Exclude<DocKind, null>; onClose: () => void }) {
  const title = kind === "terms" ? "Terms of Service" : "Privacy Policy";
  const stamp = kind === "terms" ? TERMS_LAST_UPDATED : PRIVACY_LAST_UPDATED;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-full bg-ink-900 border border-line rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-line bg-ink-900">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last Updated: {stamp}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-ink-700 rounded-md transition"
            aria-label="Close"
          >
            <XIcon size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {kind === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>
        <div className="shrink-0 border-t border-line p-3 flex items-center justify-end gap-2 bg-ink-900">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
