// POST /api/businesses/[id]/invitations/[invitationId]/resend
//
// Re-send the original invitation email. We don't re-mint the token
// (it stays valid until expiry); we just trigger another delivery.
// Owner-only.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";
import { randomBytes, createHash } from "node:crypto";
import { sendInvitationEmail } from "@/lib/memberships";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; invitationId: string }> }) {
  const { id: businessId, invitationId } = await params;
  const user = await requireUser();

  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { ownerId: true },
  });
  if (!business || business.ownerId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const inv = await prisma.businessInvitation.findFirst({
    where:  { id: invitationId, businessId, status: "pending" },
    include: { business: { select: { name: true } } },
  });
  if (!inv) {
    return NextResponse.json({ error: "invitation_not_found" }, { status: 404 });
  }

  // Roll a fresh token + reset expiry. Old token (if leaked or lost)
  // is invalidated by the hash change. Simpler than maintaining a
  // multi-token model.
  const plain     = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(plain).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.businessInvitation.update({
    where: { id: inv.id },
    data:  { tokenHash, expiresAt },
  });

  const inviter = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
  await sendInvitationEmail({
    to:            inv.email,
    inviterName:   inviter?.name ?? null,
    workspaceName: inv.business.name,
    role:          normalizeRole(inv.role),
    token:         plain,
  });

  await recordAudit({
    actorUserId:      user.id,
    action:           "membership.invitation_resent",
    targetBusinessId: businessId,
    metadata:         { invitationId, email: inv.email },
    request:          req,
  });

  return NextResponse.json({ ok: true });
}
