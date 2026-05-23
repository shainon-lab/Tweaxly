"use client";

// Detects the post-checkout landing (Polar redirects users back with
// ?checkout=success). The webhook that flips the workspace to Pro +
// grants the monthly allowance fires asynchronously, so a naive
// landing shows stale state ("still Free"). This handler:
//
//   1. Notes the user's plan + balance at first paint (the "before"
//      snapshot the server rendered).
//   2. Polls /api/billing/credits every 1.5s, comparing each response
//      to the snapshot.
//   3. As soon as plan or balance shifts (webhook landed), strips
//      the ?checkout= param from the URL and runs router.refresh()
//      so every server-rendered surface (sidebar credit pill, plan
//      badge, billing tab) re-renders with the live data.
//   4. Times out after 20 seconds with a polite "should appear in a
//      moment" notice + a manual refresh button.
//
// Renders a small inline banner during the polling window so the
// user knows we're waiting for confirmation, not stuck.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface CheckoutSuccessHandlerProps {
  // Server-rendered snapshot we'll diff against. Comes from whatever
  // surface mounts the handler (Settings/BillingClient passes the
  // plan + wallet it already loaded).
  initialPlan:    string;
  initialBalance: number;
}

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS  = 20_000;

export default function CheckoutSuccessHandler({
  initialPlan, initialBalance,
}: CheckoutSuccessHandlerProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const isSuccess   = searchParams.get("checkout") === "success";

  const [status, setStatus] = useState<"idle" | "polling" | "applied" | "timeout">(
    isSuccess ? "polling" : "idle",
  );

  useEffect(() => {
    if (!isSuccess) return;

    let cancelled = false;
    const startedAt = Date.now();

    const stripParam = () => {
      // Drop checkout=success so reloads don't re-trigger the
      // handler and the URL is clean to share.
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("checkout");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const res  = await fetch("/api/billing/credits", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { plan?: string; balance?: number };
          // Any plan upgrade OR balance increase = the webhook
          // landed and applied entitlements. We're done.
          if (
            (typeof data.plan === "string" && data.plan !== initialPlan)
            || (typeof data.balance === "number" && data.balance > initialBalance)
          ) {
            if (cancelled) return;
            setStatus("applied");
            stripParam();
            router.refresh();
            return;
          }
        }
      } catch {
        // Network blip - keep polling, the timeout will catch it.
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (cancelled) return;
        setStatus("timeout");
        return;
      }
      window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();
    return () => { cancelled = true };
  }, [isSuccess, initialPlan, initialBalance, pathname, router, searchParams]);

  if (!isSuccess && status === "idle") return null;
  if (status === "applied") return null;

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${
        status === "timeout"
          ? "border-warn/40 bg-warn/10 text-warn"
          : "border-accent/40 bg-accent-soft/20 text-slate-200"
      }`}
      role="status"
      aria-live="polite"
    >
      {status === "timeout" ? (
        <>
          <span className="font-semibold">Your purchase should appear in a moment.</span>
          <span className="text-slate-400">
            If it doesn&apos;t, refresh - or contact support@tweaxly.com if it&apos;s still missing in a few minutes.
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-auto text-xs px-3 py-1 rounded-md border border-warn/40 text-warn hover:bg-warn/15 transition"
          >
            Refresh
          </button>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin text-accent shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-semibold">Processing your purchase…</span>
          <span className="text-slate-400">This usually takes a few seconds.</span>
        </>
      )}
    </div>
  );
}
