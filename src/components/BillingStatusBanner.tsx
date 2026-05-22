// Top-of-app banner for billing-state messages that must NOT be missed:
//
//   • Read-only mode (subscription past_due / canceled / incomplete) -
//     prominent red banner; user can still browse but writes are
//     blocked at the entitlements layer.
//   • Credits exhausted on Free - blue/accent banner with upgrade CTA;
//     dashboards and reports still work, only AI consultation blocks.
//
// When the workspace is healthy this renders null - no chrome added
// to the page. Used inside the (app) layout above the main content.

import Link from "next/link";

interface BillingStatusBannerProps {
  readOnly: boolean;
  plan:     string;
  balance:  number;
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro", business: "Business",
};

export default function BillingStatusBanner({ readOnly, plan, balance }: BillingStatusBannerProps) {
  if (readOnly) {
    return (
      <div className="border-b border-bad/40 bg-bad/10 text-bad px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap text-sm">
          <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-bad/40 bg-bad/15">
            Read-only
          </span>
          <span className="flex-1 min-w-0">
            This workspace is in read-only mode. Dashboards and historical reports remain visible, but new uploads, AI consultation and exports are paused for this workspace only - other workspaces are unaffected.
          </span>
          <Link
            href="/settings/billing"
            className="text-xs font-semibold px-3 py-1 rounded-md border border-bad text-bad hover:bg-bad/15 transition whitespace-nowrap"
          >
            Reactivate →
          </Link>
        </div>
      </div>
    );
  }

  // Free tier + zero balance is the next-most-important banner.
  // Pro/Business with low balance also gets a softer notice. We
  // deliberately don't fire on every low balance - only when the
  // user can no longer ask the AI advisor a single question.
  if (balance <= 0 && plan === "free") {
    return (
      <div className="border-b border-accent/40 bg-accent-soft/20 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap text-sm">
          <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-accent/40 bg-accent-soft text-accent">
            Free
          </span>
          <span className="flex-1 min-w-0 text-slate-200">
            This workspace has used its monthly AI Credits. Upgrade just this workspace to Pro for 500 credits/month, or grab a credit pack - other workspaces are unaffected.
          </span>
          <Link
            href="/settings/billing"
            className="text-xs font-semibold px-3 py-1 rounded-md border border-accent/60 text-accent hover:bg-accent-soft hover:border-accent transition whitespace-nowrap"
          >
            See plans →
          </Link>
        </div>
      </div>
    );
  }

  if (balance <= 0 && (plan === "pro" || plan === "business")) {
    return (
      <div className="border-b border-warn/40 bg-warn/10 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap text-sm">
          <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-warn/40 bg-warn/15 text-warn">
            {PLAN_LABEL[plan]}
          </span>
          <span className="flex-1 min-w-0 text-slate-200">
            This workspace has used its monthly AI Credits. They&apos;ll reset at the start of next month, or you can buy a pack for this workspace.
          </span>
          <Link
            href="/settings/billing"
            className="text-xs font-semibold px-3 py-1 rounded-md border border-warn/60 text-warn hover:bg-warn/15 hover:border-warn transition whitespace-nowrap"
          >
            Buy credits →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
