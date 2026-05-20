// Per-business mutations from the Settings → Workspaces page.
// Unlike /api/business (PATCH), which only operates on the user's
// current workspace via requireBusiness(), this route is keyed by
// businessId so a user can rename / delete a workspace they own
// without being scoped to it first.
//
// PATCH /api/businesses/[id]   body: { name?: string }
//   - any active member with role=account_admin can rename
//
// DELETE /api/businesses/[id]
//   - owner only (Business.ownerId === user.id)
//   - cascade-deletes every related record via the Prisma onDelete
//     rules on Business - this is irreversible

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

async function requireAdminMembership(userId: string, businessId: string) {
  return prisma.businessMembership.findUnique({
    where: { userId_businessId: { userId, businessId } },
    select: { role: true, status: true },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const m = await requireAdminMembership(user.id, params.id);
  if (!m || m.status !== "active" || m.role !== "account_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const data: { name?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    if (body.name.trim().length > 120) return NextResponse.json({ error: "name_too_long" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const updated = await prisma.business.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, name: updated.name });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (business.ownerId !== user.id) {
    return NextResponse.json({ error: "owner_only" }, { status: 403 });
  }
  // Confirmation must come via the UI (?confirm=delete in the URL) so
  // a stray DELETE without intent doesn't wipe a workspace.
  const url = new URL(req.url);
  if (url.searchParams.get("confirm") !== "delete") {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  }

  await prisma.business.delete({ where: { id: params.id } });

  // If the session was pointed at the deleted business, clear it so
  // requireBusiness() falls back to the user's next workspace.
  const session = await getSession();
  if (session.currentBusinessId === params.id) {
    session.currentBusinessId = undefined;
    await session.save();
  }

  return NextResponse.json({ ok: true });
}
