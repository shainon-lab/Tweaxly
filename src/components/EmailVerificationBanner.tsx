"use client";

// Persistent in-app banner shown to users who haven't verified their
// email yet. Non-intrusive (sits above the main scroll area, doesn't
// modal-block) but always visible until verification completes.
//
// Two actions:
//   - Resend: POST /api/auth/resend-verification. Server enforces a
//     60s cooldown + 10/24h cap; the UI mirrors the cooldown but
//     never trusts that as the gate.
//   - Dismiss is intentionally NOT offered - per spec, the banner
//     must stay visible until verification completes.

import { useEffect, useState } from "react";
import { MailWarning, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

const COOLDOWN_SECONDS = 60;

export default function EmailVerificationBanner({
  email,
  // Set to true by the layout when the 72-hour grace period has
  // elapsed. Flips the banner to the "restricted" variant: stronger
  // tone, sharper copy, and an explicit "your account is restricted"
  // framing so the user understands why uploads / writes are now
  // returning errors.
  restricted = false,
}: {
  email: string;
  restricted?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ tone: "good" | "warn" | "bad"; text: string } | null>(null);

  // Decrement the cooldown timer once a second when active.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.alreadyVerified) {
          setMessage({ tone: "good", text: "Already verified - refresh to clear this banner." });
        } else {
          setMessage({ tone: "good", text: "Sent. Check your inbox in a moment." });
          setCooldown(COOLDOWN_SECONDS);
        }
      } else if (res.status === 429 && data.error === "too_soon") {
        setMessage({ tone: "warn", text: `Hold on - try again in ${data.retryAfterSec ?? 60}s.` });
        setCooldown(Math.max(1, Number(data.retryAfterSec) || COOLDOWN_SECONDS));
      } else if (res.status === 429 && data.error === "daily_cap_exceeded") {
        setMessage({ tone: "warn", text: `Daily resend limit reached (${data.cap ?? 10}). Try again tomorrow.` });
      } else {
        setMessage({ tone: "bad", text: data.message ?? "Couldn't send. Try again in a moment." });
      }
    } catch {
      setMessage({ tone: "bad", text: "Network error - check your connection." });
    } finally {
      setBusy(false);
    }
  }

  const toneCls =
    message?.tone === "good" ? "text-good"
    : message?.tone === "warn" ? "text-warn"
    : message?.tone === "bad"  ? "text-bad"
    : "";

  // Restricted variant uses the platform's bad tone since the user
  // now has features actively turning off (uploads, AI). The warn
  // variant is the friendly nudge users see during the 72-hour
  // grace window.
  const containerCls = restricted
    ? "relative z-30 flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm bg-bad/10 border-b border-bad/40 backdrop-blur"
    : "relative z-30 flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm bg-warn/10 border-b border-warn/30 backdrop-blur";
  const iconCls    = restricted ? "text-bad shrink-0" : "text-warn shrink-0";
  const headline   = restricted ? "Account restricted - verify your email" : "Verify your email";
  const sublineEnd = restricted
    ? "to restore uploads, AI, and other features."
    : "Click it to unlock all platform features.";
  const buttonCls = restricted
    ? "text-xs px-3 py-1 rounded-md border border-bad/50 text-bad hover:bg-bad/15 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
    : "text-xs px-3 py-1 rounded-md border border-warn/40 text-warn hover:bg-warn/15 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5";

  return (
    <div
      role="status"
      aria-live="polite"
      className={containerCls}
    >
      <div className="flex items-center gap-3 min-w-0">
        {restricted
          ? <ShieldAlert size={16} className={iconCls} aria-hidden="true" />
          : <MailWarning size={16} className={iconCls} aria-hidden="true" />}
        <div className="min-w-0">
          <span className="font-semibold text-slate-100">{headline}</span>
          <span className="text-slate-400 mx-2">·</span>
          <span className="text-slate-300 truncate">
            We sent a link to <span className="text-slate-100">{email}</span>. {sublineEnd}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {message ? (
          <span className={`hidden sm:inline text-[11px] ${toneCls}`}>{message.text}</span>
        ) : null}
        <button
          type="button"
          onClick={resend}
          disabled={busy || cooldown > 0}
          className={buttonCls}
        >
          {busy ? (
            <><RefreshCw size={12} className="animate-spin" /> Sending</>
          ) : cooldown > 0 ? (
            <>Resend in {cooldown}s</>
          ) : message?.tone === "good" ? (
            <><CheckCircle2 size={12} /> Sent</>
          ) : (
            <>Resend email</>
          )}
        </button>
      </div>
    </div>
  );
}
