// Admin · Support. Stub until a support tool (Intercom / Zendesk /
// Plain / etc.) is wired. The nav slot exists so the operational
// surface is discoverable; the page itself is honest about being
// not-yet-connected.

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Support</h1>
        <p className="text-xs text-slate-400 mt-1">
          Open tickets, recent conversations, customer feedback, and bug reports.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-6">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="text-slate-100 font-medium">No support tool connected</div>
          <span className="text-[10px] uppercase tracking-wider pill">not connected</span>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl">
          Tickets, conversations, and customer feedback will live here once a support
          tool is wired up. Internal admin notes on individual accounts (with tags like
          VIP / Onboarding / Churn Risk) already work today — open any account&apos;s
          Customer 360 → Internal notes section.
        </p>
      </div>
    </div>
  );
}
