// POST /api/invitations/in-app/[id]/decline
//
// Invitee declines a pending invitation from the bell notification
// or the Members & Access "Incoming invitations" list. Marks the
// invitation status as "declined" and clears any open bell
// notifications for it.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { declineInvitationById } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const result = await declineInvitationById(id, user.email);
  if (!result.ok) {
    const status =
      result.reason === "invalid_token"  ? 404 :
      result.reason === "expired"        ? 410 :
      result.reason === "already_used"   ? 409 :
      result.reason === "email_mismatch" ? 403 :
      400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  await recordAudit({
    actorUserId: user.id,
    action:      "membership.invitation_declined",
    metadata:    { invitationId: id },
    request:     req,
  });

  return NextResponse.json({ ok: true });
}
