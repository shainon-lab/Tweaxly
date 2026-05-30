"use client";

// Shared upgrade modal. Opens from any locked-feature click so the
// user always sees the same prompt - one place to evolve copy, one
// place to track conversions later.
//
// Usage:
//   const [open, setOpen] = useState(false);
//   <button onClick={() => setOpen(true)}>Export →</button>
//   <UpgradeModal
//     open={open}
//     onClose={() => setOpen(false)}
//     feature="Excel / CSV / PDF export"
//     currentPlan={plan}
//     benefits={[
//       "Export every report to Excel, CSV, PDF",
//       "Unlimited business signals + smart alerts",
//       "Full forecasting + Scenario Builder",
//     ]}
//   />

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { openEmbeddedCheckout } from "@/lib/billing/embedCheckout";
import CheckoutSuccessToast, { type CheckoutSuccessKind } from "./CheckoutSuccessToast";

interface UpgradeModalProps {
  open:        boolean;
  onClose:     () => void;
  // The specific capability the user just tried to use. Shown as the
  // headline so the modal feels contextual, not generic.
  feature?:    string;
  currentPlan?: string;
  // Override the default benefit list when the locked feature has a
  // different selling story. When omitted, a generic set is used.
  benefits?:   string[];
}

const PLAN_LABEL: Record<string, string> = {
  free:     "Free",
  pro:      "Pro",
  business: "Business",
};

// Bullets specific to each paid tier. Free upgrade modal shows both
// tiers side by side; Pro upgrade modal shows only Business (since
// Pro IS the current tier). Bullets focus on the headline value -
// detailed feature lists live on /pricing.
const PRO_BULLETS = [
  "Up to 3 workspaces",
  "Owner + 2 team members (Viewer)",
  "100 AI Credits / cycle + buy more anytime",
  "Advanced AI, full forecasting + Scenario Builder",
  "Export to Excel, CSV, PDF",
];
const BUSINESS_BULLETS = [
  "Unlimited workspaces",
  "Owner + 5 team members (Admin + Viewer)",
  "250 AI Credits / cycle + buy more anytime",
  "Share Insights - secure read-only links for consultations, signals, forecasts, reports",
  "Everything in Pro + priority AI processing",
];

