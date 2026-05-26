"use client";

// Self-service billing UI. Five cards stacked top-to-bottom:
//   1. Plan summary       - effective plan + source + period end
//   2. Credit balance     - balance / allowance / usage progress
//   3. Redeem promo code  - same flow as the consultation widget
//   4. Credit packs       - placeholder until billing provider lands
//   5. Transaction ledger - last 25 with kind, delta, reason
//
// Pure presentation + the redeem POST. No new credit-mutation paths
// here - everything writes happen through existing billing APIs.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
// Direct submodule import - see note in BuyCreditsModal.tsx. Importing
// from the @/lib/billing barrel pulls entitlements.ts which pulls
// PrismaClient into the client bundle.
import {
  CUSTOM_PACK_SKU, CUSTOM_PACK_MIN_CREDITS, calculateCustomPackPriceCents,
} from "@/lib/billing/plans";
import UpgradeTriggerButton from "@/components/billing/UpgradeTriggerButton";
import CheckoutSuccessHandler from "@/components/billing/CheckoutSuccessHandler";

interface Transaction {
  id:           string;
  delta:        number;
  kind:         string;
  reason:       string | null;
  balanceAfter: number;
  expiresAt:    string | null;
  createdAt:    string;
}

interface PlanOption {
  key:            string;
  label:          string;
  priceCents:     number;
  monthlyCredits: number;
}

interface BillingClientProps {
  plan:              string;
  planSource:        "override" | "subscription" | "default";
  readOnly:          boolean;
  currentPeriodEnd:  string | null;
  cancelAtPeriodEnd: boolean;
  walletBalance:     number;
  monthlyAllowance:  number;
  periodStart:       string | null;
  lifetimeGranted:   number;
  lifetimeConsumed:  number;
  creditCosts:       Record<string, number>;
  creditPacks:       { sku: string; credits: number; priceCents: number }[];
  availablePlans:    PlanOption[];
  transactions:      Transaction[];
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro",
  // Legacy "business" rows roll up to Pro in the entitlements layer.
  business: "Pro",
};

const KIND_LABEL: Record<string, string> = {
  monthly_grant: "Monthly grant",
  consume:       "AI usage",
  purchase:      "Credit pack purchase",
  admin_grant:   "Admin grant",
  coupon:        "Coupon",
  expiry:        "Pack expiry",
  adjustment:    "Adjustment",
};

const COST_LABEL: Record<string, string> = {
  consultationMessage: "Ask the AI advisor",
  deepAnalysis:        "Deep analysis on a signal",
  forecastGeneration:  "Generate a fresh forecast",
  scenarioRun:         "Run a scenario",
};

