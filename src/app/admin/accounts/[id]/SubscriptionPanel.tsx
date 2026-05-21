"use client";

// Subscription & AI Credits admin panel.
// Sits inside the "Plan & billing" section on the Customer 360 page,
// alongside the legacy PlanEditor. Three jobs:
//
//   1. Show the EFFECTIVE plan for this business - the value
//      getEffectivePlan() resolves to (override > subscription >
//      "free"). The legacy Business.plan label is a hint, not the
//      source of truth.
//   2. CRUD admin plan overrides - create one to flip the business
//      onto Pro/Business for testing, demos, lifetime deals, etc;
//      revoke when done.
//   3. Display the AI Credit wallet (balance, monthly allowance,
//      lifetime totals) and grant bonus credits.
//
// All mutations hit dedicated admin API routes that audit-log + go
// through the same billing library the product uses, so wallet
// drift is impossible.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface OverrideRow {
  id:             string;
  plan:           string;
  kind:           string;
  effectiveFrom:  string;
  effectiveUntil: string | null;
  creditsGranted: number | null;
  note:           string | null;
  assignedByName: string | null;
  revokedAt:      string | null;
  revokedByName:  string | null;
}

interface SubscriptionPanelProps {
  businessId:       string;
  effectivePlan:    string;
  effectiveSource:  "override" | "subscription" | "default";
  legacyPlan:       string;
  walletBalance:    number;
  monthlyAllowance: number;
  lifetimeGranted:  number;
  lifetimeConsumed: number;
  activeOverride:   OverrideRow | null;
  overrideHistory:  OverrideRow[];
}

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: "free",     label: "Free" },
  { value: "pro",      label: "Pro" },
  { value: "business", label: "Business" },
];

const KIND_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "full_paid",         label: "Full paid access",     hint: "Behaves exactly like a purchased subscription." },
  { value: "trial_extension",   label: "Trial extension",      hint: "Temporary premium access." },
  { value: "unlimited_credits", label: "Unlimited credits",    hint: "Same plan but no credit metering enforced." },
  { value: "custom",            label: "Custom",               hint: "Free-form override; see admin note." },
];

const SOURCE_LABEL: Record<SubscriptionPanelProps["effectiveSource"], string> = {
  override:     "Admin override",
  subscription: "Subscription",
  default:      "Default (free)",
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro", business: "Business",
};

