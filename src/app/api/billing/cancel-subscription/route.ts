// POST /api/billing/cancel-subscription
// POST /api/billing/cancel-subscription/undo
//
// Self-service "schedule downgrade to Free" - asks Polar to mark the
// current subscription cancelAtPeriodEnd. The subscription keeps
// working (workspace stays on its current tier) until the current
// period ends, then auto-cancels. Polar emits subscription.canceled
// at the boundary; our webhook flips the local Subscription.status
// to canceled, which the entitlements layer resolves as "free".
//
// Body: { undo?: boolean }
//   undo = true reverses a previously-scheduled cancellation.
//
// This endpoint does NOT support Business → Pro downgrades. Polar's
// product swap on an active subscription isn't wired yet; for now
// the customer cancels and re-subscribes to Pro from the next-period
// Free state.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEffectivePlan } from "@/lib/billing";
import {
  cancelSubscriptionAtPeriodEnd,
  uncancelSubscription,
} from "@/lib/billing/polar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();

  const body = await req.json().catch(() => null) as { undo?: unknown } | null;
  const undo = body?.undo === true;

  // The cancellation target IS the current subscription. We look it
  // up via the effective plan so admin-override / read-only states
  // are handled correctly.
  const effective = await getEffectivePlan(business.id);
  if (effective.source !== "subscription" || !effective.subscriptionId) {
    return NextResponse.json({
      error:   "no_subscription",
      message: "This workspace has no active paid subscription to cancel.",
    }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where:  { id: effective.subscriptionId },
    select: { id: true, externalSubscriptionId: true, cancelAtPeriodEnd: true },
  });
  if (!sub?.externalSubscriptionId) {
    return NextResponse.json({
      error:   "no_external_id",
      message: "This subscription isn't connected to the billing provider.",
    }, { status: 400 });
  }

  try {
    if (undo) {
      await uncancelSubscription(sub.externalSubscriptionId);
    } else {
      await cancelSubscriptionAtPeriodEnd(sub.externalSubscriptionId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "polar_update_failed";
    console.error("[cancel-subscription]", { businessId: business.id, undo, message });
    return NextResponse.json({ error: "polar_update_failed", message }, { status: 502 });
  }

  // Mirror the change locally so the UI reflects it immediately -
  // the webhook will round-trip it again but waiting on the
  // round-trip means the user sees a stale state for ~1-2 seconds.
  await prisma.subscription.update({
    where: { id: sub.id },
    data:  { cancelAtPeriodEnd: !undo },
  });

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: !undo,
  });
}
