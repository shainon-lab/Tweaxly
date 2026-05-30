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
import CreditsBar, { isLowCredits } from "@/components/billing/CreditsBar";

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
  // Pending plan switch (e.g. Business → Pro at next renewal). Null
  // when no scheduled change is active.
  scheduledDowngradeTo: string | null;
  // Workspace + member usage stats. workspacesCap is per-user
  // (Free=1, Pro=3, Business=unlimited); membersCap is per-workspace
  // (Free=1, Pro=3, Business=6). "unlimited" string preserved verbatim.
  workspacesUsed:    number;
  workspacesCap:     number | "unlimited";
  membersUsed:       number;
  membersCap:        number | "unlimited";
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
  free:     "Free",
  pro:      "Pro",
  business: "Executive",
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
  // Local mirror of cancelAtPeriodEnd so the UI reflects a successful
  // schedule / un-schedule instantly. The Polar webhook will round-
  // trip the canonical state but we don't want to wait for it on
  // the page the user just clicked.
  const [cancelScheduled, setCancelScheduled] = useState(props.cancelAtPeriodEnd);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // Local mirror for in-place plan-change calls (Pro → Business
  // and Business → Pro). Both use the same /api/billing/change-plan
  // endpoint; this state holds whichever plan is being targeted so
  // the right button shows its spinner.
  const [changingTo, setChangingTo] = useState<"pro" | "business" | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  // Optimistic mirror of scheduledDowngradeTo so the UI updates
  // immediately when the user schedules a Business → Pro switch.
  const [scheduledDowngrade, setScheduledDowngrade] = useState(props.scheduledDowngradeTo);

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

  // Self-service "schedule downgrade to Free". Polar cancels at
  // period end; the user keeps their tier until renewal day, then
  // the workspace returns to Free via the canceled-subscription
  // webhook. `undo` flips the same Polar flag back to false.
  async function toggleCancel(undo: boolean) {
    setCancelBusy(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/billing/cancel-subscription", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ undo }),
      });
      const data = await res.json().catch(() => ({} as { message?: string }));
      if (!res.ok) {
        setCancelError(data.message ?? "Could not update subscription. Try again in a moment.");
        return;
      }
      setCancelScheduled(!undo);
      // Refresh server-rendered state so cards relying on plan /
      // cancelAtPeriodEnd update without a hard reload.
      startTransition(() => router.refresh());
    } catch {
      setCancelError("Network error - check your connection.");
    } finally {
      setCancelBusy(false);
    }
  }

  // In-place plan switch via /api/billing/change-plan. Upgrades
  // (Pro → Business) charge prorated immediately; downgrades
  // (Business → Pro) schedule at period_end. The endpoint handles
  // both via the same body shape.
  async function changePlan(target: "pro" | "business") {
    setChangingTo(target);
    setChangeError(null);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ target }),
      });
      const data = await res.json().catch(() => ({} as { message?: string; appliedAt?: string }));
      if (!res.ok) {
        setChangeError(data.message ?? "Could not change plan. Try again in a moment.");
        return;
      }
      if (data.appliedAt === "period_end") {
        setScheduledDowngrade(target);
      } else {
        // Immediate switch: clear any pending downgrade and let
        // router.refresh pull the canonical plan from the server.
        setScheduledDowngrade(null);
      }
      startTransition(() => router.refresh());
    } catch {
      setChangeError("Network error - check your connection.");
    } finally {
      setChangingTo(null);
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
                <>Current period ends {fmtDate(props.currentPeriodEnd)}{cancelScheduled ? " · cancels at period end" : ""}</>
              ) : (
                <>No active subscription. Free forever; upgrade when ready.</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Subscription management buttons (Manage subscription,
                change-plan, schedule downgrade) only make sense when
                the workspace's effective plan came from a real Polar
                subscription. Admin overrides and default-free
                fallbacks have no Polar customer/sub to act on - the
                /api/billing/portal + change-plan + cancel endpoints
                all return 400 in that case. Show the upgrade modal
                instead so an override'd Pro can still START a real
                subscription if they want one. */}
            {props.planSource !== "subscription" ? (
              props.plan === "free" ? (
                <UpgradeTriggerButton
                  currentPlan={props.plan}
                  feature="paid plan"
                  className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
                >
                  Upgrade your workspace
                </UpgradeTriggerButton>
              ) : (
                // Admin-override Pro / Business workspaces. No active
                // billing relationship - the entitlement is gifted.
                // Surface a small explanatory line so the user knows
                // why there's nothing to click.
                <div className="t-meta text-slate-500 max-w-xs text-right">
                  Plan granted by admin override.{" "}
                  {props.planSource === "override" ? "Contact support to change." : null}
                </div>
              )
            ) : props.plan === "pro" ? (
              <>
                {/* Pro → Business is an in-place plan switch with
                    immediate proration via /api/billing/change-plan.
                    Polar charges the prorated difference now and
                    Business entitlements apply immediately. */}
                <button
                  type="button"
                  onClick={() => changePlan("business")}
                  disabled={changingTo !== null}
                  className="text-sm px-4 py-2 rounded-md border border-brand-purple/40 bg-brand-purple/15 text-brand-purple font-medium hover:bg-brand-purple/25 hover:border-brand-purple hover:text-white transition disabled:opacity-60"
                >
                  {changingTo === "business" ? "Upgrading…" : "Upgrade"}
                </button>
                <button
                  type="button"
                  onClick={() => openCheckout("/api/billing/portal", undefined, "portal")}
                  disabled={checkoutBusy === "portal"}
                  className="text-sm px-4 py-2 rounded-md border border-line text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                >
                  {checkoutBusy === "portal" ? "Opening portal…" : "Manage subscription"}
                </button>
              </>
            ) : props.plan === "business" ? (
              <>
                {/* Business → Pro is a scheduled product swap. Polar
                    keeps the Business entitlements until period_end,
                    then automatically swaps. No mid-cycle refund. */}
                <button
                  type="button"
                  onClick={() => changePlan("pro")}
                  disabled={changingTo !== null || scheduledDowngrade === "pro"}
                  className="text-sm px-4 py-2 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                >
                  {changingTo === "pro" ? "Scheduling…" : scheduledDowngrade === "pro" ? "Downgrade scheduled" : "Schedule downgrade to Pro"}
                </button>
                <button
                  type="button"
                  onClick={() => openCheckout("/api/billing/portal", undefined, "portal")}
                  disabled={checkoutBusy === "portal"}
                  className="text-sm px-4 py-2 rounded-md border border-line text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                >
                  {checkoutBusy === "portal" ? "Opening portal…" : "Manage subscription"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {changeError ? (
          <div className="mt-3 t-meta text-bad">{changeError}</div>
        ) : null}

        {/* Pending Business → Pro switch. Shown on Business workspaces
            after the user clicks "Schedule downgrade to Pro". Polar
            swaps the product at the period boundary; the webhook
            clears scheduledDowngrade once the change lands.
            Only meaningful when planSource is a real subscription -
            admin overrides never carry scheduled changes. */}
        {scheduledDowngrade === "pro" && props.currentPeriodEnd && props.planSource === "subscription" ? (
          <div className="mt-5 pt-5 border-t border-line/50">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="t-body text-slate-300">
                This workspace will switch to <strong>Pro</strong> on{" "}
                <span className="text-slate-100 font-medium">{fmtDate(props.currentPeriodEnd)}</span>.
                You&apos;ll keep Executive access until then.
              </div>
              <button
                type="button"
                onClick={() => changePlan("business")}
                disabled={changingTo !== null}
                className="text-sm px-3 py-1.5 rounded-md border border-brand-purple/40 text-brand-purple hover:text-white hover:border-brand-purple transition disabled:opacity-60"
              >
                {changingTo === "business" ? "Updating…" : "Keep Executive"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Scheduled downgrade to Free. Paid workspaces with a real
            Polar subscription get a self-service "downgrade to Free
            at the next renewal" toggle. The subscription keeps
            working until period end, then auto-cancels via Polar's
            cancelAtPeriodEnd. Admin-override workspaces hide this
            row - there's no Polar sub to cancel. */}
        {props.plan !== "free" && props.currentPeriodEnd && props.planSource === "subscription" ? (
          <div className="mt-5 pt-5 border-t border-line/50">
            {cancelScheduled ? (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="t-body text-slate-300">
                  This workspace will downgrade to <strong>Free</strong> on{" "}
                  <span className="text-slate-100 font-medium">{fmtDate(props.currentPeriodEnd)}</span>.
                  You&apos;ll keep {PLAN_LABEL[props.plan] ?? props.plan} access until then.
                </div>
                <button
                  type="button"
                  onClick={() => toggleCancel(true)}
                  disabled={cancelBusy}
                  className="text-sm px-3 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                >
                  {cancelBusy ? "Updating…" : "Keep my subscription"}
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="t-meta text-slate-500">
                  Want to step back to Free? You&apos;ll keep your current
                  plan until {fmtDate(props.currentPeriodEnd)} and then
                  automatically move to Free. No mid-cycle refunds.
                </div>
                <button
                  type="button"
                  onClick={() => toggleCancel(false)}
                  disabled={cancelBusy}
                  className="text-sm px-3 py-1.5 rounded-md border border-line text-slate-400 hover:text-bad hover:border-bad/40 transition disabled:opacity-60"
                >
                  {cancelBusy ? "Scheduling…" : "Schedule downgrade to Free"}
                </button>
              </div>
            )}
            {cancelError ? (
              <div className="mt-2 t-meta text-bad">{cancelError}</div>
            ) : null}
          </div>
        ) : null}

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

      {/* Usage - workspaces + members on the current plan. Reads
          counts from the server props (computed via
          getWorkspaceCapStatus + a per-workspace member query) so
          numbers are accurate at page load. Grandfathered accounts
          with more workspaces than the new cap allow show "5 of 3"
          - the create path is still gated on the API side, so this
          surface is read-only. */}
      <section className="card">
        <div className="font-medium mb-1">Usage</div>
        <div className="text-xs text-slate-400 mb-4">
          Workspace count and member seat usage on the current plan.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UsageStat
            label="Workspaces you own"
            used={props.workspacesUsed}
            cap={props.workspacesCap}
          />
          <UsageStat
            label="Members in this workspace"
            used={props.membersUsed}
            cap={props.membersCap}
            hint="Owner + active members + pending invitations."
          />
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
              feature="paid plan"
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition shrink-0"
            >
              Upgrade
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
            <div className="mt-3 max-w-md">
              <CreditsBar balance={props.walletBalance} total={denominator} size="md" />
            </div>
            {isLowCredits(props.walletBalance, denominator) ? (
              <div className="mt-3 max-w-md rounded-md border border-warn/40 bg-warn/10 px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-warn font-medium">
                  You&apos;re running out of credits - {props.walletBalance.toLocaleString()} of {denominator.toLocaleString()} left
                </div>
                {props.plan === "free" ? (
                  <UpgradeTriggerButton
                    currentPlan={props.plan}
                    feature="paid plan"
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-white hover:bg-brand-purple-deep transition"
                  >
                    Upgrade
                  </UpgradeTriggerButton>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuyOpen(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-white hover:bg-brand-purple-deep transition"
                  >
                    Buy Credits
                  </button>
                )}
              </div>
            ) : null}
            {props.plan === "free" ? (
              <div className="mt-4 text-xs text-slate-300 leading-relaxed">
                Upgrade to a paid plan to get monthly AI Credits (100 on Pro,
                250 on Executive) plus the ability to buy add-on credit packs
                whenever you want extra power on top of your monthly allowance.
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

// Small workspaces/members usage tile. "unlimited" caps render with
// just the count + the word; numeric caps render "N / cap" with a
// thin progress bar. Going OVER the cap (grandfathered users) tints
// the bar warn-color so it's visually obvious without yelling.
function UsageStat({
  label,
  used,
  cap,
  hint,
}: {
  label: string;
  used:  number;
  cap:   number | "unlimited";
  hint?: string;
}) {
  const unlimited = cap === "unlimited";
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, cap as number)) * 100));
  const overCap = !unlimited && used > (cap as number);
  return (
    <div className="rounded-lg border border-line bg-ink-900/40 px-4 py-3">
      <div className="t-meta uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="t-section font-semibold text-slate-100 tabular-nums">
          {used.toLocaleString()}
        </span>
        <span className="t-meta text-slate-500">
          {unlimited ? "of unlimited" : `of ${cap}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-2 h-1 rounded-full bg-ink-700/80 overflow-hidden max-w-md">
          <div
            className={`h-full rounded-full ${overCap ? "bg-warn" : "bg-gradient-to-r from-brand-purple to-brand-teal"}`}
            style={{ width: `${Math.max(pct, overCap ? 100 : 0)}%` }}
            aria-hidden="true"
          />
        </div>
      ) : null}
      {hint ? (
        <div className="mt-2 t-meta text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}
