// GET /api/businesses/[id]/members
//
// Returns the members list + pending invitations + cap info. Used by
// the Settings → Members & Access surface.
//
// Owner determination uses Business.ownerId as the authoritative
// source - NOT the BusinessMembership.role - because workspaces
// provisioned via admin tools or older flows may not have a
// "account_admin" membership row but DO have ownerId set.

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

  // Fetch the business so we can use ownerId as the truth for the
  // "is the viewer the owner?" check.
  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { ownerId: true },
  });
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isViewerOwner = business.ownerId === user.id;

  // Non-owners still need to be a member to see the page at all.
  let viewerRole: "owner" | "admin" | "viewer" | null = null;
  if (isViewerOwner) {
    viewerRole = "owner";
  } else {
    const membership = await prisma.businessMembership.findFirst({
      where:  { businessId, userId: user.id, status: "active" },
      select: { role: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const r = normalizeRole(membership.role);
    viewerRole = r === "owner" ? "admin" : r; // safety: non-ownerId users can't be "owner"
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
    viewerRole,
    cap:        cap === "unlimited" ? null : cap,
    used,
    plan:       effective.plan,
  });
}
