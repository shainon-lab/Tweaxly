// POST /api/billing/checkout/subscription
//
// Open a Polar checkout for the chosen paid subscription tier on the
// currently-active workspace. The workspace is derived server-side,
// and the chosen plan is whitelisted against the known paid tiers,
// so users can't grant a plan to a workspace they don't own or
// pick a price the client made up.
//
// Body: { planId?: "pro" | "business" }
//   Defaults to "pro" when omitted (back-compat with the original
//   Pro-only call sites).

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { requireEmailVerified } from "@/lib/auth/verificationGate";
import { createSubscriptionCheckout } from "@/lib/billing/polar";
import { getEffectivePlan } from "@/lib/billing";

export const dynamic = "force-dynamic";

const PAID_PLANS = ["pro", "business"] as const;
type PaidPlan = (typeof PAID_PLANS)[number];

export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();
  // Billing surfaces are blocked for unverified users. We don't want
  // to take money from an unconfirmed identity, and Polar's webhook
  // would otherwise activate the plan before the email is verified.
  const gate = await requireEmailVerified(user, "checkout/subscription");
  if (!gate.ok) {
    return NextResponse.json({
      error:   "email_unverified",
      reason:  gate.reason,
      message: "Please verify your email to upgrade.",
    }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { planId?: unknown } | null;
  const requested = body?.planId;
  const planId: PaidPlan =
    typeof requested === "string" && (PAID_PLANS as readonly string[]).includes(requested)
      ? requested as PaidPlan
      : "pro";

  // Distinguish first-time subscription from a paid-to-paid upgrade
  // for the order ledger. Anyone leaving "free" is a new_subscription;
  // anyone moving between paid tiers (Pro → Business) is an upgrade.
  const effective = await getEffectivePlan(business.id);
  const purchaseType: "new_subscription" | "upgrade" =
    effective.plan === "free" ? "new_subscription" : "upgrade";

  try {
    const { url } = await createSubscriptionCheckout({
      businessId:    business.id,
      customerEmail: user.email,
      userId:        user.id,
      businessName:  business.name,
      purchaseType,
      planId,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    console.error("[checkout/subscription] failed", { businessId: business.id, planId, message });
    return NextResponse.json({ error: "checkout_failed", message }, { status: 500 });
  }
}
