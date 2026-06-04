"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2, X } from "lucide-react";
import { notify } from "@/lib/notify";

// Share control for a completed review. Creates an unguessable public
// link (ungated - available to free users), lets the owner copy it, and
// turn sharing off. Small client island; the detail page stays a server
// component.
export default function ShareButton({
  id,
  initialToken,
}: {
  id: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = token && typeof window !== "undefined"
    ? `${window.location.origin}/share/financial-review/${token}`
    : "";

  async function openPanel() {
    setOpen(true);
    if (token || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/financial-review/${id}/share`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not create the share link.");
      setToken(data.token);
    } catch (e) {
      setOpen(false);
      await notify.alert(e instanceof Error ? e.message : "Could not create the share link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - the input is selectable as a fallback */
    }
  }

  async function stopSharing() {
    setBusy(true);
    try {
      const res = await fetch(`/api/financial-review/${id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToken(null);
      setOpen(false);
    } catch {
      await notify.alert("Could not turn off sharing. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={openPanel} className="btn-ghost text-sm">
        <Share2 size={15} className="mr-1.5" />
        Share
      </button>

      {open ? (
        <>
          {/* click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-lg border border-line bg-ink-900 p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="t-meta font-semibold uppercase tracking-wide text-slate-300">Share this review</div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-ink-700 hover:text-slate-200" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            {busy && !token ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                <Loader2 size={15} className="animate-spin" /> Creating link…
              </div>
            ) : token ? (
              <>
                <p className="t-meta mb-2 text-slate-400">
                  Anyone with this link can view a read-only copy. No sign-in required.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="input flex-1 text-xs"
                  />
                  <button type="button" onClick={copy} className="btn-primary shrink-0 px-2.5 py-2" aria-label="Copy link">
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={stopSharing}
                  disabled={busy}
                  className="mt-3 text-xs font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
                >
                  Stop sharing
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
