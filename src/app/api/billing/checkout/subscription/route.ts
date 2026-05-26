// POST /api/billing/checkout/subscription
//
// Open a Polar checkout for the Pro $49/mo subscription on the
// currently-active workspace. The workspace + plan are derived
// server-side - the client never picks the price - so users can't
// trick a discount or grant Pro to a workspace they don't own.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { requireEmailVerified } from "@/lib/auth/verificationGate";
import { createSubscriptionCheckout } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function POST() {
  const { business, user } = await requireBusiness();
  // Billing surfaces are blocked for unverified users. We don't want
  // to take money from an unconfirmed identity, and Polar's webhook
  // would otherwise activate Pro before the email is verified.
  const gate = await requireEmailVerified(user, "checkout/subscription");
  if (!gate.ok) {
    return NextResponse.json({
      error:   "email_unverified",
      reason:  gate.reason,
      message: "Please verify your email to upgrade.",
    }, { status: 403 });
  }
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
