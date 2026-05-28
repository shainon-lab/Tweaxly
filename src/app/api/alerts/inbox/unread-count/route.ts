// GET /api/alerts/inbox/unread-count
//
// Lightweight count for the bell badge. The bell polls this every
// ~30 seconds when mounted - keep the response tiny.
//
// Scoped to the CURRENT active workspace via requireBusiness so the
// badge stays per-workspace - EXCEPT for workspace_invitation
// notifications, which always surface (an invitation is an
// account-level event, not a workspace one - it must show up
// regardless of which workspace the invitee is currently viewing
// and regardless of plan).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { backfillIncomingInvitationNotifications } from "@/lib/memberships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, business } = await requireBusiness();
  // Lazy backfill so the badge picks up invitations that predate
  // the feature or whose send-time notification write failed.
  await backfillIncomingInvitationNotifications(user.id, user.email)
    .catch((err: unknown) => { console.error("[unread-count] invitation backfill failed", err) });
  const count = await prisma.alertNotification.count({
    where: {
      userId: user.id,
      readAt: null,
      OR: [
        { businessId: business.id },
        { category:   "workspace_invitation" },
      ],
    },
  });
  return NextResponse.json({ unread: count });
}
