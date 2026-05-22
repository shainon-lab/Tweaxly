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
  const pct = props.monthlyAllowance > 0
    ? Math.max(0, Math.min(100, Math.round((props.walletBalance / props.monthlyAllowance) * 100)))
    : 0;

  // Redeem code state
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      {/* Plan summary */}
      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Your plan</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-semibold text-white">{PLAN_LABEL[props.plan] ?? props.plan}</span>
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
            <a
              href="/pricing"
              className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
            >
              Upgrade to Pro
            </a>
          ) : null}
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
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">AI Credits</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-white tabular-nums">{props.walletBalance.toLocaleString()}</span>
              <span className="text-sm text-slate-500">
                of {props.monthlyAllowance.toLocaleString()} this month
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
              Plan credits reset at the start of every calendar month
              {props.periodStart ? <> · current period started {fmtDate(props.periodStart)}</> : null}.
              Add-on credit packs don&apos;t reset; they expire 12 months after purchase.
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
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Promo code</div>
        <p className="text-xs text-slate-500 mb-3">
          Have a code from a launch campaign, partner, or beta program? Apply it here -
          credit codes land instantly; discount codes apply at the next invoice.
        </p>
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

      {/* Credit packs */}
      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Buy more credits</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Add-on credit packs work on every plan, add instantly, and expire 12 months after purchase. Useful for the occasional heavy-analysis month.
            </p>
          </div>
        </div>
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
                  disabled
                  title="Billing provider not connected yet"
                  className="text-xs px-3 py-1 rounded-md border border-line text-slate-400 hover:border-slate-500 hover:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Credit pack purchase will be available once the billing provider is connected.
        </div>
      </section>

      {/* Transaction history */}
      <section className="card">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">Recent credit activity</div>
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
                    <td className="px-3 py-2 text-slate-400 max-w-xs truncate" title={t.reason ?? ""}>{t.reason ?? "—"}</td>
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
