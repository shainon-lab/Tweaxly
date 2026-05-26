"use client";

// One card per workspace in the overview grid. Shows plan badge,
// AI credit balance + progress bar, alert count, last activity,
// and two CTAs: Open (POST switch + reload) and Manage plan (link
// to /settings after switching - billing lives inside Settings →
// Business Profile per workspace).

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface WorkspaceCardData {
  id:                string;
  name:              string;
  role:              string;
  isCurrent:         boolean;
  plan:              string;
  planSource:        "override" | "subscription" | "default";
  readOnly:          boolean;
  balance:           number;
  monthlyAllowance:  number;
  firingAlerts:      number;
  transactions:      number;
  lastActivityLabel: string;
  hasActivity:       boolean;
}

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free: { label: "Free", cls: "border-line/60 text-slate-400 bg-ink-700/60" },
  pro:  { label: "Pro",  cls: "border-brand-purple/40 text-brand-purple bg-accent-soft/30" },
  // Legacy: collapsed into Pro in the entitlements layer.
  business: { label: "Pro", cls: "border-brand-purple/40 text-brand-purple bg-accent-soft/30" },
};

export function WorkspaceCard({ card }: { card: WorkspaceCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const pct = card.monthlyAllowance > 0
    ? Math.max(0, Math.min(100, Math.round((card.balance / card.monthlyAllowance) * 100)))
    : 0;
  const low   = card.balance > 0 && card.balance < 5;
  const empty = card.balance <= 0;
  const badge = PLAN_BADGE[card.plan] ?? PLAN_BADGE.free;

  async function openWorkspace() {
    if (card.isCurrent) {
      startTransition(() => router.push("/dashboard"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/businesses/switch", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ businessId: card.id }),
      });
      if (!res.ok) {
        alert("Couldn't switch workspace. Try again.");
        setBusy(false);
        return;
      }
      // Full reload so server components + layout pick up the new
      // session workspace immediately.
      window.location.assign("/dashboard");
    } catch {
      alert("Network error - check your connection.");
      setBusy(false);
    }
  }

  async function openWorkspaceBilling() {
    // Land directly on the Business Plan tab so the user sees the
    // plan + AI Credits view immediately - the upgrade flow lives
    // there, not on the default Business Settings tab.
    if (card.isCurrent) {
      startTransition(() => router.push("/settings?tab=plan"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/businesses/switch", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ businessId: card.id }),
      });
      if (!res.ok) { alert("Couldn't switch workspace."); setBusy(false); return; }
      window.location.assign("/settings?tab=plan");
    } catch {
      alert("Network error.");
      setBusy(false);
    }
  }

  return (
    <article
      className={[
        "card flex flex-col gap-3",
        card.isCurrent ? "border-accent/40 ring-1 ring-accent/20" : "",
      ].join(" ")}
    >
      {/* Header: name + plan badge + current marker */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{card.name}</h3>
            {card.isCurrent ? (
              <span className="shrink-0 text-[9px] uppercase tracking-wider text-accent font-semibold px-1.5 py-0.5 rounded border border-accent/40 bg-accent-soft/30">
                Current
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>{card.role.replace("_", " ")}</span>
            <span className="text-slate-600">·</span>
            <span>{card.lastActivityLabel}</span>
            {card.readOnly ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-bad font-semibold">Read-only</span>
              </>
            ) : null}
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${badge.cls}`}
          title={card.planSource === "override" ? "Admin override" : card.planSource === "subscription" ? "Active subscription" : "Default Free plan"}
        >
          {badge.label}
        </span>
      </div>

      {/* AI Credits bar */}
      <div>
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="uppercase tracking-wider text-slate-400 font-semibold">AI Credits</span>
          <span className={`tabular-nums ${empty ? "text-bad" : low ? "text-warn" : "text-slate-300"}`}>
            {card.balance.toLocaleString()} / {card.monthlyAllowance.toLocaleString()}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-ink-700/80 overflow-hidden">
          <div
            className={`h-full rounded-full ${empty ? "bg-bad" : low ? "bg-warn" : "bg-gradient-to-r from-brand-purple to-brand-teal"}`}
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Health row */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-ink-950/40 border border-line/40 px-2 py-1.5">
          <div className="text-slate-500">Firing alerts</div>
          <div className={`mt-0.5 font-semibold tabular-nums ${card.firingAlerts > 0 ? "text-warn" : "text-slate-300"}`}>
            {card.firingAlerts}
          </div>
        </div>
        <div className="rounded-md bg-ink-950/40 border border-line/40 px-2 py-1.5">
          <div className="text-slate-500">Transactions</div>
          <div className="mt-0.5 font-semibold tabular-nums text-slate-300">
            {card.transactions.toLocaleString()}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={openWorkspace}
          disabled={busy}
          className="btn-primary text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {busy ? "Opening…" : card.isCurrent ? "Open dashboard →" : "Switch in →"}
        </button>
        <button
          type="button"
          onClick={openWorkspaceBilling}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
        >
          Manage plan
        </button>
        {card.plan === "free" ? (
          <Link
            href="#"
            onClick={(e) => { e.preventDefault(); openWorkspaceBilling() }}
            className="text-xs text-brand-purple hover:underline ml-auto"
          >
            Upgrade →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