export function SubscriptionPanel(props: SubscriptionPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // ── Create override form ────────────────────────────────────────
  const [oPlan, setOPlan] = useState("pro");
  const [oKind, setOKind] = useState("full_paid");
  const [oUntil, setOUntil] = useState("");
  const [oCredits, setOCredits] = useState("");
  const [oNote, setONote] = useState("");

  async function createOverride() {
    setError(null);
    const res = await fetch(`/api/admin/accounts/${props.businessId}/overrides`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan:           oPlan,
        kind:           oKind,
        effectiveUntil: oUntil || null,
        creditsGranted: oCredits ? Number(oCredits) : undefined,
        note:           oNote || undefined,
      }),
    });
    if (!res.ok) {
      setError((await res.text()) || "Failed to create override");
      return;
    }
    setSavedAt(Date.now());
    setOUntil(""); setOCredits(""); setONote("");
    startTransition(() => router.refresh());
  }

  async function revokeOverride(overrideId: string) {
    setError(null);
    if (!confirm("Revoke this override? The business will fall back to its real subscription (or Free).")) return;
    const res = await fetch(`/api/admin/accounts/${props.businessId}/overrides/${overrideId}/revoke`, { method: "POST" });
    if (!res.ok) { setError("Failed to revoke override"); return }
    setSavedAt(Date.now());
    startTransition(() => router.refresh());
  }

  // ── Grant credits form ──────────────────────────────────────────
  const [grantAmount, setGrantAmount] = useState("100");
  const [grantReason, setGrantReason] = useState("");

  async function grantBonusCredits() {
    setError(null);
    const amount = Number(grantAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Amount must be a positive number"); return }
    const res = await fetch(`/api/admin/accounts/${props.businessId}/credits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount, reason: grantReason || undefined }),
    });
    if (!res.ok) { setError("Failed to grant credits"); return }
    setSavedAt(Date.now());
    setGrantReason("");
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-5 space-y-6">
      {/* Header: effective plan summary ─────────────────────────── */}
      <div>
        <div className="text-sm font-semibold text-slate-100 mb-1">
          Subscription &amp; AI Credits
        </div>
        <p className="text-xs text-slate-500">
          The effective plan composes admin overrides &gt; subscription &gt; free default.
          The legacy plan label below the section header is a display hint only.
        </p>
        <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
          <span className="pill text-[10px]">Effective: {PLAN_LABEL[props.effectivePlan] ?? props.effectivePlan}</span>
          <span className="text-slate-500">via {SOURCE_LABEL[props.effectiveSource]}</span>
          {props.effectivePlan !== props.legacyPlan ? (
            <span className="text-slate-600">· legacy label: {props.legacyPlan}</span>
          ) : null}
        </div>
      </div>

      {/* Active override ─────────────────────────────────────────── */}
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Active override</div>
        {props.activeOverride ? (
          <div className="rounded-lg border border-accent/30 bg-accent-soft/15 p-3 text-xs space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill text-[10px] text-white">{PLAN_LABEL[props.activeOverride.plan] ?? props.activeOverride.plan}</span>
              <span className="text-slate-300 font-medium">{labelForKind(props.activeOverride.kind)}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                from {fmtDate(props.activeOverride.effectiveFrom)}
                {" "}to {props.activeOverride.effectiveUntil ? fmtDate(props.activeOverride.effectiveUntil) : "indefinite"}
              </span>
            </div>
            {props.activeOverride.assignedByName ? (
              <div className="text-slate-500">Assigned by {props.activeOverride.assignedByName}</div>
            ) : null}
            {props.activeOverride.creditsGranted ? (
              <div className="text-slate-400">+{props.activeOverride.creditsGranted.toLocaleString()} credits granted on creation</div>
            ) : null}
            {props.activeOverride.note ? (
              <div className="text-slate-300 mt-1">&quot;{props.activeOverride.note}&quot;</div>
            ) : null}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => revokeOverride(props.activeOverride!.id)}
                disabled={pending}
                className="text-xs px-2.5 py-1 rounded-md border border-bad/40 text-bad hover:bg-bad/10 hover:border-bad transition disabled:opacity-50"
              >
                Revoke override
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">No active override.</div>
        )}
      </div>

      {/* Create override form ─────────────────────────────────────── */}
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Create override</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Plan</label>
            <select className="input" value={oPlan} onChange={(e) => setOPlan(e.target.value)}>
              {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Kind</label>
            <select className="input" value={oKind} onChange={(e) => setOKind(e.target.value)}>
              {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Effective until</label>
            <input type="date" className="input" value={oUntil} onChange={(e) => setOUntil(e.target.value)} placeholder="indefinite" />
          </div>
          <div>
            <label className="label">Bonus credits</label>
            <input
              type="number" min={0} step={1}
              className="input"
              value={oCredits}
              onChange={(e) => setOCredits(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Internal note</label>
            <input
              type="text"
              className="input"
              value={oNote}
              onChange={(e) => setONote(e.target.value)}
              placeholder="Why this override was granted (visible to admins only)"
              maxLength={1000}
            />
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          {KIND_OPTIONS.find((k) => k.value === oKind)?.hint}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={createOverride}
            disabled={pending}
            className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
          >
            Apply override
          </button>
        </div>
      </div>

      {/* Wallet ──────────────────────────────────────────────────── */}
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">AI Credits wallet</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat label="Balance"      value={props.walletBalance.toLocaleString()} accent />
          <Stat label="Monthly grant" value={props.monthlyAllowance.toLocaleString()} />
          <Stat label="Lifetime granted"  value={props.lifetimeGranted.toLocaleString()} />
          <Stat label="Lifetime consumed" value={props.lifetimeConsumed.toLocaleString()} />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="label">Grant amount</label>
            <input
              type="number" min={1} step={1}
              className="input"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reason (optional)</label>
            <input
              type="text"
              className="input"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              placeholder="Goodwill, lifetime deal, beta tester bonus..."
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={grantBonusCredits}
            disabled={pending}
            className="text-sm px-4 py-1.5 rounded-md border border-good/40 text-good hover:bg-good/10 hover:border-good transition disabled:opacity-50"
          >
            Grant credits
          </button>
        </div>
      </div>

      {/* History ─────────────────────────────────────────────────── */}
      {props.overrideHistory.length > 0 ? (
        <div className="border-t border-line pt-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Override history</div>
          <ul className="space-y-1.5 text-xs">
            {props.overrideHistory.map((o) => (
              <li key={o.id} className="flex items-start gap-2 text-slate-400">
                <span className="text-slate-600 mt-0.5">•</span>
                <span className="flex-1">
                  <span className="text-slate-200 font-medium">{PLAN_LABEL[o.plan] ?? o.plan}</span>
                  {" · "}
                  <span>{labelForKind(o.kind)}</span>
                  {" · "}
                  <span>{fmtDate(o.effectiveFrom)} → {o.revokedAt ? `revoked ${fmtDate(o.revokedAt)}` : o.effectiveUntil ? fmtDate(o.effectiveUntil) : "indefinite"}</span>
                  {o.assignedByName ? <span className="text-slate-500"> by {o.assignedByName}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Status row ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 text-xs h-4">
        {error ? <span className="text-bad">{error}</span> : null}
        {savedAt && !error ? <span className="text-good">Saved</span> : null}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line/60 bg-ink-950/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${accent ? "text-accent" : "text-slate-100"}`}>{value}</div>
    </div>
  );
}

function labelForKind(kind: string): string {
  return KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind;
}

function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
