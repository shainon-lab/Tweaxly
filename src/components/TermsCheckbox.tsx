"use client";

// Required Terms of Service checkbox + inline modal for the
// registration form. The checkbox carries a name="acceptTerms"
// value="yes" so the server can re-validate; the surrounding
// <form> blocks submit until it's checked via local state.

import { useState } from "react";
import { X as XIcon } from "lucide-react";
import TermsContent, { TERMS_LAST_UPDATED } from "./TermsContent";

export default function TermsCheckbox({
  onChange,
  checked,
}: {
  onChange: (accepted: boolean) => void;
  checked: boolean;
}) {
  const [open, setOpen] = useState(false);

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
          className="mt-0.5 size-4 rounded border-line bg-ink-900 accent-brand-purple"
        />
        <span>
          By signing up, you agree to the{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setOpen(true); }}
            className="text-accent hover:underline"
          >
            Terms of Service
          </button>
          .
        </span>
      </label>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Terms of Service"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-2xl max-h-full bg-ink-900 border border-line rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-line bg-ink-900">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Terms of Service</h2>
                <p className="text-xs text-slate-500 mt-0.5">Last Updated: {TERMS_LAST_UPDATED}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-ink-700 rounded-md transition"
                aria-label="Close"
              >
                <XIcon size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              <TermsContent />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-line p-3 flex items-center justify-end gap-2 bg-ink-900">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm px-4 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
