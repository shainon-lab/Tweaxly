// POST /api/alerts/inbox/read-all
//
// Marks every unread notification for the current user as read.
// Optional ?businessId= filter scopes the operation to one workspace.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser();
  const url  = new URL(req.url);
  const businessId = url.searchParams.get("businessId");

  const where: Record<string, unknown> = { userId: user.id, readAt: null };
  if (businessId) where.businessId = businessId;

  const updated = await prisma.alertNotification.updateMany({
    where,
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true, count: updated.count });
}
