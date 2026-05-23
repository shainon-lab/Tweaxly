// POST /api/alerts/inbox/read-all
//
// Marks every unread notification for the current user as read.
// Default scope is the CURRENT active workspace so "Mark all read"
// in the bell panel only clears the workspace the user is looking
// at. ?businessId=all opts out of the scoping.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, business } = await requireBusiness();
  const url  = new URL(req.url);
  const businessId = url.searchParams.get("businessId");

  const where: Record<string, unknown> = { userId: user.id, readAt: null };
  if (businessId === "all") {
    // no-op — leave businessId unscoped
  } else if (businessId) {
    where.businessId = businessId;
  } else {
    where.businessId = business.id;
  }

  const updated = await prisma.alertNotification.updateMany({
    where,
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true, count: updated.count });
}
