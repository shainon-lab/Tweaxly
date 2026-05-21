"use client";

// Shared coupon create/edit form. Rendered in both the /new page
// (mode="create") and the /[id] detail page (mode="edit"). Field
// label for the `value` input shifts based on the chosen kind so
// admins can't enter 200% off or 7-day discounts.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface InitialCoupon {
  id?:               string;
  code?:             string;
  kind?:             string;
  value?:            number;
  maxRedemptions?:   number | null;
  maxPerUser?:       number | null;
  startsAt?:         string | null;
  expiresAt?:        string | null;
  applicablePlans?:  string[];
  excludedPlans?:    string[];
  billingCycle?:     string | null;
  cycleCount?:       number | null;
  targetEmail?:      string | null;
  internalNote?:     string | null;
  disabled?:         boolean;
}

interface CouponFormProps {
  mode:    "create" | "edit";
  initial?: InitialCoupon;
}

const KIND_OPTIONS: { value: string; label: string; valueLabel: string; hint: string }[] = [
  { value: "percentage",      label: "Percentage discount", valueLabel: "Percent off (0-100)",       hint: "Reduces the invoice by a percentage." },
  { value: "fixed_amount",    label: "Fixed-amount discount", valueLabel: "Discount in cents (USD)", hint: "Reduces the invoice by a fixed amount, in cents." },
  { value: "credits",         label: "Bonus AI Credits",     valueLabel: "Credits to grant",          hint: "Granted to the redeeming business via the standard ledger." },
  { value: "trial_extension", label: "Trial extension",      valueLabel: "Days of trial to add",      hint: "Extends the trial-end date by this many days." },
];

const BILLING_CYCLES: { value: string; label: string }[] = [
  { value: "",                  label: "(default - applies once)" },
  { value: "first_payment",     label: "First payment only" },
  { value: "recurring_forever", label: "Recurring forever" },
  { value: "limited_cycles",    label: "Limited number of cycles" },
];

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: "free",     label: "Free" },
  { value: "pro",      label: "Pro" },
  { value: "business", label: "Business" },
];

