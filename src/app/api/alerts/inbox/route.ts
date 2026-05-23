// GET /api/alerts/inbox
//
// Paginated list of the current user's notifications, newest first.
// Optional query filters:
//   ?severity=critical|important|info
//   ?category=<AlertCategory>
//   ?businessId=<id>
//   ?onlyUnread=1
//   ?limit=N (default 50, max 200)
//   ?cursor=<id>  // last id from the previous page

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser();
  const url  = new URL(req.url);

  const severity   = url.searchParams.get("severity");
  const category   = url.searchParams.get("category");
  const businessId = url.searchParams.get("businessId");
  const onlyUnread = url.searchParams.get("onlyUnread") === "1";
  const limit      = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
  const cursor     = url.searchParams.get("cursor");

  const where: Record<string, unknown> = { userId: user.id };
  if (severity   && ["critical","important","info"].includes(severity)) where.severity = severity;
  if (category) where.category = category;
  if (businessId) where.businessId = businessId;
  if (onlyUnread) where.readAt = null;

  const items = await prisma.alertNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  const hasMore = items.length > limit;
  const page    = hasMore ? items.slice(0, limit) : items;
  return NextResponse.json({
    items: page.map((n) => ({
      id:           n.id,
      source:       n.source,
      sourceKey:    n.sourceKey,
      category:     n.category,
      severity:     n.severity,
      title:        n.title,
      body:         n.body,
      deepLink:     n.deepLink,
      readAt:       n.readAt?.toISOString() ?? null,
      createdAt:    n.createdAt.toISOString(),
      businessId:   n.businessId,
      businessName: n.business?.name ?? "",
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}
