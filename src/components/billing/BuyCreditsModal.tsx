"use client";

// Buy-more-credits modal. Mirrors UpgradeModal's shell so the Pro
// equivalent of "Upgrade to Pro" - i.e. "Buy more credits" - happens
// inline instead of bouncing the user to /settings. Shows the same
// fixed 30/50/100 packs + the custom-amount input with live
// sliding-scale price preview that BillingClient surfaces, but in a
// focused dialog. Buying any option POSTs to
// /api/billing/checkout/pack and redirects to Polar.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { openEmbeddedCheckout } from "@/lib/billing/embedCheckout";
import CheckoutSuccessToast, { type CheckoutSuccessKind } from "./CheckoutSuccessToast";
// Direct import from the plans submodule - not the @/lib/billing
// barrel - because the barrel re-exports entitlements.ts which in turn
// imports the Prisma client. Pulling the barrel from a client component
// drags @prisma/client into the browser bundle and crashes every
// page at load time. See src/lib/db.ts (server-only guard).
import {
  CREDIT_PACKS, CUSTOM_PACK_SKU, CUSTOM_PACK_MIN_CREDITS,
  calculateCustomPackPriceCents,
} from "@/lib/billing/plans";

interface BuyCreditsModalProps {
  open:    boolean;
  onClose: () => void;
}

function fmtUSD(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function BuyCreditsModal({ open, onClose }: BuyCreditsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customCredits, setCustomCredits] = useState<string>(String(CUSTOM_PACK_MIN_CREDITS));
  // Survives modal close so the "Credits added" toast still shows.
  const [successKind, setSuccessKind] = useState<CheckoutSuccessKind | null>(null);

  // Live price preview for the custom input (mirrors the server's
  // calculateCustomPackPriceCents step-function so what the user
  // sees here is what Polar will charge).
  const customNum    = Math.floor(Number(customCredits));
  const customValid  = Number.isFinite(customNum) && customNum >= CUSTOM_PACK_MIN_CREDITS;
  const customPrice  = customValid ? calculateCustomPackPriceCents(customNum) : 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function buy(body: object, busyKey: string) {
    setBusy(busyKey);
    setError(null);
    try {
      const res  = await fetch("/api/billing/checkout/pack", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({} as { url?: string; message?: string; error?: string }));
      if (res.status === 403 && data.error === "email_unverified") {
        setError("Please verify your email to buy credits. Use the Resend button in the banner at the top of the page.");
        setBusy(null);
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.message ?? "Could not open checkout. Try again in a moment.");
        setBusy(null);
        return;
      }
      // Embedded flow: close the buy-credits modal first so the SDK's
      // iframe sits cleanly on top of the page, then open Polar's
      // checkout overlay. Webhook is the source of truth for credit
      // grant; success here just refreshes the wallet UI.
      onClose();
      setBusy(null);
      await openEmbeddedCheckout(data.url, {
        onSuccess: () => {
          setSuccessKind("pack");
          router.refresh();
        },
        onError: (msg) => {
          setError(msg);
        },
      });
    } catch {
      setError("Network error - check your connection.");
      setBusy(null);
    }
  }

  // Toast survives modal close so the "Credits added" confirmation
  // is visible after the user finishes checkout.
  const successToast = (
    <CheckoutSuccessToast kind={successKind} onDismiss={() => setSuccessKind(null)} />
  );

  if (!open) return successToast;
  // Portal to document.body so any ancestor with transform/filter
  // can't capture position:fixed - same fix as UpgradeModal.
  if (typeof document === "undefined") return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buy more AI Credits"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 shadow-2xl outline-none"
      >
        {/* Brand gradient backdrop - matches UpgradeModal so the two
            dialogs feel like siblings. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(167,139,250,0.18), transparent 60%)," +
              "radial-gradient(ellipse 60% 50% at 100% 100%, rgba(34,211,238,0.14), transparent 60%)",
          }}
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-ink-700 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
            Buy AI Credits for this workspace
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
            Add more credits
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Credit packs are added instantly and expire 12 months after
            purchase. Each workspace has its own wallet - buying here
            won&apos;t affect any other workspace.
          </p>

          {/* Fixed packs */}
          <div className="mt-5 grid sm:grid-cols-3 gap-2.5">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.sku}
                type="button"
                onClick={() => buy({ sku: pack.sku }, `pack:${pack.sku}`)}
                disabled={busy === `pack:${pack.sku}`}
                className="rounded-lg border border-line bg-ink-950/40 px-3 py-3 text-left hover:border-accent/50 hover:bg-accent-soft/10 transition disabled:opacity-60"
              >
                <div className="text-sm font-semibold text-white">+{pack.credits.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">AI Credits</div>
                <div className="mt-2 text-sm font-semibold text-accent tabular-nums">
                  {busy === `pack:${pack.sku}` ? "Opening…" : fmtUSD(pack.priceCents)}
                </div>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="mt-3 rounded-lg border border-line bg-ink-950/40 px-3 py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Custom amount</div>
                <div className="text-[11px] text-slate-500">
                  Min {CUSTOM_PACK_MIN_CREDITS} · 30¢ &lt;50 · 28¢ 50-99 · 19¢ 100+
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  inputMode="numeric"
                  min={CUSTOM_PACK_MIN_CREDITS}
                  step={1}
                  className="input w-24 text-right tabular-nums"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  aria-label="Custom credit amount"
                />
                <span className="text-sm font-semibold text-accent tabular-nums min-w-[60px] text-right">
                  {customValid ? fmtUSD(customPrice) : " - "}
                </span>
                <button
                  type="button"
                  onClick={() => buy({ sku: CUSTOM_PACK_SKU, credits: customNum }, `pack:${CUSTOM_PACK_SKU}`)}
                  disabled={!customValid || busy === `pack:${CUSTOM_PACK_SKU}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-accent/40 bg-accent-soft/30 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy === `pack:${CUSTOM_PACK_SKU}` ? "Opening…" : "Buy"}
                </button>
              </div>
            </div>
            {!customValid && customCredits !== "" ? (
              <div className="mt-2 text-[11px] text-warn">
                Minimum {CUSTOM_PACK_MIN_CREDITS} credits.
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-3 text-[11px] text-bad">{error}</div>
          ) : null}
          <div className="mt-4 text-[11px] text-slate-500">
            Charges go through Polar. You&apos;ll be redirected to a secure checkout page.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}
      {successToast}
    </>
  );
}
