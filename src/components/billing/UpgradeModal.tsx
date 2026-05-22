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

import { useEffect, useRef } from "react";
import Link from "next/link";

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
  free: "Free", pro: "Pro",
  // Legacy "business" rows roll up to Pro in the entitlements layer.
  business: "Pro",
};

const DEFAULT_BENEFITS = [
  "Unlimited business signals + smart alerts",
  "Full forecasting + Scenario Builder",
  "Export to Excel, CSV, PDF",
  "Multi-business, multi-user, team roles",
  "500 AI Credits / month - buy more anytime",
];

export default function UpgradeModal({
  open, onClose, feature, currentPlan, benefits,
}: UpgradeModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

  const planLabel = PLAN_LABEL[currentPlan ?? "free"] ?? currentPlan ?? "Free";
  const bullets   = benefits && benefits.length > 0 ? benefits : DEFAULT_BENEFITS;

  return (
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
        className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 shadow-2xl outline-none"
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
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-ink-700 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

          <ul className="mt-6 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
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

          <div className="mt-7 flex items-center gap-3 flex-wrap">
            <Link
              href="/settings/billing"
              className="btn-primary text-sm px-4 py-2 rounded-md inline-flex items-center gap-1"
              onClick={onClose}
            >
              Upgrade this workspace · $49/mo
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/settings/billing"
              className="text-sm px-4 py-2 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition"
              onClick={onClose}
            >
              Compare all plans
            </Link>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Need more AI power? Buy credit packs anytime from Billing &amp; Credits - they add instantly.
          </div>
        </div>
      </div>
    </div>
  );
}
