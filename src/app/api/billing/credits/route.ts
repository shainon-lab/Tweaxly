// GET /api/billing/credits
// Returns the current AI Credit balance + plan context for the
// requesting business. The UI calls this on first render to populate
// the credit-balance widget; subsequent updates ride on the
// consultation POST response so we don't pay an extra roundtrip per
// message.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import {
  ensureMonthlyAllowance, getEffectivePlan, getPlanLimits,
  CREDIT_COSTS,
} from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const { business } = await requireBusiness();
  const eff = await getEffectivePlan(business.id);
  const wallet = await ensureMonthlyAllowance(business.id);
  const limits = getPlanLimits(eff.plan);

  return NextResponse.json({
    plan:               eff.plan,
    planSource:         eff.source,
    readOnly:           eff.readOnly,
    balance:            wallet.balance,
    monthlyAllowance:   limits.monthlyAICredits,
    creditCosts:        CREDIT_COSTS,
    currentPeriodEnd:   eff.currentPeriodEnd ?? null,
    cancelAtPeriodEnd:  eff.cancelAtPeriodEnd ?? false,
  });
}