export function CouponForm({ mode, initial }: CouponFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(initial?.code ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "credits");
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : "");
  const [maxRedemptions, setMaxRedemptions] = useState(initial?.maxRedemptions != null ? String(initial.maxRedemptions) : "");
  const [maxPerUser, setMaxPerUser] = useState(initial?.maxPerUser != null ? String(initial.maxPerUser) : "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt?.slice(0, 10) ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt?.slice(0, 10) ?? "");
  const [applicablePlans, setApplicablePlans] = useState<string[]>(initial?.applicablePlans ?? []);
  const [excludedPlans, setExcludedPlans] = useState<string[]>(initial?.excludedPlans ?? []);
  const [billingCycle, setBillingCycle] = useState(initial?.billingCycle ?? "");
  const [cycleCount, setCycleCount] = useState(initial?.cycleCount != null ? String(initial.cycleCount) : "");
  const [targetEmail, setTargetEmail] = useState(initial?.targetEmail ?? "");
  const [internalNote, setInternalNote] = useState(initial?.internalNote ?? "");
  const [disabled, setDisabled] = useState(initial?.disabled ?? false);

  const kindMeta = KIND_OPTIONS.find((k) => k.value === kind);
  const isDiscount = kind === "percentage" || kind === "fixed_amount";

  async function save() {
    setError(null);
    if (mode === "create" && !code.trim()) { setError("Code is required"); return }
    const valueNum = Number(value);
    if (!Number.isFinite(valueNum) || valueNum <= 0) { setError("Value must be a positive number"); return }
    if (kind === "percentage" && valueNum > 100) { setError("Percentage must be 0-100"); return }

    const body: Record<string, unknown> = {
      kind,
      value: Math.floor(valueNum),
      maxRedemptions:  maxRedemptions  ? Math.floor(Number(maxRedemptions)) : null,
      maxPerUser:      maxPerUser      ? Math.floor(Number(maxPerUser))     : null,
      startsAt:        startsAt        || null,
      expiresAt:       expiresAt       || null,
      applicablePlans: applicablePlans,
      excludedPlans:   excludedPlans,
      billingCycle:    isDiscount && billingCycle ? billingCycle : null,
      cycleCount:      isDiscount && billingCycle === "limited_cycles" && cycleCount ? Math.floor(Number(cycleCount)) : null,
      targetEmail:     targetEmail.trim() || null,
      internalNote:    internalNote.trim() || null,
      disabled,
    };
    if (mode === "create") body.code = code.trim();

    const url = mode === "create"
      ? "/api/admin/coupons"
      : `/api/admin/coupons/${initial!.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = (await res.text()) || "Save failed";
      setError(msg);
      return;
    }
    if (mode === "create") {
      const data = await res.json();
      router.push(`/admin/coupons/${data.coupon.id}`);
    } else {
      startTransition(() => router.refresh());
    }
  }

  function togglePlan(list: string[], setList: (v: string[]) => void, plan: string) {
    setList(list.includes(plan) ? list.filter((p) => p !== plan) : [...list, plan]);
  }

  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-5 space-y-6 max-w-3xl">
      {/* Code + kind */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Code</label>
          <input
            type="text"
            className="input font-mono uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LAUNCH50"
            disabled={mode === "edit"}
            maxLength={64}
          />
          {mode === "edit" ? (
            <div className="text-[11px] text-slate-500 mt-1">Code is fixed once created.</div>
          ) : null}
        </div>
        <div>
          <label className="label">Kind</label>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} disabled={mode === "edit"}>
            {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          {kindMeta ? <div className="text-[11px] text-slate-500 mt-1">{kindMeta.hint}</div> : null}
        </div>
      </div>

      {/* Value */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">{kindMeta?.valueLabel ?? "Value"}</label>
          <input
            type="number" min={0} step={1}
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Max redemptions</label>
          <input
            type="number" min={0} step={1}
            className="input"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="unlimited"
          />
        </div>
        <div>
          <label className="label">Max per user</label>
          <input
            type="number" min={0} step={1}
            className="input"
            value={maxPerUser}
            onChange={(e) => setMaxPerUser(e.target.value)}
            placeholder="unlimited"
          />
        </div>
      </div>

      {/* Window */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Starts at</label>
          <input type="date" className="input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="label">Expires at</label>
          <input type="date" className="input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      {/* Plan restrictions */}
      <div>
        <div className="label">Applicable plans (empty = all)</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {PLAN_OPTIONS.map((p) => (
            <label key={p.value} className="text-xs flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={applicablePlans.includes(p.value)}
                onChange={() => togglePlan(applicablePlans, setApplicablePlans, p.value)}
              />
              <span className="text-slate-300">{p.label}</span>
            </label>
          ))}
        </div>
        <div className="label mt-3">Excluded plans</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {PLAN_OPTIONS.map((p) => (
            <label key={p.value} className="text-xs flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={excludedPlans.includes(p.value)}
                onChange={() => togglePlan(excludedPlans, setExcludedPlans, p.value)}
              />
              <span className="text-slate-300">{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Billing cycle - only for discount coupons */}
      {isDiscount ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Billing cycle behaviour</label>
            <select className="input" value={billingCycle ?? ""} onChange={(e) => setBillingCycle(e.target.value || null as unknown as string)}>
              {BILLING_CYCLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {billingCycle === "limited_cycles" ? (
            <div>
              <label className="label">Number of cycles</label>
              <input
                type="number" min={1} step={1}
                className="input"
                value={cycleCount}
                onChange={(e) => setCycleCount(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Targeting */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Target email (optional)</label>
          <input
            type="email"
            className="input"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="leave blank to allow any user"
          />
        </div>
      </div>

      {/* Internal note + disabled */}
      <div>
        <label className="label">Internal note</label>
        <input
          type="text"
          className="input"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Campaign context (visible to admins only)"
        />
      </div>
      <div>
        <label className="text-xs flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-accent"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          <span className="text-slate-300">Disabled (existing code, paused for now)</span>
        </label>
      </div>

      {/* Submit row */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-line">
        <div className="text-xs">
          {error ? <span className="text-bad">{error}</span> : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
        >
          {mode === "create" ? "Create coupon" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
