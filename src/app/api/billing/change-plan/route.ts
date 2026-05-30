// POST /api/billing/change-plan
//
// Switch the workspace's existing paid subscription to a different
// paid tier without going through a fresh Polar checkout.
//
//   Pro → Business   prorate immediately; Business entitlements
//                    granted right away, prorated invoice charged
//                    on the spot
//   Business → Pro   scheduled at period_end; Business entitlements
//                    remain until the renewal date, Pro takes over
//                    automatically when the cycle rolls
//
// Body: { target: "pro" | "business" }
//
// Errors:
//   400 no_subscription     workspace has no active paid sub
//   400 same_plan           target is the current plan
//   400 invalid_target      target is not "pro" | "business"
//   402 feature_unavailable workspace plan doesn't allow this change
//                           (read-only / canceled sub)
//   502 polar_update_failed Polar API returned an error
//
// The same endpoint serves both upgrades and downgrades. The local
// Subscription row is updated optimistically: for upgrades
// (prorate=invoice), Subscription.plan flips to the new tier
// immediately. For downgrades (next_period), we set
// Subscription.scheduledDowngradeTo so the UI can surface the
// pending change; the webhook clears it when the actual swap lands.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEffectivePlan } from "@/lib/billing";
import {
  changeSubscriptionPlan,
  getSubscriptionProductId,
} from "@/lib/billing/polar";

export const runtime = "nodejs";

const PAID_PLANS = ["pro", "business"] as const;
type PaidPlan = (typeof PAID_PLANS)[number];

// Tier rank used to classify the request as an upgrade or a
// downgrade. Higher rank = more expensive / more features.
const RANK: Record<PaidPlan, number> = { pro: 1, business: 2 };

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();

  const body = await req.json().catch(() => null) as { target?: unknown } | null;
  const target = body?.target;
  if (typeof target !== "string" || !(PAID_PLANS as readonly string[]).includes(target)) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  const targetPlan = target as PaidPlan;

  const effective = await getEffectivePlan(business.id);
  if (effective.source !== "subscription" || !effective.subscriptionId) {
    return NextResponse.json({
      error:   "no_subscription",
      message: "This workspace has no active paid subscription. Open the upgrade modal to start a new subscription.",
    }, { status: 400 });
  }
  if (effective.readOnly) {
    return NextResponse.json({
      error:   "feature_unavailable",
      message: "This subscription is read-only and can't be changed in place. Reactivate first via Manage subscription.",
    }, { status: 402 });
  }

  // No-op guard. The current plan in EffectivePlan reflects the
  // PlanKey we resolve from Subscription.plan; comparing against
  // the requested target lets us 400 instead of issuing a Polar
  // call that would also be a no-op.
  if (effective.plan === targetPlan) {
    return NextResponse.json({
      error:   "same_plan",
      message: `This workspace is already on the ${targetPlan} plan.`,
    }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where:  { id: effective.subscriptionId },
    select: { id: true, externalSubscriptionId: true, plan: true, currentPeriodEnd: true },
  });
  if (!sub?.externalSubscriptionId) {
    return NextResponse.json({
      error:   "no_external_id",
      message: "This subscription isn't connected to the billing provider.",
    }, { status: 400 });
  }

  const targetProductId = getSubscriptionProductId(targetPlan);
  if (!targetProductId) {
    // Wiring error: the corresponding POLAR_PRODUCT_*_ID env is unset.
    return NextResponse.json({
      error:   "product_not_configured",
      message: `Billing product for the ${targetPlan} plan is not configured. Contact support.`,
    }, { status: 500 });
  }

  // Upgrade vs downgrade decides proration behavior. The split is
  // a customer-friendliness call: upgrades feel earned (you wanted
  // the feature now, you pay now); downgrades feel reversible (you
  // changed your mind, you keep what you paid for through the cycle).
  const isUpgrade = RANK[targetPlan] > RANK[effective.plan as PaidPlan];
  const prorationBehavior: "invoice" | "next_period" =
    isUpgrade ? "invoice" : "next_period";

  try {
    await changeSubscriptionPlan({
      externalSubscriptionId: sub.externalSubscriptionId,
      targetProductId,
      prorationBehavior,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "polar_update_failed";
    console.error("[change-plan]", {
      businessId: business.id, from: effective.plan, to: targetPlan, message,
    });
    return NextResponse.json({ error: "polar_update_failed", message }, { status: 502 });
  }

  // Mirror state locally so the UI updates immediately. The webhook
  // will round-trip the canonical state but we don't want to wait on
  // it for the user who just clicked.
  if (isUpgrade) {
    // Immediate plan flip + wipe any scheduled downgrade that was
    // previously stamped (a Pro user with a "downgrading to Free at
    // period end" scheduled and who decides to upgrade to Business
    // mid-cycle is effectively saying "actually I want more, not
    // less").
    await prisma.subscription.update({
      where: { id: sub.id },
      data:  {
        plan:                 targetPlan,
        scheduledDowngradeTo: null,
      },
    });
  } else {
    // Schedule marker only. Subscription.plan stays as-is until the
    // webhook fires at period_end with the new productId.
    await prisma.subscription.update({
      where: { id: sub.id },
      data:  { scheduledDowngradeTo: targetPlan },
    });
  }

  return NextResponse.json({
    ok:               true,
    from:             effective.plan,
    to:               targetPlan,
    appliedAt:        isUpgrade ? "immediately" : "period_end",
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
  });
}
