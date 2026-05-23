// POST /api/admin/accounts/[id]/credits/refund
//   body: { purchaseTxnId: string; reason?: string }
//
// Mark a credit-pack purchase as refunded and revert whatever portion
// of that pack is still in the wallet. Per spec, pack-purchase credits
// are the ONLY ones that survive a subscription lapse - but only if
// the pack itself wasn't refunded or canceled. This endpoint is the
// trigger for that revert. Idempotent + audit-logged. super_admin only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { refundPurchase } from "@/lib/billing";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: { purchaseTxnId?: unknown; reason?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  if (typeof body.purchaseTxnId !== "string" || !body.purchaseTxnId.trim()) {
    return NextResponse.json({ error: "missing_purchase_txn_id" }, { status: 400 });
  }
  const purchaseTxnId = body.purchaseTxnId.trim();
  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim().slice(0, 500)
    : "Credit pack refunded by admin";

  // Sanity-check the purchase belongs to this business so admins
  // can't accidentally refund a pack from another workspace.
  const purchase = await prisma.aiCreditTransaction.findFirst({
    where: { id: purchaseTxnId, kind: "purchase", businessId: params.id },
    select: { id: true, delta: true },
  });
  if (!purchase) {
    return NextResponse.json({ error: "purchase_not_found" }, { status: 404 });
  }

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { reverted } = await refundPurchase(purchaseTxnId, reason);

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "account.credits_refunded",
    targetBusinessId: business.id,
    metadata: {
      businessName:    business.name,
      purchaseTxnId,
      packOriginal:    purchase.delta,
      creditsReverted: reverted,
      reason,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, reverted });
}
