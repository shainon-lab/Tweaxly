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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user, business } = await requireBusiness();
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
  // Default: scope to active workspace. Explicit ?businessId=all opts
  // out of the scoping; any other value scopes to that workspace
  // (membership check is enforced server-side via requireBusiness above,
  // so a malicious id only ever sees their OWN notifications anyway).
  //
  // Exception: workspace_invitation notifications ALWAYS surface,
  // regardless of which workspace the invitee is currently viewing and
  // regardless of their plan. An invitation is an account-level event,
  // not a workspace-level one - hiding it because the user happens to
  // be looking at a different workspace would silently drop it.
  if (businessId === "all") {
    // no-op - leave businessId unscoped
  } else {
    const scopeId = businessId ?? business.id;
    where.OR = [
      { businessId: scopeId },
      { category:   "workspace_invitation" },
    ];
  }
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
