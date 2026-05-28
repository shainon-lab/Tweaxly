// GET /api/invitations/incoming
//
// Lists pending invitations issued to the logged-in user's email,
// across every workspace - powers the "Incoming invitations" section
// of Settings → Members & Access and the inline render in the bell
// notification panel.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  const rows = await prisma.businessInvitation.findMany({
    where: {
      email:  user.email.toLowerCase(),
      status: "pending",
    },
    include: {
      business:  { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter out expired ones inline (we still return them as "expired"
  // for the UI to surface a "this invitation expired" state).
  const now = Date.now();
  return NextResponse.json({
    invitations: rows.map((r) => ({
      id:            r.id,
      role:          r.role,
      expiresAt:     r.expiresAt.toISOString(),
      createdAt:     r.createdAt.toISOString(),
      expired:       r.expiresAt.getTime() < now,
      workspaceId:   r.business.id,
      workspaceName: r.business.name,
      invitedBy:     r.invitedBy.name ?? r.invitedBy.email,
    })),
  });
}
