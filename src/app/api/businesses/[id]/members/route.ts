// GET  /api/businesses/[id]/members
// POST /api/businesses/[id]/members  (placeholder - members are added
//                                     by accepting invitations, not by
//                                     this endpoint)
//
// Returns the members list + pending invitations + cap info. Used by
// the Settings → Members & Access surface.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listMembers, listPendingInvitations, countMembersAgainstCap, normalizeRole,
} from "@/lib/memberships";
import { getEffectivePlan } from "@/lib/billing";
import { getPlanLimits } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const user = await requireUser();

  // Caller must be a member of the workspace.
  const membership = await prisma.businessMembership.findFirst({
    where:  { businessId, userId: user.id, status: "active" },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [members, invitations, used, effective] = await Promise.all([
    listMembers(businessId),
    listPendingInvitations(businessId),
    countMembersAgainstCap(businessId),
    getEffectivePlan(businessId),
  ]);

  const cap = getPlanLimits(effective.plan).members;

  return NextResponse.json({
    members,
    invitations,
    viewerRole: normalizeRole(membership.role),
    cap:        cap === "unlimited" ? null : cap,
    used,
    plan:       effective.plan,
  });
}
