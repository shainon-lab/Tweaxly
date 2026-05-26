"use client";

// Lightweight success toast shown after the embedded checkout returns
// success. NOT the source of truth — the webhook still owns the plan
// + credit grant — but the toast gives the user immediate feedback
// while router.refresh() pulls the updated server-rendered state.
//
// Two flavors driven by the `kind` prop:
//   subscription → "Welcome to Pro"
//   pack         → "Credits added"
//
// Auto-dismisses after 5 seconds, dismissible by click.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

export type CheckoutSuccessKind = "subscription" | "pack";

const TITLES: Record<CheckoutSuccessKind, string> = {
  subscription: "Welcome to Pro",
  pack:         "Credits added",
};

const BODIES: Record<CheckoutSuccessKind, string> = {
  subscription: "Your workspace is now on the Pro plan. Premium features are unlocking now.",
  pack:         "Your new credits are landing in your wallet. Refresh in a moment if you don't see the new balance.",
};

export default function CheckoutSuccessToast({
  kind,
  onDismiss,
}: {
  kind: CheckoutSuccessKind | null;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!kind) { setVisible(false); return; }
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      // Give the fade-out a beat before fully unmounting.
      window.setTimeout(onDismiss, 220);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [kind, onDismiss]);

  if (!kind || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 right-5 z-[10000] max-w-sm transition-all duration-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
    >
      <div className="rounded-xl border border-good/40 bg-ink-900 shadow-2xl shadow-black/40 p-4 flex items-start gap-3">
        <span className="shrink-0 inline-flex w-9 h-9 rounded-full bg-good/15 text-good items-center justify-center">
          <CheckCircle2 size={18} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-50 leading-tight">{TITLES[kind]}</div>
          <div className="text-xs text-slate-300 mt-1 leading-snug">{BODIES[kind]}</div>
        </div>
        <button
          type="button"
          onClick={() => { setVisible(false); window.setTimeout(onDismiss, 220); }}
          aria-label="Dismiss"
          className="shrink-0 w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-slate-200 transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
