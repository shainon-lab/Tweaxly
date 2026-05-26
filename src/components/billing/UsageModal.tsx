"use client";

// Usage & Limits modal. Opens from the sidebar credit pill on click
// (replaces the previous direct link to /settings/billing). Shows
// the current plan's limits side-by-side with the next tier so the
// user can see what they'd gain at a glance.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import UpgradeTriggerButton from "./UpgradeTriggerButton";
import BuyCreditsTriggerButton from "./BuyCreditsTriggerButton";

interface UsageModalProps {
  open:              boolean;
  onClose:           () => void;
  plan:              string;   // "free" | "pro" (legacy "business" → Pro)
  balance:           number;
  monthlyAllowance:  number;
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro",
  // Legacy "business" rows roll up to Pro in the entitlements layer.
  business: "Pro",
};

// Static plan-limit reference. Kept in sync with src/lib/billing/plans.ts;
// duplicated here because this is a client component and importing
// from the billing library would pull in Prisma client-side.
const LIMITS = {
  free: {
    businesses:        "1",
    members:           "1",
    dataSources:       "1",
    historyDays:       "90 days",
    signalsPerMonth:   "3",
    forecastMonths:    "3 months",
    aiCredits:         30,
    scenarioBuilder:   false,
    exports:           false,
    smartAlerts:       false,
    apiAccess:         false,
  },
  pro: {
    businesses:        "Unlimited",
    members:           "Team + roles",
    dataSources:       "Unlimited",
    historyDays:       "Unlimited",
    signalsPerMonth:   "Unlimited",
    forecastMonths:    "Unlimited",
    aiCredits:         500,
    scenarioBuilder:   true,
    exports:           true,
    smartAlerts:       true,
    apiAccess:         true,
  },
} as const;

type PlanKey = keyof typeof LIMITS;

function isPlan(p: string): p is PlanKey {
  return p === "free" || p === "pro";
}

