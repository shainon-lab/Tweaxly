// POST /api/businesses/[id]/invitations
//
// Owner-only. Creates a pending BusinessInvitation, sends the email,
// returns the invitation row (without the plaintext token - that
// only ever leaves the server via the email URL).

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createInvitation, sendInvitationEmail, INVITABLE_ROLES,
  createIncomingInvitationNotification,
} from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const user = await requireUser();

  // Owner-only gate. The authoritative owner signal is
  // Business.ownerId (not BusinessMembership.role) - workspaces
  // provisioned via admin tools may not have a membership row
  // tagged as "account_admin" but their ownerId is always set.
  // Fetch name too so we can avoid a second query later when
  // composing the invitation email.
  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { ownerId: true, name: true },
  });
  if (!business || business.ownerId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { email?: unknown; role?: unknown };
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const role  = typeof body.role  === "string" ? body.role  : "admin";
  if (!INVITABLE_ROLES.includes(role as "admin" | "viewer")) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const result = await createInvitation({
    businessId,
    email,
    role: role as "admin" | "viewer",
    invitedByUserId: user.id,
  });

  if (!result.ok) {
    // Map reason → HTTP status. Cap / plan reasons get 402-like
    // signaling so the UI can surface an upgrade prompt; data errors
    // get a 400.
    const status =
      result.reason === "free_plan"      ? 402 :
      result.reason === "limit_reached"  ? 402 :
      result.reason === "already_member" ? 409 :
      result.reason === "already_pending"? 409 :
      400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  // Look up inviter name for the email body (workspace name was
  // already fetched above as part of the owner check).
  const inviter = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } });

  await sendInvitationEmail({
    to:            result.invitation.email,
    inviterName:   inviter?.name ?? null,
    workspaceName: business.name ?? "your workspace",
    role:          result.invitation.role,
    token:         result.token,
  });

  // If the invited email belongs to an existing Tweaxly user, also
  // drop an in-app notification on their bell so they don't have to
  // dig through email to find the invitation. Best-effort - if the
  // notification write fails, the email is still the primary channel.
  await createIncomingInvitationNotification({
    invitationId:       result.invitation.id,
    invitingBusinessId: businessId,
    workspaceName:      business.name ?? "your workspace",
    inviterName:        inviter?.name ?? null,
    inviterEmail:       inviter?.email ?? "",
    role:               role as "admin" | "viewer",
    email:              result.invitation.email,
  }).catch((err: unknown) => {
    // Email is still the source of truth for the invitation, but log
    // the bell-notification failure so we don't silently lose visibility
    // into it again. (Earlier silent swallow masked an anchor-workspace
    // lookup that returned null for invitees who'd been removed.)
    console.error("[invitations] createIncomingInvitationNotification failed", err);
  });

  await recordAudit({
    actorUserId:      user.id,
    action:           "membership.invitation_sent",
    targetBusinessId: businessId,
    metadata:         { email: result.invitation.email, role: result.invitation.role },
    request:          req,
  });

  return NextResponse.json({
    ok:         true,
    invitation: result.invitation,
  });
}
