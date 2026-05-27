// /invite/[token]
//
// Workspace-invitation landing page. Three routes the visitor can be
// in when they arrive:
//
//   1. Not logged in, no Tweaxly account → redirect to /register?invite=
//      with the invited email pre-filled and the invitation token
//      stashed so the register flow can auto-accept after signup.
//   2. Not logged in, account already exists for the invited email →
//      redirect to /login?invite= with the email pre-filled; same
//      auto-accept hand-off after login.
//   3. Already logged in →
//        a. matching email → render the AcceptCard; the user clicks
//           Accept which POSTs /api/invitations/[token]/accept.
//        b. wrong email → show a "switch account" prompt so we never
//           accept an invitation under the wrong identity.
//
// Server component: looks up the invitation by token + the current
// session's user (if any) and renders the right surface. Token
// hashing happens in lib/memberships; no plaintext lives in the DB.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getInvitationByToken } from "@/lib/memberships";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import AcceptInvitationClient from "./AcceptInvitationClient";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvitationByToken(token);

  // ── Bad / expired / used token ─────────────────────────────────
  if (!inv || inv.status !== "pending" || new Date(inv.expiresAt) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-base font-semibold text-slate-100 mb-2">Invitation unavailable</div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {!inv                          ? "We couldn't find an invitation with this link."
             : inv.status === "accepted"   ? "This invitation has already been accepted. Sign in to access the workspace."
             : inv.status === "cancelled"  ? "This invitation was cancelled by the workspace owner."
                                           : "This invitation has expired. Ask the workspace owner to send a fresh one."}
          </p>
          <div className="mt-5">
            <Link href="/login" className="text-sm text-accent hover:underline">Go to sign in →</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Check session ──────────────────────────────────────────────
  const session = await getSession();
  const user = session.userId
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true } })
    : null;

  // Visitor is logged in. Either match the invited email (accept
  // flow) or surface the mismatch so they can sign out and retry.
  if (user) {
    if (user.email.toLowerCase() === inv.email.toLowerCase()) {
      return <AcceptInvitationClient invitation={inv} token={token} userEmail={user.email} />;
    }
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <div className="text-base font-semibold text-slate-100 mb-2">Wrong account</div>
          <p className="text-sm text-slate-400 leading-relaxed">
            This invitation was sent to <span className="text-slate-100">{inv.email}</span>, but you&apos;re signed in as <span className="text-slate-100">{user.email}</span>.
          </p>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Sign out and sign back in with <span className="text-slate-100">{inv.email}</span>, then click the invitation link again.
          </p>
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Link href={`/login?logout=1&next=${encodeURIComponent(`/invite/${token}`)}`} className="btn-primary text-sm">Switch account</Link>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">Stay signed in</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Not logged in. Route to register if the email is unknown,
  //    login if the email already has an account.
  const existing = await prisma.user.findUnique({ where: { email: inv.email.toLowerCase() }, select: { id: true } });
  const next = `/invite/${token}`;
  if (existing) {
    redirect(`/login?email=${encodeURIComponent(inv.email)}&next=${encodeURIComponent(next)}`);
  }
  redirect(`/register?email=${encodeURIComponent(inv.email)}&invite=${encodeURIComponent(token)}`);
}
