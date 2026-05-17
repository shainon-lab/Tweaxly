"use client";

// Persistent banner shown across every (app) screen while a super_admin
// is impersonating a customer account. Includes:
//   - identity context (who you are, what you're viewing)
//   - a write-mode toggle (writes are blocked by default)
//   - a one-click exit (returns to /admin)
//
// The banner is intentionally loud (accent gradient + sticky) so it's
// impossible to forget that the session is in impersonation mode.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ImpersonationBanner({
  businessName,
  actorEmail,
  allowWrites,
}: {
  businessName: string;
  actorEmail: string;
  allowWrites: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function toggleWrites() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonate/allow-writes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allow: !allowWrites }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function exitImpersonation() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonate/exit", { method: "POST" });
      window.location.href = "/admin";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className="relative z-40 flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-brand-purple/30 via-brand-purple/15 to-brand-teal/15 border-b border-brand-purple/40 backdrop-blur"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex w-2 h-2 rounded-full bg-brand-purple anim-pulse-soft shrink-0" />
        <div className="min-w-0">
          <span className="text-white font-semibold">Viewing as Super Admin</span>
          <span className="text-slate-300 mx-2">·</span>
          <span className="text-slate-100 truncate">{businessName}</span>
          <span className="text-slate-500 mx-2 hidden sm:inline">·</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">{actorEmail}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleWrites}
          disabled={busy || pending}
          className={`text-[11px] px-2.5 py-1 rounded-md border transition ${
            allowWrites
              ? "border-bad/50 bg-bad/15 text-bad hover:bg-bad/25"
              : "border-line text-slate-300 hover:text-white hover:border-slate-500"
          } disabled:opacity-50`}
          title={allowWrites
            ? "Writes are currently ENABLED — destructive actions are not blocked. Click to switch to read-only."
            : "Writes are blocked. Enable only if you must mutate customer data."}
        >
          {allowWrites ? "Writes enabled" : "Read-only"}
        </button>
        <button
          type="button"
          onClick={exitImpersonation}
          disabled={busy || pending}
          className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition disabled:opacity-50"
        >
          Exit impersonation
        </button>
      </div>
    </div>
  );
}
