// Admin · Billing. Empty-state shell until Stripe (or another
// payments provider) is wired. Listed in the nav so the operational
// surface exists from day one; the page itself is honest about being
// not-yet-connected.
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLANNED_TILES = [
  { label: "MRR",                value: "—", hint: "Sum of active subscriptions" },
  { label: "Active subscriptions", value: "—", hint: "Paying customers" },
  { label: "Trial accounts",     value: "—", hint: "From your existing trial data" },
  { label: "Past due",           value: "—", hint: "Failed invoices" },
  { label: "Churned this month", value: "—", hint: "Cancellations" },
  { label: "Net revenue",        value: "—", hint: "After refunds / disputes" },
];

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Billing</h1>
        <p className="text-xs text-slate-400 mt-1">
          Revenue overview, MRR, churn, refunds, and failed payments.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-6">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="text-slate-100 font-medium">No payments provider connected</div>
          <span className="text-[10px] uppercase tracking-wider pill">not connected</span>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl">
          Once Stripe (or another provider) is wired up, this page will pull subscriptions,
          invoices, payments, refunds, and disputes directly from the source of truth. Plan
          and trial-end metadata can already be set per account from{" "}
          <Link href="/admin/accounts" className="text-accent hover:underline">Accounts</Link> →
          Customer 360.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 opacity-60">
        {PLANNED_TILES.map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-ink-900/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{t.label}</div>
            <div className="mt-1.5 text-xl font-bold text-slate-500 tabular-nums">{t.value}</div>
            <div className="mt-1 text-[10px] text-slate-600">{t.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