function fmtUSD(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BillingClient(props: BillingClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Free workspaces show a one-time starter denominator (lifetimeGranted)
  // since their monthlyAllowance is 0. Pro shows the recurring monthly
  // allowance. Either way pct = current / denom.
  const denominator = props.monthlyAllowance > 0 ? props.monthlyAllowance : props.lifetimeGranted;
  const pct = denominator > 0
    ? Math.max(0, Math.min(100, Math.round((props.walletBalance / denominator) * 100)))
    : 0;

  // Redeem code state
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Checkout state - the disabled buttons get a busy label while we
  // round-trip to Polar for a checkout/portal URL, then redirect.
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Custom-pack draft. Lives in the packs card and previews the
  // sliding-scale price live as the user types.
  const [customCredits, setCustomCredits] = useState<string>(String(CUSTOM_PACK_MIN_CREDITS));
  const customCreditsNum = Math.floor(Number(customCredits));
  const customValid = Number.isFinite(customCreditsNum) && customCreditsNum >= CUSTOM_PACK_MIN_CREDITS;
  const customPriceCents = customValid ? calculateCustomPackPriceCents(customCreditsNum) : 0;

  async function openCheckout(endpoint: string, body?: object, busyKey = "checkout") {
    setCheckoutBusy(busyKey);
    setCheckoutError(null);
    try {
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({} as { url?: string; message?: string }));
      if (!res.ok || !data.url) {
        setCheckoutError(data.message ?? "Could not open checkout. Try again in a moment.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setCheckoutError("Network error - check your connection.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  async function redeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const res  = await fetch("/api/billing/coupons/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({} as { message?: string; summary?: string }));
      if (!res.ok || !data.ok) {
        setRedeemMsg({ ok: false, text: data.message ?? "Couldn't apply that code." });
        return;
      }
      setRedeemMsg({ ok: true, text: `${data.summary ?? "Coupon applied"} ✓` });
      setCode("");
      startTransition(() => router.refresh());
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Post-checkout poller. Renders nothing on normal loads; on
          ?checkout=success it polls /api/billing/credits until the
          webhook lands, then router.refresh()'s every server-rendered
          surface so the new plan + credit balance appear without the
          user having to refresh manually. */}
      <CheckoutSuccessHandler
        initialPlan={props.plan}
        initialBalance={props.walletBalance}
      />
      {/* Plan summary */}
      <section className="card">
        <div className="font-medium mb-1">Plan</div>
        <div className="text-xs text-slate-400 mb-4">
          Your active plan for this workspace, who it&apos;s sourced from, and
          when the current period rolls.
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-semibold text-slate-100">{PLAN_LABEL[props.plan] ?? props.plan}</span>
              {props.planSource === "override" ? (
                <span className="pill text-[10px]">Admin override</span>
              ) : props.planSource === "default" ? (
                <span className="pill text-[10px]">Free tier</span>
              ) : null}
              {props.readOnly ? (
                <span className="pill-warn text-[10px]">Read-only</span>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {props.currentPeriodEnd ? (
                <>Current period ends {fmtDate(props.currentPeriodEnd)}{props.cancelAtPeriodEnd ? " · cancels at period end" : ""}</>
              ) : (
                <>No active subscription. Free forever; upgrade when ready.</>
              )}
            </div>
          </div>
          {props.plan === "free" ? (
            <UpgradeTriggerButton
              currentPlan={props.plan}
              feature="Pro plan"
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
            >
              Upgrade to Pro
            </UpgradeTriggerButton>
          ) : (
            <button
              type="button"
              onClick={() => openCheckout("/api/billing/portal", undefined, "portal")}
              disabled={checkoutBusy === "portal"}
              className="text-sm px-4 py-2 rounded-md border border-line text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
            >
              {checkoutBusy === "portal" ? "Opening portal…" : "Manage subscription"}
            </button>
          )}
        </div>

        {/* Compare plans inline so the user has the quick view */}
        <div className="mt-5 pt-5 border-t border-line/50 grid sm:grid-cols-2 gap-3">
          {props.availablePlans.map((p) => (
            <div
              key={p.key}
              className={`rounded-lg border px-3 py-2 ${
                p.key === props.plan
                  ? "border-accent/60 bg-accent-soft/15"
                  : "border-line bg-ink-950/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white">{p.label}</div>
                <div className="text-xs text-slate-300">
                  {p.priceCents === 0 ? "Free" : `${fmtUSD(p.priceCents)}/mo`}
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {p.monthlyCredits.toLocaleString()} AI Credits / month
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credit balance */}
      <section className="card">
        <div className="font-medium mb-1">
          {props.plan === "free" ? "Starter AI Credits" : "AI Credits"}
        </div>
        <div className="text-xs text-slate-400 mb-4">
          {props.plan === "free"
            ? "One-time grant on Free workspaces. Upgrade to Pro for a monthly allowance + the ability to buy more anytime."
            : "Your monthly allowance plus any add-on packs. Reset at the start of every calendar month."}
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-white tabular-nums">{props.walletBalance.toLocaleString()}</span>
              <span className="text-sm text-slate-500">
                {props.plan === "free"
                  ? <>of {denominator.toLocaleString()} starter credits</>
                  : <>of {props.monthlyAllowance.toLocaleString()} this month</>}
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-ink-700/80 overflow-hidden max-w-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-teal"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {props.plan === "free" ? (
                <>
                  Starter AI Credits are a one-time grant on Free workspaces - they don&apos;t renew.
                  Upgrade to Pro to receive {(500).toLocaleString()} AI Credits every month + the ability to buy add-on credit packs.
                </>
              ) : (
                <>
                  Plan credits reset at the start of every calendar month
                  {props.periodStart ? <> · current period started {fmtDate(props.periodStart)}</> : null}.
                  Add-on credit packs don&apos;t reset; they expire 12 months after purchase.
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs shrink-0">
            <Stat label="Lifetime granted"  value={props.lifetimeGranted.toLocaleString()} />
            <Stat label="Lifetime used"     value={props.lifetimeConsumed.toLocaleString()} />
          </div>
        </div>

        {/* Cost reference */}
        <div className="mt-5 pt-5 border-t border-line/50">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">What credits cost</div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {Object.entries(props.creditCosts).map(([k, n]) => (
              <li key={k} className="flex items-center justify-between gap-3 text-slate-300">
                <span>{COST_LABEL[k] ?? k}</span>
                <span className="text-slate-500 tabular-nums">{n} credit{n === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Redeem promo code */}
      <section className="card">
        <div className="font-medium mb-1">Promo code</div>
        <div className="text-xs text-slate-400 mb-4">
          Have a code from a launch campaign, partner, or beta program?
          Apply it here - credit codes land instantly; discount codes
          apply at the next invoice.
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            className="input font-mono uppercase max-w-xs"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER PROMO CODE"
            disabled={redeeming}
            maxLength={64}
            onKeyDown={(e) => { if (e.key === "Enter") redeem() }}
          />
          <button
            type="button"
            onClick={redeem}
            disabled={redeeming || !code.trim()}
            className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
          >
            {redeeming ? "Applying…" : "Apply"}
          </button>
          {redeemMsg ? (
            <span className={`text-xs ${redeemMsg.ok ? "text-good" : "text-bad"}`}>{redeemMsg.text}</span>
          ) : null}
        </div>
      </section>

      {/* Credit packs - Pro only. Free workspaces can't buy add-on
          credits; instead they see an upgrade prompt that explains the
          Pro flow (monthly credits + ability to buy more anytime). */}
      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div className="font-medium">
            {props.plan === "free" ? "Need more AI power?" : "Buy more credits"}
          </div>
          {props.plan === "free" ? (
            <UpgradeTriggerButton
              currentPlan={props.plan}
              feature="Pro plan"
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition shrink-0"
            >
              Upgrade to Pro →
            </UpgradeTriggerButton>
          ) : null}
        </div>
        <div className="text-xs text-slate-400 mb-4">
          {props.plan === "free"
            ? "Upgrade to Pro to get 500 AI Credits delivered every month. Pro also unlocks add-on credit packs whenever you want extra power on top of your monthly allowance, so you'll always have the credits you need on hand."
            : "Add-on credit packs add instantly, expire 12 months after purchase, and work on top of your monthly allowance."}
        </div>
        {props.plan !== "free" ? (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {props.creditPacks.map((pack) => (
            <div key={pack.sku} className="rounded-lg border border-line bg-ink-950/40 px-3 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">+{pack.credits.toLocaleString()} AI Credits</div>
                <div className="text-[11px] text-slate-500">Expires 12 months after purchase</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300 font-semibold">{fmtUSD(pack.priceCents)}</span>
                <button
                  type="button"
                  onClick={() => openCheckout("/api/billing/checkout/pack", { sku: pack.sku }, `pack:${pack.sku}`)}
                  disabled={checkoutBusy === `pack:${pack.sku}`}
                  className="text-xs px-3 py-1 rounded-md border border-accent/40 bg-accent-soft/30 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-60"
                >
                  {checkoutBusy === `pack:${pack.sku}` ? "Opening…" : "Buy"}
                </button>
              </div>
            </div>
          ))}

          {/* Custom amount tile. Server enforces the same minimum +
              sliding-scale price, but we mirror them client-side for
              a live preview. */}
          <div className="rounded-lg border border-line bg-ink-950/40 px-3 py-3 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Custom AI Credits</div>
                <div className="text-[11px] text-slate-500">
                  Minimum {CUSTOM_PACK_MIN_CREDITS} · 30¢/credit under 50 · 28¢ from 50 · 19¢ from 100+
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  inputMode="numeric"
                  min={CUSTOM_PACK_MIN_CREDITS}
                  step={1}
                  className="input w-28 text-right tabular-nums"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  aria-label="Custom credit amount"
                />
                <span className="text-xs text-slate-400">credits</span>
                <span className="text-sm text-slate-300 font-semibold tabular-nums min-w-[60px] text-right">
                  {customValid ? fmtUSD(customPriceCents) : " - "}
                </span>
                <button
                  type="button"
                  onClick={() => openCheckout(
                    "/api/billing/checkout/pack",
                    { sku: CUSTOM_PACK_SKU, credits: customCreditsNum },
                    `pack:${CUSTOM_PACK_SKU}`,
                  )}
                  disabled={!customValid || checkoutBusy === `pack:${CUSTOM_PACK_SKU}`}
                  className="text-xs px-3 py-1 rounded-md border border-accent/40 bg-accent-soft/30 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {checkoutBusy === `pack:${CUSTOM_PACK_SKU}` ? "Opening…" : "Buy"}
                </button>
              </div>
            </div>
            {!customValid && customCredits !== "" ? (
              <div className="mt-2 text-[11px] text-warn">
                Minimum {CUSTOM_PACK_MIN_CREDITS} credits.
              </div>
            ) : null}
          </div>
        </div>
        ) : null}
        {checkoutError ? (
          <div className="mt-3 text-[11px] text-bad">{checkoutError}</div>
        ) : null}
      </section>

      {/* Transaction history */}
      <section className="card">
        <div className="font-medium mb-1">Recent credit activity</div>
        <div className="text-xs text-slate-400 mb-4">
          Every grant, purchase, refund and consumption against this
          workspace&apos;s wallet, newest first.
        </div>
        {props.transactions.length === 0 ? (
          <div className="text-xs text-slate-500">No credit activity yet. Try asking the AI advisor a question.</div>
        ) : (
          <div className="rounded-lg border border-line overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-ink-900/60 text-left text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium text-right">Change</th>
                  <th className="px-3 py-2 font-medium text-right">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {props.transactions.map((t) => (
                  <tr key={t.id} className="border-t border-line/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                    <td className="px-3 py-2 text-slate-300">{KIND_LABEL[t.kind] ?? t.kind}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-xs truncate" title={t.reason ?? ""}>{t.reason ?? " - "}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-medium ${t.delta < 0 ? "text-bad" : "text-good"}`}>
                      {t.delta > 0 ? "+" : ""}{t.delta.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{t.balanceAfter.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-ink-950/40 px-3 py-2 min-w-[7rem]">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-100 tabular-nums">{value}</div>
    </div>
  );
}
