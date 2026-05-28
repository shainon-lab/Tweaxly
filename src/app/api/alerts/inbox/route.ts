// GET /api/alerts/inbox
//
// Paginated list of notifications for the current user IN the current
// active workspace, newest first. The bell + notification center are
// always per-workspace so a user with multiple workspaces only sees
// the alerts for the one they're looking at.
//
// Optional query filters:
//   ?severity=critical|important|info
//   ?category=<AlertCategory>
//   ?businessId=all  // opt-in: show alerts across every workspace the
//                    // user belongs to (used by no UI today; kept for
//                    // future "all workspaces" view)
//   ?onlyUnread=1
//   ?limit=N (default 50, max 200)
//   ?cursor=<id>  // last id from the previous page

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { backfillIncomingInvitationNotifications } from "@/lib/memberships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user, business } = await requireBusiness();
  const url  = new URL(req.url);

  // Lazy backfill: any pending invitation issued to this user that
  // doesn't yet have a bell notification gets one written before we
  // read. Covers invitations created before the feature shipped and
  // any send-time notification write that failed.
  await backfillIncomingInvitationNotifications(user.id, user.email)
    .catch((err: unknown) => { console.error("[inbox] invitation backfill failed", err) });

  const severity   = url.searchParams.get("severity");
  const category   = url.searchParams.get("category");
  const businessId = url.searchParams.get("businessId");
  const onlyUnread = url.searchParams.get("onlyUnread") === "1";
  const limit      = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
  const cursor     = url.searchParams.get("cursor");

  const where: Record<string, unknown> = { userId: user.id };
  if (severity   && ["critical","important","info"].includes(severity)) where.severity = severity;
  if (category) where.category = category;
  // Strict per-workspace scope. The bell on every workspace shows ONLY
  // that workspace's notifications - switching workspaces re-renders
  // the layout and re-fetches the inbox with the new businessId. There
  // is no cross-workspace view from here; users who want to triage
  // multiple workspaces switch into each one explicitly.
  where.businessId = businessId ?? business.id;
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
