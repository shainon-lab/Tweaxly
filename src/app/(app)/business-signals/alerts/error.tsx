"use client";

// Route-scoped error boundary. Without this, a server-side throw inside
// the Alerts page (e.g. evaluating notification rules on a brand-new
// account that hits a weird Prisma edge case) renders as a blank page.
// Surface the error and let the user retry.

import Link from "next/link";

export default function AlertsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card text-center py-12 px-4">
      <div className="text-base font-medium text-slate-100 mb-2">
        We hit a problem loading your alerts
      </div>
      <div className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
        Nothing is broken with your data — this is usually transient. Try again, or open the notifications page to set up your first rule.
      </div>
      {error?.digest ? (
        <div className="text-[11px] text-slate-500 mb-4">Reference: {error.digest}</div>
      ) : null}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button type="button" className="btn-ghost" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/notifications" className="btn-primary">
          Set up notifications
        </Link>
      </div>
    </div>
  );
}
