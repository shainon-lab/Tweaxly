"use client";

// Accept-card rendered on /invite/[token] once we've confirmed the
// logged-in user's email matches the invitation. POSTs the token to
// /api/invitations/[token]/accept, then switches the active workspace
// and redirects to /dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Invitation {
  email:     string;
  role:      "owner" | "admin" | "viewer";
  business:  { id: string; name: string };
  invitedBy: string;
  expiresAt: string;
}

const ROLE_LABEL: Record<Invitation["role"], string> = {
  owner:  "Owner",
  admin:  "Admin",
  viewer: "Viewer",
};

export default function AcceptInvitationClient({
  invitation, token, userEmail,
}: {
  invitation: Invitation;
  token:      string;
  userEmail:  string;
}) {
  const router = useRouter();
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res  = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_token:  "This invitation is no longer valid.",
          expired:        "This invitation has expired.",
          already_used:   "This invitation has already been accepted.",
          email_mismatch: "Your account email doesn't match the invitation.",
        };
        setError(map[data.error] ?? data.error ?? "Couldn't accept the invitation.");
        return;
      }
      // Switch the active workspace to the one we just joined so the
      // user lands inside it on /dashboard.
      await fetch("/api/businesses/switch", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ businessId: data.businessId }),
      }).catch(() => undefined);
      router.push("/dashboard");
    } catch {
      setError("Network error - check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-2">Workspace invitation</div>
        <h1 className="text-xl font-semibold text-slate-100 leading-snug">
          Join {invitation.business.name} on Tweaxly
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          {invitation.invitedBy} invited <span className="text-slate-100">{userEmail}</span> as <span className="text-slate-100">{ROLE_LABEL[invitation.role]}</span>.
        </p>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Accepting adds this workspace to your account. You can switch between workspaces from the sidebar at any time.
        </p>
        {error ? <div className="mt-3 text-xs text-bad">{error}</div> : null}
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button type="button" onClick={accept} disabled={busy} className="btn-primary text-sm disabled:opacity-50">
            {busy ? "Accepting…" : "Accept Invitation"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} disabled={busy} className="text-sm text-slate-400 hover:text-slate-200">
            Not now
          </button>
        </div>
      </div>
    </main>
  );
}
