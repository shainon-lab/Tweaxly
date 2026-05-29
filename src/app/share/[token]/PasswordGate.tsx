"use client";

// Lock screen shown when a SharedAnalysis was created with a password.
// Submit posts to /api/share/[token]/view with the password; on
// success the API returns the snapshot and we swap into the renderer
// inline (no page reload). The view counter increment happens on the
// server in the /view route, so a wrong password attempt never counts.

import { useState } from "react";
import { Lock } from "lucide-react";
import SharedAnalysisRenderer from "./SharedAnalysisRenderer";

type ViewResponse = {
  sourceType:      string;
  snapshotContent: Record<string, unknown>;
  snapshotMeta:    Record<string, unknown>;
  expiresAt:       string;
  createdAt:       string;
};

export default function PasswordGate({
  token,
  sourceType,
  createdAt,
  expiresAt,
}: {
  token:      string;
  sourceType: string;
  createdAt:  string;
  expiresAt:  string;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<ViewResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(token)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error === "password_invalid" || data?.error === "password_required") {
          setError("That password is incorrect. Check it with the sender and try again.");
        } else if (data?.error === "expired" || data?.error === "disabled") {
          setError("This shared analysis is no longer available.");
        } else {
          setError("Could not unlock this share. Please try again.");
        }
        return;
      }
      const data = await res.json() as ViewResponse;
      setUnlocked(data);
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (unlocked) {
    return (
      <SharedAnalysisRenderer
        sourceType={unlocked.sourceType}
        snapshotContent={unlocked.snapshotContent}
        snapshotMeta={unlocked.snapshotMeta}
        createdAt={unlocked.createdAt}
        expiresAt={unlocked.expiresAt}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto card">
      <div className="flex items-start gap-4 mb-5">
        <span className="shrink-0 inline-flex w-11 h-11 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <Lock size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="t-section text-slate-100">
            This analysis is password-protected
          </div>
          <div className="t-body text-slate-400 mt-1">
            The sender set a password to view this {labelFor(sourceType)}. Enter
            it below to continue.
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="t-meta uppercase tracking-wide text-slate-400 block mb-1">Password</span>
          <input
            type="password"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={submitting}
          />
        </label>
        {error ? (
          <div className="t-body text-bad">{error}</div>
        ) : null}
        <button
          type="submit"
          className="btn-primary w-full text-sm py-2.5"
          disabled={submitting || !password}
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-line/60 t-meta text-slate-500">
        Expires {new Date(expiresAt).toLocaleString()}
        {" · "}
        Shared {new Date(createdAt).toLocaleString()}
      </div>
    </div>
  );
}

function labelFor(sourceType: string): string {
  switch (sourceType) {
    case "consultation":          return "consultation answer";
    case "signal":                return "business signal";
    case "forecast_explanation":  return "forecast explanation";
    case "insight":               return "insight";
    default:                      return "analysis";
  }
}