export default function UsageModal({
  open, onClose, plan, balance, monthlyAllowance,
}: UsageModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
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
  // Same portal trick as UpgradeModal — escapes any transformed
  // ancestor that would otherwise capture position:fixed and push
  // the overlay behind the page chrome.
  if (typeof document === "undefined") return null;

  // Treat any unknown plan string (including legacy "business") as
  // Pro - the entitlements layer normalises the same way.
  const safePlan: PlanKey = isPlan(plan) ? plan : (plan === "business" ? "pro" : "free");
  const current = LIMITS[safePlan];
  // Only one possible upgrade target now (Free → Pro). Pro users
  // see no comparison; they get a "Buy more credits" prompt instead.
  const nextTier: PlanKey | null = safePlan === "free" ? "pro" : null;
  const next = nextTier ? LIMITS[nextTier] : null;
  const usedPct = monthlyAllowance > 0
    ? Math.max(0, Math.min(100, Math.round(((monthlyAllowance - balance) / monthlyAllowance) * 100)))
    : 0;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Plan usage and limits"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border border-line bg-ink-900 shadow-2xl outline-none max-h-[90vh] overflow-y-auto"
      >
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

        <div className="p-6 sm:p-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-2">
            This workspace · Plan usage &amp; limits
          </div>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              This workspace is on the {PLAN_LABEL[safePlan]} plan
            </h2>
            <Link
              href="/settings?tab=plan"
              onClick={onClose}
              className="text-xs text-brand-purple hover:text-brand-teal transition"
            >
              Full billing settings →
            </Link>
          </div>

          {/* Credit usage bar */}
          <div className="mt-5 rounded-xl border border-line bg-ink-950/60 p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold text-white">
                {safePlan === "free" ? "Starter AI Credits" : "AI Credits"}
              </div>
              <div className="text-xs text-slate-400 tabular-nums">
                <span className="text-white font-semibold">{balance.toLocaleString()}</span>
                {safePlan === "free"
                  ? " starter credits left"
                  : <> left of {monthlyAllowance.toLocaleString()} this month</>}
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-teal"
                style={{ width: `${100 - usedPct}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {safePlan === "free" ? (
                <>
                  Starter AI Credits are a one-time grant on Free workspaces - they don&apos;t renew.
                  Upgrade to Pro for 500 AI Credits every month + the ability to buy more anytime.
                </>
              ) : (
                <>
                  Resets at the start of every calendar month. Buy a credit pack from{" "}
                  <Link href="/settings?tab=plan" onClick={onClose} className="text-brand-purple hover:text-brand-teal transition">
                    billing settings
                  </Link>{" "}
                  if you need more this month.
                </>
              )}
            </div>
          </div>

          {/* Side-by-side comparison */}
          {next && nextTier ? (
            <div className="mt-6 rounded-xl border border-line overflow-hidden">
              <div className="grid grid-cols-3 text-[11px] uppercase tracking-wider text-slate-400 bg-ink-900/80 font-semibold">
                <div className="px-3 py-2 border-r border-line">Dimension</div>
                <div className="px-3 py-2 border-r border-line">{PLAN_LABEL[safePlan]} (current)</div>
                <div className="px-3 py-2 text-brand-purple">{PLAN_LABEL[nextTier]} (next)</div>
              </div>
              <ComparisonRow label="Businesses"            cur={current.businesses}        next={next.businesses} />
              <ComparisonRow label="Team members"          cur={current.members}           next={next.members} />
              <ComparisonRow label="Data sources"          cur={current.dataSources}       next={next.dataSources} />
              <ComparisonRow label="Historical data"       cur={current.historyDays}       next={next.historyDays} />
              <ComparisonRow label="AI Credits / month"    cur={current.aiCredits.toLocaleString()} next={next.aiCredits.toLocaleString()} />
              <ComparisonRow label="Business signals / mo" cur={current.signalsPerMonth}   next={next.signalsPerMonth} />
              <ComparisonRow label="Forecast horizon"      cur={current.forecastMonths}    next={next.forecastMonths} />
              <ComparisonRow label="Scenario Builder"      cur={current.scenarioBuilder}   next={next.scenarioBuilder} />
              <ComparisonRow label="Excel / CSV / PDF export" cur={current.exports}        next={next.exports} />
              <ComparisonRow label="Smart alerts"          cur={current.smartAlerts}       next={next.smartAlerts} />
              <ComparisonRow label="Team members + roles"  cur={current.members}           next={next.members} />
              <ComparisonRow label="API access + webhooks" cur={current.apiAccess}         next={next.apiAccess} />
            </div>
          ) : null}

          {/* CTA row. Pro users see "Buy more AI Credits" since they
              can scale via packs. Free users only see "Upgrade to
              Pro" - the subscription is the monetization layer, so
              we never offer Free users a pack purchase. */}
          <div className="mt-7 flex items-center gap-3 flex-wrap">
            {nextTier ? (
              <UpgradeTriggerButton
                currentPlan={safePlan}
                feature="Pro plan"
                onBeforeOpen={onClose}
                className="btn-primary text-sm px-4 py-2 rounded-md"
              >
                Upgrade this workspace to Pro · $49/mo
              </UpgradeTriggerButton>
            ) : (
              <BuyCreditsTriggerButton
                onBeforeOpen={onClose}
                className="btn-primary text-sm px-4 py-2 rounded-md"
              >
                Buy more AI Credits
              </BuyCreditsTriggerButton>
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Each workspace has its own plan + AI Credits. Upgrading here won&apos;t affect any other workspace.
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function ComparisonRow({
  label, cur, next,
}: { label: string; cur: string | boolean; next: string | boolean }) {
  return (
    <div className="grid grid-cols-3 text-xs border-t border-line/40">
      <div className="px-3 py-2 text-slate-300 border-r border-line/40">{label}</div>
      <div className="px-3 py-2 text-slate-400 border-r border-line/40">{renderValue(cur)}</div>
      <div className="px-3 py-2 text-slate-100 font-medium">{renderValue(next)}</div>
    </div>
  );
}
function renderValue(v: string | boolean) {
  if (typeof v === "boolean") {
    return v
      ? <span className="text-good">✓ Included</span>
      : <span className="text-slate-600">—</span>;
  }
  return v;
}
