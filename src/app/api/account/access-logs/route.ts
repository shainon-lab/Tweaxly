// GET /api/account/access-logs
//
// Returns a unified feed of access events for the currently signed-in
// user, surfaced on Account → Access Logs. Two strict isolation
// guarantees are enforced here:
//
//   1. Actor scoping: every row returned must have `actorUserId =
//      current user`. We never include rows where the actor is a
//      different user (e.g. a super-admin impersonating). The prior
//      version OR'd in `targetBusinessId IN (user's workspaces)`,
//      which surfaced admin actions against the user's business as
//      if the user had performed them. That was a real privacy
//      leak (e.g. "Support session started" with the admin's IP).
//
//   2. Action allowlist: even after the actor filter, we only ever
//      return action keys that are explicitly user-facing. Any new
//      admin-classed action added to AuditAction in the future is
//      excluded by default unless someone adds it to USER_VISIBLE.
//      Defense in depth - a backend bug that mis-attributes an
//      admin action to the user's actorUserId still won't leak.
//
// Admin-side audit visibility lives under /admin/accounts/[id] +
// /admin/system-logs - separate routes, separate auth gate. The
// customer-facing feed never touches them.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 100;

// Allowlist of audit action keys that are legitimately the user's
// own activity (login lifecycle, their own data uploads, their own
// billing actions, their own workspace-membership changes). Anything
// not on this list is dropped from the customer feed.
//
// NEVER add: any impersonation.*, account.viewed, account.status_change,
// or other admin-tool actions. Those belong on the admin audit page.
const USER_VISIBLE: ReadonlySet<string> = new Set([
  // Auth lifecycle (the user's own sign-in / verification activity)
  "auth.logout",
  "auth.verification_email_sent",
  "auth.email_verified",
  "auth.verification_failed",
  "auth.google_link",
  "auth.access_blocked_unverified",
  // Data the user uploaded / sources they created
  "data.upload",
  "source.created",
  // Billing actions initiated by the user themselves
  "billing.subscription_created",
  "billing.subscription_updated",
  "billing.subscription_canceled",
  // Workspace membership changes the user performed
  // (their own invitations, role changes, removals)
  "membership.invitation_sent",
  "membership.invitation_accepted",
  "membership.invitation_cancelled",
  "membership.invitation_declined",
  "membership.invitation_resent",
  "membership.removed",
  "membership.role_changed",
  // The user's own consent decisions (signup + ongoing marketing changes)
  "consent.signup",
  "consent.marketing_update",
]);

type Entry = {
  id:        string;
  action:    string;
  createdAt: string;
  metadata:  Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  businessId:   string | null;
  businessName: string | null;
};

export async function GET() {
  const user = await requireUser();

  // Only used to render a friendly business name on rows that the
  // user themselves performed against one of their workspaces. We
  // do NOT scope the audit query by these ids - actor scoping does
  // all the privacy work; this map is purely display.
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { memberships: { some: { userId: user.id, status: "active" } } },
      ],
    },
    select: { id: true, name: true },
  });
  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));

  const [loginRows, auditRows] = await Promise.all([
    prisma.loginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.auditLog.findMany({
      // Strict actor scoping. No OR. No targetBusinessId clause.
      // The user can only ever see rows they themselves wrote.
      where: { actorUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
  ]);

  const merged: Entry[] = [];

  for (const r of loginRows) {
    merged.push({
      id:        `login_${r.id}`,
      action:    r.success ? "auth.login" : "auth.login_failed",
      createdAt: r.createdAt.toISOString(),
      metadata:  { email: r.email, success: r.success },
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      businessId:   null,
      businessName: null,
    });
  }

  for (const r of auditRows) {
    // Allowlist defense - drop any action key not explicitly marked
    // as user-facing, even if it somehow had actorUserId = user.
    if (!USER_VISIBLE.has(r.action)) continue;
    let meta: Record<string, unknown> | null = null;
    if (r.metadata) {
      try { meta = JSON.parse(r.metadata); } catch { meta = { raw: r.metadata }; }
    }
    merged.push({
      id:        `audit_${r.id}`,
      action:    r.action,
      createdAt: r.createdAt.toISOString(),
      metadata:  meta,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      businessId:   r.targetBusinessId,
      businessName: r.targetBusinessId ? businessNameById.get(r.targetBusinessId) ?? null : null,
    });
  }

  merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ entries: merged.slice(0, LIMIT) });
}
