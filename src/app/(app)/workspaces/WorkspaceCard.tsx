"use client";

// One card per workspace in the Account → Workspaces overview grid.
// Shows plan badge, AI credit balance + progress bar, alert count,
// last activity, the primary CTAs (Open / Manage plan / Upgrade) and
// the per-workspace management actions (Rename / Leave / Delete).
// The full management surface lives here now - the old
// /settings/workspaces route was retired in favor of inline actions
// next to each card.

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, LogOut, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

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
  // Membership-side fields used by the inline management actions.
  membershipId:      string;
  isOwner:           boolean;
  memberCount:       number;
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
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(card.name);
  const [error, setError] = useState<string | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function saveRename() {
    if (!editName.trim() || editName.trim() === card.name) {
      setEditing(false);
      return;
    }
    setError(null);
    const res = await fetch(`/api/businesses/${card.id}`, {
      method:  "PATCH",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ name: editName.trim() }),
    });
    if (!res.ok) { setError("Rename failed"); return; }
    setEditing(false);
    refresh();
  }

  async function leave() {
    const ok = await notify.confirm({
      title:        "Leave workspace?",
      body:         `Leave "${card.name}"? You won't be able to access this workspace until you're re-invited.`,
      confirmLabel: "Leave",
      danger:       true,
    });
    if (!ok) return;
    setError(null);
    const res = await fetch(`/api/businesses/${card.id}/leave`, { method: "POST" });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      setError(t.message ?? "Leave failed");
      return;
    }
    if (card.isCurrent) { window.location.assign("/dashboard"); return; }
    refresh();
  }

  async function destroy() {
    const confirmText = window.prompt(
      `Permanently delete "${card.name}"?\n\nThis cascade-deletes ${card.transactions.toLocaleString()} transaction(s), uploads, employees, forecasts, and every member. There is no undo.\n\nType the workspace name to confirm:`
    );
    if (confirmText !== card.name) {
      if (confirmText !== null) notify.alert("Name didn't match - deletion cancelled.");
      return;
    }
    setError(null);
    const res = await fetch(`/api/businesses/${card.id}?confirm=delete`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    if (card.isCurrent) { window.location.assign("/dashboard"); return; }
    refresh();
  }

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
        notify.alert("Couldn't switch workspace. Try again.");
        setBusy(false);
        return;
      }
      // Full reload so server components + layout pick up the new
      // session workspace immediately.
      window.location.assign("/dashboard");
    } catch {
      notify.alert("Network error - check your connection.");
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
      if (!res.ok) { notify.alert("Couldn't switch workspace."); setBusy(false); return; }
      window.location.assign("/settings?tab=plan");
    } catch {
      notify.alert("Network error.");
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
            {editing ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); void saveRename(); }
                    if (e.key === "Escape") { setEditing(false); setEditName(card.name); }
                  }}
                  className="input text-base font-semibold py-1 px-2"
                />
                <button type="button" onClick={() => void saveRename()} className="btn-primary text-[11px] px-2 py-1 rounded-md">Save</button>
                <button type="button" onClick={() => { setEditing(false); setEditName(card.name); }} className="btn-ghost text-[11px] px-2 py-1 rounded-md">Cancel</button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white truncate">{card.name}</h3>
                {card.isCurrent ? (
                  <span className="shrink-0 text-[9px] uppercase tracking-wider text-accent font-semibold px-1.5 py-0.5 rounded border border-accent/40 bg-accent-soft/30">
                    Current
                  </span>
                ) : null}
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{card.role.replace("_", " ")}</span>
            <span className="text-slate-600">·</span>
            <span>{card.memberCount} member{card.memberCount === 1 ? "" : "s"}</span>
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

      {error ? (
        <div className="rounded-md border border-bad/40 bg-bad/10 text-bad text-xs px-2.5 py-1.5">{error}</div>
      ) : null}

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

      {/* Primary CTAs */}
      <div className="pt-1 flex items-center gap-2 flex-wrap">
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

      {/* Per-workspace management actions. Rename (account_admin),
          Leave (non-owner), Delete (owner only). Kept in a separate
          row so they don't compete with the primary "Switch / Manage"
          CTAs above. */}
      <div className="mt-auto pt-2 border-t border-line/40 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
        <span className="uppercase tracking-wider">Manage</span>
        {card.role === "account_admin" && !editing ? (
          <button
            type="button"
            onClick={() => { setEditName(card.name); setEditing(true); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition"
            title="Rename workspace"
          >
            <Pencil size={11} strokeWidth={2} /> Rename
          </button>
        ) : null}
        {!card.isOwner ? (
          <button
            type="button"
            onClick={() => void leave()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-line text-slate-300 hover:text-bad hover:border-bad/50 transition"
            title="Leave workspace"
          >
            <LogOut size={11} strokeWidth={2} /> Leave
          </button>
        ) : null}
        {card.isOwner ? (
          <button
            type="button"
            onClick={() => void destroy()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-line text-slate-400 hover:text-bad hover:border-bad/50 transition"
            title="Delete workspace (owner only)"
          >
            <Trash2 size={11} strokeWidth={2} /> Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
