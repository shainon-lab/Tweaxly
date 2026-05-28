// GET /api/alerts/inbox/unread-count
//
// Lightweight count for the bell badge. The bell polls this every
// ~30 seconds when mounted - keep the response tiny.
//
// Strict per-workspace scope: the badge counts ONLY the current
// active workspace's unread notifications. A user with 19 unread
// across all workspaces but only 3 in the workspace they're in
// right now sees "3" on the bell - matching the rest of the UI's
// "you're operating on this one workspace" model.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { backfillIncomingInvitationNotifications } from "@/lib/memberships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, business } = await requireBusiness();
  // Lazy backfill so the badge picks up invitations that predate
  // the feature or whose send-time notification write failed. The
  // backfill anchors invitations to a workspace the user can open
  // (owned > active membership > inviting workspace) so they still
  // surface on at least one bell.
  await backfillIncomingInvitationNotifications(user.id, user.email)
    .catch((err: unknown) => { console.error("[unread-count] invitation backfill failed", err) });
  const count = await prisma.alertNotification.count({
    where: {
      userId:     user.id,
      businessId: business.id,
      readAt:     null,
    },
  });
  return NextResponse.json({ unread: count });
}