export default function UpgradeModal({
  open, onClose, feature, currentPlan, benefits,
}: UpgradeModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Success toast kind. Null = no toast showing. The toast renders
  // even after the modal closes (portal'd to body) so the user gets
  // confirmation feedback while router.refresh() pulls updated
  // server state.
  const [successKind, setSuccessKind] = useState<CheckoutSuccessKind | null>(null);

  // Tracks which tier the spinner belongs to so the disabled state
  // sits on the right button. null = idle.
  const [busyPlan, setBusyPlan] = useState<"pro" | "business" | null>(null);

  // Embedded checkout flow: hit our server to create the Polar
  // Checkout Session (which now includes embed_origin), then open
  // the SDK's iframe overlay inside Tweaxly. The webhook is still
  // the source of truth for unlocking premium features — frontend
  // success just refreshes server-rendered state so the new plan
  // lands in the UI without the user having to reload.
  async function startCheckout(planId: "pro" | "business") {
    setError(null);
    setBusy(true);
    setBusyPlan(planId);
    try {
      const res  = await fetch("/api/billing/checkout/subscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({} as { url?: string; message?: string; error?: string }));
      // 403 from the server's email-verification gate. Surface a
      // pointed message rather than the generic "could not open" so
      // the user understands which action to take next.
      if (res.status === 403 && data.error === "email_unverified") {
        setError("Please verify your email to upgrade. Use the Resend button in the banner at the top of the page.");
        setBusy(false);
        setBusyPlan(null);
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.message ?? "Could not open checkout. Try again in a moment.");
        setBusy(false);
        setBusyPlan(null);
        return;
      }
      // Close the upgrade modal so the iframe overlay is the only
      // thing on top of the page. The SDK manages its own backdrop.
      onClose();
      setBusy(false);
      setBusyPlan(null);
      await openEmbeddedCheckout(data.url, {
        onSuccess: () => {
          setSuccessKind("subscription");
          // Refresh the server-rendered subscription + wallet state.
          // No full reload — preserves the user's place on the page.
          router.refresh();
        },
        onClose: () => {
          // User abandoned. No toast, no refresh needed.
        },
        onError: (msg) => {
          setError(msg);
        },
      });
    } catch {
      setError("Network error - check your connection.");
      setBusy(false);
      setBusyPlan(null);
    }
  }

  // ESC + outside-click close. Focus trap is light - we just focus
  // the panel on open so screen readers land in the right place.
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

  // The success toast lives outside the open-gated modal — it needs
  // to be visible AFTER the user closes the upgrade modal to start
  // the embedded checkout. Rendered alongside the modal (or alone)
  // so the user always sees confirmation.
  const successToast = (
    <CheckoutSuccessToast kind={successKind} onDismiss={() => setSuccessKind(null)} />
  );

  if (!open) return successToast;

  const current   = currentPlan ?? "free";
  const planLabel = PLAN_LABEL[current] ?? current;
  // Pro users see only the Business upsell; Free users see both.
  // Caller-provided `benefits` overrides the Business tile's bullets
  // when set - lets a specific locked feature lead with its own
  // selling story.
  const showPro   = current === "free";
  const proBullets      = PRO_BULLETS;
  const businessBullets = benefits && benefits.length > 0 ? benefits : BUSINESS_BULLETS;

  // Portal the modal to document.body so any ancestor with a
  // `transform` / `filter` / `contain` style can't capture our
  // `position: fixed` and make the overlay render behind the page
  // chrome. Render-on-mount means we can't portal during SSR; guard
  // with `typeof document` so the server renders nothing (the modal
  // is only open after the user clicks, which is post-hydration).
  if (typeof document === "undefined") return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade your plan"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${showPro ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-line bg-ink-900 shadow-2xl outline-none`}
      >
        {/* Soft gradient backdrop on the modal itself - mirrors the
            marketing-site banner so the upgrade prompt feels on-brand
            rather than utilitarian. */}
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
            Upgrade this workspace
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
            {feature ? <>Unlock <span className="text-white">{feature}</span></> : <>Unlock deeper business intelligence</>}
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            This workspace is on the <span className="pill text-[10px] mx-1">{planLabel}</span> plan.
            Each workspace has its own subscription and AI Credits - upgrading here
            won&apos;t change any other workspace.
          </p>

          <div className={`mt-6 grid gap-4 ${showPro ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            {showPro ? (
              <PlanTile
                name="Pro"
                price="$49"
                period="per month"
                tagline="For the working business"
                bullets={proBullets}
                ctaLabel={busyPlan === "pro" ? "Opening checkout…" : "Upgrade to Pro"}
                disabled={busy}
                onClick={() => startCheckout("pro")}
              />
            ) : null}
            <PlanTile
              name="Business"
              price="$89"
              period="per month"
              tagline="Teams, partnerships, multi-business operators"
              bullets={businessBullets}
              ctaLabel={busyPlan === "business" ? "Opening checkout…" : "Upgrade to Business"}
              disabled={busy}
              onClick={() => startCheckout("business")}
              highlight
            />
          </div>
          {error ? (
            <div className="mt-3 text-[11px] text-bad">{error}</div>
          ) : null}
          <div className="mt-4 text-[11px] text-slate-500">
            Need more AI power? Buy credit packs anytime from Billing &amp; Credits - they add instantly.
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

// Side-by-side plan tile used inside the upgrade modal. Same shape
// as the marketing pricing cards but compact - the modal is a
// conversion surface, not a feature comparison.
function PlanTile({
  name, price, period, tagline, bullets, ctaLabel, disabled, onClick, highlight,
}: {
  name:      string;
  price:     string;
  period:    string;
  tagline:   string;
  bullets:   string[];
  ctaLabel:  string;
  disabled:  boolean;
  onClick:   () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-ink-900/70 p-5 flex flex-col gap-4 ${
        highlight ? "border-brand-purple/60 ring-1 ring-brand-purple/30" : "border-line"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-base font-semibold text-white">{name}</div>
          {highlight ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-purple font-semibold">
              Most popular
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tabular-nums">{price}</span>
          <span className="text-xs text-slate-400">{period}</span>
        </div>
        <div className="t-meta text-slate-400 mt-2">{tagline}</div>
      </div>
      <ul className="space-y-2 flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[13px] text-slate-200 leading-snug">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-good/15 text-good shrink-0"
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3 3 7-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`text-sm px-4 py-2 rounded-md transition disabled:opacity-60 inline-flex items-center justify-center gap-1 ${
          highlight
            ? "btn-primary"
            : "border border-line text-slate-200 hover:text-white hover:border-slate-500 bg-ink-900/50"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
