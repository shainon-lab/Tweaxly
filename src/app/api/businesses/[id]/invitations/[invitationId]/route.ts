// DELETE /api/businesses/[id]/invitations/[invitationId]
//
// Cancel a pending invitation. Owner-only.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelInvitation, normalizeRole } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; invitationId: string }> }) {
  const { id: businessId, invitationId } = await params;
  const user = await requireUser();

  const membership = await prisma.businessMembership.findFirst({
    where:  { businessId, userId: user.id, status: "active" },
    select: { role: true },
  });
  if (!membership || normalizeRole(membership.role) !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await cancelInvitation(invitationId, businessId);
  await recordAudit({
    actorUserId:      user.id,
    action:           "membership.invitation_cancelled",
    targetBusinessId: businessId,
    metadata:         { invitationId },
    request:          req,
  });

  return NextResponse.json({ ok: true });
}
