// POST /api/billing/checkout/subscription
//
// Open a Polar checkout for the Pro $49/mo subscription on the
// currently-active workspace. The workspace + plan are derived
// server-side - the client never picks the price - so users can't
// trick a discount or grant Pro to a workspace they don't own.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function POST() {
  const { business, user } = await requireBusiness();
  try {
    const { url } = await createSubscriptionCheckout({
      businessId:    business.id,
      customerEmail: user.email,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    console.error("[checkout/subscription] failed", { businessId: business.id, message });
    return NextResponse.json({ error: "checkout_failed", message }, { status: 500 });
  }
}
