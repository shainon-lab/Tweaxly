// PATCH  /api/alerts/inbox/:id  - mark a single notification read
//   body: { readAt?: string|null }  - omit to use Date.now(); pass null to mark unread
// DELETE /api/alerts/inbox/:id  - clear the notification
//
// Only the owning user can touch their own notifications - enforced
// via a userId filter on every write.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  let body: { readAt?: unknown } = {};
  try { body = await req.json() }
  catch { /* allow empty body - means "mark as read now" */ }

  const readAt: Date | null =
    body.readAt === null    ? null :
    body.readAt === undefined ? new Date() :
    typeof body.readAt === "string" ? new Date(body.readAt) :
    new Date();

  const updated = await prisma.alertNotification.updateMany({
    where: { id: params.id, userId: user.id },
    data:  { readAt },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  await prisma.alertNotification.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
