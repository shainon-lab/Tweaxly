"use client";

// Non-blocking dashboard banner shown when the current workspace
// hasn't completed its Business Profile (Business DNA). Dismissible
// per-workspace via localStorage so it doesn't nag forever - it
// resurfaces automatically when the workspace is switched.

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_PREFIX = "tweaxly:profile-banner-dismissed:";

export default function BusinessProfilePromptBanner({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [hidden, setHidden] = useState(true); // start hidden to avoid flicker on dismissed workspaces

  useEffect(() => {
    try {
      const key = STORAGE_PREFIX + businessId;
      const dismissed = window.localStorage.getItem(key);
      if (!dismissed) setHidden(false);
    } catch {
      // localStorage unavailable - just show the banner.
      setHidden(false);
    }
  }, [businessId]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + businessId, "1");
    } catch { /* best-effort */ }
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="mb-5 rounded-xl border border-accent/40 bg-gradient-to-r from-accent-soft/30 via-transparent to-accent-soft/15 px-5 py-4">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1">
            Help Tweaxly understand your business
          </div>
          <div className="text-sm sm:text-base font-semibold text-white leading-snug">
            Spend 2 minutes telling the AI about {businessName}.
          </div>
          <div className="text-xs text-slate-400 mt-1 leading-snug">
            Industry, business model, main goal, biggest challenge - the advisor uses all of it to reason about your numbers instead of giving generic answers.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/onboarding/business-profile"
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent hover:bg-accent-soft hover:border-accent hover:text-white transition whitespace-nowrap"
          >
            Start the wizard →
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition whitespace-nowrap"
            title="Hide for this workspace"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
