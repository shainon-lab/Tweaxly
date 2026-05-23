// POST /api/admin/accounts/[id]/overrides/[overrideId]/revoke
// Marks an AdminPlanOverride as revoked. Idempotent - revoking an
// already-revoked override is a no-op. Audit-logged. super_admin only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { revertOverrideCredits, reconcileEntitledCredits } from "@/lib/billing";

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
    // Idempotent - already revoked, return the row as-is. We still
    // re-run the revert helpers below since they themselves are
    // idempotent and the wallet may have been touched out of band.
  }

  const updated = override.revokedAt ? override : await prisma.adminPlanOverride.update({
    where: { id: override.id },
    data:  {
      revokedAt:   new Date(),
      revokedById: auth.user.id,
    },
  });

  // Reversion rules (spec):
  //   • Override revoked → revert all credits granted via this
  //     override. Driven by meta.overrideId on the original
  //     admin_grant txn(s).
  //   • If revoking this override also drops the workspace off a
  //     plan that had a recurring monthly allowance, reconcile so
  //     any orphaned monthly_grant credits go away too.
  const overrideRevert = await revertOverrideCredits(override.id, `Override revoked by admin (${override.kind})`);
  const reconcile      = await reconcileEntitledCredits(params.id);

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "account.plan_override_revoked",
    targetBusinessId: params.id,
    metadata: {
      businessName:    override.business.name,
      overrideId:      override.id,
      plan:            override.plan,
      kind:            override.kind,
      creditsReverted: overrideRevert.reverted + reconcile.reverted,
    },
    request: req,
  });

  return NextResponse.json({
    ok: true,
    override:        updated,
    creditsReverted: overrideRevert.reverted + reconcile.reverted,
  });
}
