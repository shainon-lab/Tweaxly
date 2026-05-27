"use client";

// Self-service billing UI. Three cards stacked top-to-bottom:
//   1. Plan         - effective plan + source + period end + inline
//                     promo-code redeem (no separate promo-code card)
//   2. AI Credits   - balance / allowance / progress / Upgrade or Buy
//                     credits action (replaces the old standalone
//                     "Need more AI power?" card)
//   3. Transactions - last 25 with kind, delta, reason
//
// Pure presentation + the redeem POST. No new credit-mutation paths
// here - everything writes happen through existing billing APIs.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import UpgradeTriggerButton from "@/components/billing/UpgradeTriggerButton";
import CheckoutSuccessHandler from "@/components/billing/CheckoutSuccessHandler";
import BuyCreditsModal from "@/components/billing/BuyCreditsModal";

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

  // Pro users open this to buy add-on credit packs. Free users see
  // "Upgrade to Pro" instead of "Buy Credits" - that flow goes
  // through UpgradeTriggerButton, not this modal.
  const [buyOpen, setBuyOpen] = useState(false);

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
      {/* Plan + inline promo redeem */}
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

        {/* Inline promo redeem - no longer a separate section. Credit
            codes land instantly; discount codes apply at the next
            invoice. */}
        <div className="mt-5 pt-5 border-t border-line/50">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Promo code</div>
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
        </div>
      </section>

      {/* AI Credits - same surface for Free and Pro. The action button
          in the header flips: Free shows "Upgrade to Pro" (with the
          long pro-pitch copy below the balance), Pro shows "Buy
          Credits" (no extra copy - the action speaks for itself). */}
      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div className="min-w-0">
            <div className="font-medium">AI Credits</div>
            <div className="text-xs text-slate-400 mt-1 leading-snug">
              {props.plan === "free"
                ? "Your one-time starter grant on the Free plan."
                : "Your monthly allowance plus any add-on packs. Reset at the start of every calendar month."}
            </div>
          </div>
          {props.plan === "free" ? (
            <UpgradeTriggerButton
              currentPlan={props.plan}
              feature="Pro plan"
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition shrink-0"
            >
              Upgrade to Pro
            </UpgradeTriggerButton>
          ) : (
            <button
              type="button"
              onClick={() => setBuyOpen(true)}
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition shrink-0"
            >
              Buy Credits
            </button>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
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
            {props.plan === "free" ? (
              <div className="mt-4 text-xs text-slate-300 leading-relaxed">
                Upgrade to Pro to get 500 AI Credits delivered every month.
                Pro also unlocks add-on credit packs whenever you want extra
                power on top of your monthly allowance, so you&apos;ll always
                have the credits you need on hand.
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">
                Plan credits reset at the start of every calendar month
                {props.periodStart ? <> · current period started {fmtDate(props.periodStart)}</> : null}.
                Add-on credit packs don&apos;t reset; they expire 12 months after purchase.
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs shrink-0">
            <Stat label="Lifetime granted" value={props.lifetimeGranted.toLocaleString()} />
            <Stat label="Lifetime used"    value={props.lifetimeConsumed.toLocaleString()} />
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
        {checkoutError ? (
          <div className="mt-3 text-[11px] text-bad">{checkoutError}</div>
        ) : null}
      </section>

      {/* Buy Credits modal - opened by the Pro-only button in the AI
          Credits header. Hosts the same fixed packs + custom amount
          buying UI that used to live inline on this page. */}
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />

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

      {/* Orders & Invoices lives under Account → Orders & Invoices
          now (tied to the paying user, not the workspace) - so it no
          longer renders here. */}
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
