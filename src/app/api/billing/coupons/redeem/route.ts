// POST /api/billing/coupons/redeem
//   body: { code: string }
//
// User-facing coupon redemption. Authenticated; redeems against the
// current business. Used today for AI-credit coupons (apply
// immediately) and trial-extension coupons (recorded for the
// billing layer to consume); discount coupons (percentage /
// fixed_amount) record a redemption that the future billing
// integration will translate into an invoice line item.
//
// Audit-logged via the redemption record itself (couponId / userId /
// businessId snapshot) - we don't double-write to AuditLog since
// this is user-initiated, not admin action.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { redeemCoupon, getEffectivePlan, summariseCoupon } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user, business } = await requireBusiness();
  let body: { code?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });

  const eff = await getEffectivePlan(business.id);
  const result = await redeemCoupon(code, {
    userId:     user.id,
    businessId: business.id,
    userEmail:  user.email,
    plan:       eff.plan,
  });
  if (!result.ok) {
    return NextResponse.json({
      ok:      false,
      reason:  result.reason,
      message: messageFor(result.reason),
    }, { status: 400 });
  }

  return NextResponse.json({
    ok:      true,
    summary: summariseCoupon(result.coupon),
    effect:  result.effect,
  });
}

function messageFor(reason: string): string {
  switch (reason) {
    case "not_found":               return "That promo code doesn't match anything we know.";
    case "disabled":                return "This promo code is currently disabled.";
    case "not_yet_active":          return "This promo code isn't active yet.";
    case "expired":                 return "This promo code has expired.";
    case "max_redemptions_reached": return "This promo code has reached its redemption limit.";
    case "user_limit_reached":      return "You've already redeemed this code the maximum number of times.";
    case "plan_not_applicable":     return "This code doesn't apply to your current plan.";
    case "plan_excluded":           return "This code can't be used on your current plan.";
    case "not_for_user":            return "This code isn't valid for your account.";
    case "not_for_business":        return "This code isn't valid for this workspace.";
    case "not_for_email":           return "This code was issued to a different email address.";
    case "already_redeemed":        return "You've already redeemed this code.";
    default:                        return "This code couldn't be applied.";
  }
}
