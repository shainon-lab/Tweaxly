// GET /api/alerts/inbox/unread-count
//
// Lightweight count for the bell badge. The bell polls this every
// ~30 seconds when mounted - keep the response tiny.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const count = await prisma.alertNotification.count({
    where: { userId: user.id, readAt: null },
  });
  return NextResponse.json({ unread: count });
}
