"use client";

// Share Analysis modal. Opens from a Share button on any AI surface
// (Phase 3 wires Consultation only; Phase 4 adds Signals / Forecast /
// Insights). The modal owns the create-share request, surfaces the
// returned URL with a one-click copy, and shows an upgrade card for
// users on a plan without the `shareAnalyses` entitlement.
//
// Caller responsibility: building the snapshot. The button on each
// surface knows which payload + meta to send (the consultation surface
// passes the assistant message + question; a signal card would pass
// the signal row, etc.). Keeping the snapshot construction at the
// callsite means the modal stays single-purpose and the API doesn't
// need to special-case every source schema.

import { useState } from "react";
import { Lock, Copy, Check, Share2 } from "lucide-react";
import UpgradeTriggerButton from "@/components/billing/UpgradeTriggerButton";
import {
  SHARE_EXPIRY_HOURS,
  DEFAULT_SHARE_EXPIRY,
  type ShareExpiryKey,
  type ShareSourceType,
} from "@/lib/sharedAnalyses";

const EXPIRY_OPTIONS: { key: ShareExpiryKey; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d",  label: "7 days"   },
  { key: "30d", label: "30 days"  },
];

type CreateResponse = {
  id:        string;
  token:     string;
  url:       string;
  expiresAt: string;
};

export default function ShareAnalysisModal({
  open,
  onClose,
  sourceType,
  sourceId,
  snapshotContent,
  snapshotMeta,
  canShare,
  currentPlan,
}: {
  open:            boolean;
  onClose:         () => void;
  sourceType:      ShareSourceType;
  sourceId:        string;
  snapshotContent: Record<string, unknown>;
  snapshotMeta:    Record<string, unknown>;
  // Whether the current workspace's plan grants shareAnalyses.
  // Modal renders the upgrade card when false instead of the form.
  canShare:        boolean;
  // Current plan label - passed straight into the UpgradeTriggerButton
  // so the upgrade flow knows where the user is coming from.
  currentPlan:     string;
}) {
  const [expiry, setExpiry]   = useState<ShareExpiryKey>(DEFAULT_SHARE_EXPIRY);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<CreateResponse | null>(null);
  const [copied, setCopied]           = useState(false);

  if (!open) return null;

  // Resetting state on close keeps the modal idempotent - if the user
  // generates a link, closes, then opens it again from another
  // answer, they get a clean form instead of stale state.
  function close() {
    setExpiry(DEFAULT_SHARE_EXPIRY);
    setUsePassword(false);
    setPassword("");
    setError(null);
    setResult(null);
    setCopied(false);
    onClose();
  }

  async function generate() {
    if (submitting) return;
    if (usePassword && password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shared-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          snapshotContent,
          snapshotMeta,
          expiry,
          password: usePassword ? password : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error === "feature_unavailable") {
          setError("Sharing isn't included on your current plan.");
        } else if (data?.error === "read_only") {
          setError("This workspace is in read-only mode.");
        } else if (data?.error === "password_too_short") {
          setError("Password must be at least 4 characters.");
        } else {
          setError(data?.message ?? "Could not generate share link. Please try again.");
        }
        return;
      }
      const data = await res.json() as CreateResponse;
      setResult(data);
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    // Use the absolute URL the API returned. Falls back to building
    // one from window.location when SHARE_BASE_URL isn't configured
    // and the API hands back a relative path.
    const url = result.url.startsWith("http")
      ? result.url
      : `${window.location.origin}${result.url}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Best-effort - some browsers block clipboard from non-secure
      // contexts; surface a fallback so the user can still grab it.
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8"
      onClick={close}
    >
      <div
        className="card max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {!canShare ? (
          <UpgradeCard currentPlan={currentPlan} onDismiss={close} />
        ) : result ? (
          <SuccessCard
            url={result.url}
            expiresAt={result.expiresAt}
            copied={copied}
            onCopy={copyLink}
            onClose={close}
          />
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
                <Share2 size={18} strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-section text-slate-100">Share Analysis</div>
                <div className="t-body text-slate-400 mt-1">
                  Create a secure read-only link that can be viewed without
                  a Tweaxly account.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Expiration */}
              <div>
                <span className="t-meta uppercase tracking-wide text-slate-400 block mb-2">
                  Link expires after
                </span>
                <div className="flex gap-2 flex-wrap">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExpiry(opt.key)}
                      disabled={submitting}
                      className={`px-3 py-1.5 rounded-full border transition text-sm ${
                        expiry === opt.key
                          ? "border-accent/60 bg-accent-soft/40 text-slate-100"
                          : "border-line text-slate-300 hover:border-accent/40"
                      } ${submitting ? "opacity-50" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="t-meta text-slate-500 mt-2">
                  After this, the link returns an &ldquo;expired&rdquo; page.
                  ({SHARE_EXPIRY_HOURS[expiry]} hours)
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    disabled={submitting}
                    className="rounded border-line"
                  />
                  <span className="t-body text-slate-200">Require a password</span>
                </label>
                {usePassword ? (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    disabled={submitting}
                    className="input w-full mt-2"
                    autoComplete="off"
                  />
                ) : null}
              </div>

              {error ? (
                <div className="t-body text-bad">{error}</div>
              ) : null}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={submitting || (usePassword && !password)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Lock size={14} strokeWidth={2} />
                  {submitting ? "Generating…" : "Generate Secure Link"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessCard({
  url, expiresAt, copied, onCopy, onClose,
}: {
  url:        string;
  expiresAt:  string;
  copied:     boolean;
  onCopy:     () => void;
  onClose:    () => void;
}) {
  // The API returns either an absolute or a same-origin URL depending
  // on SHARE_BASE_URL. Show whichever shape we got - the copy button
  // resolves to absolute via window.location.origin when needed.
  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-good/15 border border-good/40 items-center justify-center text-good">
          <Check size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="t-section text-slate-100">Share link ready</div>
          <div className="t-body text-slate-400 mt-1">
            Anyone with this link can view the analysis. It expires on{" "}
            <span className="text-slate-200 font-medium">
              {new Date(expiresAt).toLocaleString()}
            </span>
            .
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-ink-900/50 px-3 py-2.5 mb-4 flex items-center gap-2">
        <code className="t-meta text-slate-300 truncate flex-1 font-mono">{url}</code>
        <button
          type="button"
          onClick={onCopy}
          className="btn-ghost text-sm inline-flex items-center gap-1.5 shrink-0"
        >
          {copied ? (
            <>
              <Check size={14} strokeWidth={2} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={2} />
              Copy link
            </>
          )}
        </button>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="btn-primary">
          Done
        </button>
      </div>
    </>
  );
}

function UpgradeCard({
  currentPlan,
  onDismiss,
}: {
  currentPlan: string;
  onDismiss:   () => void;
}) {
  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <Lock size={18} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="t-section text-slate-100">Sharing is a Pro feature</div>
          <div className="t-body text-slate-400 mt-1">
            Upgrade to share AI analyses with anyone, even if they don&apos;t
            have a Tweaxly account. Secure links, expiry windows, and
            optional passwords are all included.
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDismiss} className="btn-ghost">
          Maybe later
        </button>
        <UpgradeTriggerButton
          currentPlan={currentPlan}
          feature="Secure analysis sharing"
          className="btn-primary"
        >
          Upgrade to Pro
        </UpgradeTriggerButton>
      </div>
    </>
  );
}
