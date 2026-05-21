// POST /api/admin/accounts/[id]/overrides/[overrideId]/revoke
// Marks an AdminPlanOverride as revoked. Idempotent - revoking an
// already-revoked override is a no-op. Audit-logged. super_admin only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string; overrideId: string } },
) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const override = await prisma.adminPlanOverride.findFirst({
    where: { id: params.overrideId, businessId: params.id },
    include: { business: { select: { name: true } } },
  });
  if (!override) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (override.revokedAt) {
    // Idempotent - already revoked, return the row as-is.
    return NextResponse.json({ ok: true, override });
  }

  const updated = await prisma.adminPlanOverride.update({
    where: { id: override.id },
    data:  {
      revokedAt:   new Date(),
      revokedById: auth.user.id,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "account.plan_override_revoked",
    targetBusinessId: params.id,
    metadata: {
      businessName: override.business.name,
      overrideId:   override.id,
      plan:         override.plan,
      kind:         override.kind,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, override: updated });
}
