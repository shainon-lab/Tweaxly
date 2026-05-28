// PATCH  /api/businesses/[id]/members/[memberId]  - change role
// DELETE /api/businesses/[id]/members/[memberId]  - remove member
//
// `memberId` is the User.id of the target member, NOT the membership
// row id - matches the workspace switcher / sidebar shape where the
// user is the canonical identifier. Only the workspace owner can
// invoke either action.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changeMemberRole, removeMember, INVITABLE_ROLES } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function ownerOnly(businessId: string, userId: string): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  // Authoritative ownership check: Business.ownerId. Workspaces
  // provisioned via admin tools or older flows may not have a
  // "account_admin" membership row, but they always have ownerId set.
  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { ownerId: true },
  });
  if (!business || business.ownerId !== userId) {
    return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: businessId, memberId } = await params;
  const user  = await requireUser();
  const gate  = await ownerOnly(businessId, user.id);
  if (!gate.ok) return gate.res;

  // Owner can't demote themselves through this endpoint - prevents
  // accidentally orphaning the workspace's only owner row.
  if (memberId === user.id) {
    return NextResponse.json({ error: "cannot_modify_owner" }, { status: 400 });
  }

  let body: { role?: unknown };
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const role = typeof body.role === "string" ? body.role : "";
  if (!INVITABLE_ROLES.includes(role as "admin" | "viewer")) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  await changeMemberRole(businessId, memberId, role as "admin" | "viewer");
  await recordAudit({
    actorUserId: user.id,
    action:      "membership.role_changed",
    targetBusinessId: businessId,
    metadata:    { targetUserId: memberId, newRole: role },
    request:     req,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: businessId, memberId } = await params;
  const user  = await requireUser();
  const gate  = await ownerOnly(businessId, user.id);
  if (!gate.ok) return gate.res;

  if (memberId === user.id) {
    return NextResponse.json({ error: "cannot_remove_owner" }, { status: 400 });
  }

  await removeMember(businessId, memberId);
  await recordAudit({
    actorUserId: user.id,
    action:      "membership.removed",
    targetBusinessId: businessId,
    metadata:    { targetUserId: memberId },
    request:     req,
  });

  return NextResponse.json({ ok: true });
}
