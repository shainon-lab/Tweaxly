// POST /api/billing/portal
//
// Returns a Polar customer-portal URL for the active workspace's
// current subscription. The portal is where users manage payment
// method, view invoices, and cancel - we don't reimplement any of
// that ourselves. Requires an existing Subscription row with an
// externalCustomerId (i.e. the user has checked out at least once).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { createCustomerPortalSession, POLAR_PROVIDER } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function POST() {
  const { business } = await requireBusiness();
  const sub = await prisma.subscription.findFirst({
    where:   { businessId: business.id, externalProvider: POLAR_PROVIDER },
    orderBy: { createdAt: "desc" },
    select:  { externalCustomerId: true },
  });
  if (!sub?.externalCustomerId) {
    return NextResponse.json({
      error:   "no_subscription",
      message: "Start a Pro subscription first - the customer portal is created at checkout time.",
    }, { status: 400 });
  }
  try {
    const { url } = await createCustomerPortalSession({ customerId: sub.externalCustomerId });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "portal_failed";
    return NextResponse.json({ error: "portal_failed", message }, { status: 500 });
  }
}
