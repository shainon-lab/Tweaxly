// GET /api/alerts/inbox/unread-count
//
// Lightweight count for the bell badge. The bell polls this every
// ~30 seconds when mounted - keep the response tiny.
//
// Scoped to the CURRENT active workspace via requireBusiness, so the
// badge only shows notifications for the workspace the user is
// looking at. Switching workspaces (via BusinessSwitcher) re-renders
// the layout and the bell re-polls with the new businessId.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, business } = await requireBusiness();
  const count = await prisma.alertNotification.count({
    where: { userId: user.id, businessId: business.id, readAt: null },
  });
  return NextResponse.json({ unread: count });
}
