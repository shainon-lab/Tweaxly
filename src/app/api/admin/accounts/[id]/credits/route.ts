// POST /api/admin/accounts/[id]/credits
//   body: { amount: number; reason?: string }
//
// Admin grants AI Credits to a business outside the normal plan
// allowance. Used for goodwill grants, lifetime deals, beta-tester
// bonuses, etc. Goes through the standard ledger so the wallet
// balance + transaction history reflect it. Audit-logged.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { grantCredits } from "@/lib/billing";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: { amount?: unknown; reason?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const amount = typeof body.amount === "number" && Number.isFinite(body.amount)
    ? Math.floor(body.amount)
    : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalid_amount", message: "amount must be a positive integer" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim().slice(0, 500)
    : "Admin grant";

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { balance } = await grantCredits(business.id, amount, "admin_grant", {
    reason,
    meta: { adminUserId: auth.user.id },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "account.credits_granted",
    targetBusinessId: business.id,
    metadata: {
      businessName: business.name,
      amount,
      reason,
      balanceAfter: balance,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, balance, amount });
}
