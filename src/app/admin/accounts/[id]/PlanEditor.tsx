"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Mirrors src/lib/billing/plans.ts PLAN_KEYS. Legacy strings
// ("starter", "enterprise", "custom") are kept selectable on purpose
// so legacy rows still round-trip through the admin UI without
// becoming uneditable - normalizePlan elsewhere drops them to "free"
// at read time.
const PLANS = ["free", "pro", "business", "starter", "enterprise", "custom"];

export function PlanEditor({
  businessId,
  plan,
  trialEndsAt,
}: {
  businessId: string;
  plan: string;
  trialEndsAt: string | null;
}) {
  const router = useRouter();
  const [planVal, setPlan] = useState(plan);
  const [trial, setTrial] = useState(trialEndsAt ? trialEndsAt.slice(0, 10) : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setError(null);
    const res = await fetch(`/api/admin/accounts/${businessId}/plan`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: planVal,
        trialEndsAt: trial || null,
      }),
    });
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    setSavedAt(Date.now());
    startTransition(() => router.refresh());
  }

  async function extendTrial(days: number) {
    const base = trial ? new Date(trial) : new Date();
    base.setDate(base.getDate() + days);
    const iso = base.toISOString().slice(0, 10);
    setTrial(iso);
    setError(null);
    const res = await fetch(`/api/admin/accounts/${businessId}/plan`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trialEndsAt: iso }),
    });
    if (!res.ok) { setError("Failed to extend trial"); return; }
    setSavedAt(Date.now());
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-100 mb-1">Plan & trial</div>
        <p className="text-xs text-slate-500">
          Operator-set plan label and trial-end date. Replace with the source-of-truth from
          your billing provider once it&apos;s wired up.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Plan</label>
          <select
            className="input"
            value={planVal}
            onChange={(e) => setPlan(e.target.value)}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Trial ends</label>
          <input
            type="date"
            value={trial}
            onChange={(e) => setTrial(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => extendTrial(7)}  className="text-xs px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition">+7 days</button>
          <button type="button" onClick={() => extendTrial(14)} className="text-xs px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition">+14 days</button>
          <button type="button" onClick={() => extendTrial(30)} className="text-xs px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition">+30 days</button>
        </div>
        <div className="flex items-center gap-2">
          {error ? <span className="text-xs text-bad">{error}</span> : null}
          {savedAt && !error ? <span className="text-xs text-good">Saved</span> : null}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
