// Coupon validation + redemption.
// Validate is read-only (used at checkout to show the discount preview);
// redeem mutates state inside a Prisma transaction (creates a
// CouponRedemption, increments Coupon.usedCount, applies the credit
// grant if the coupon is a credits coupon). Discount-style coupons
// (percentage / fixed_amount) return their value via the redemption
// record - the billing-provider integration is responsible for
// translating that into an invoice line item.

import { prisma } from "@/lib/db";
import { grantCredits } from "./credits";
import { isPlanKey, type PlanKey } from "./plans";

export type CouponKind = "percentage" | "fixed_amount" | "credits" | "trial_extension";

export type CouponInvalidReason =
  | "not_found"
  | "disabled"
  | "not_yet_active"
  | "expired"
  | "max_redemptions_reached"
  | "user_limit_reached"
  | "plan_not_applicable"
  | "plan_excluded"
  | "not_for_user"
  | "not_for_business"
  | "not_for_email"
  | "already_redeemed";

export interface ValidateCouponContext {
  userId?:    string;
  userEmail?: string;
  businessId?: string;
  plan?:      PlanKey;
}

export type ValidateResult =
  | { ok: true;  coupon: Awaited<ReturnType<typeof prisma.coupon.findFirst>> & {} }
  | { ok: false; reason: CouponInvalidReason };

// Read-only check. Safe to call from a public endpoint as long as it's
// rate-limited - it does not mutate or expose internal admin metadata.
export async function validateCoupon(
  code: string,
  ctx: ValidateCouponContext = {},
): Promise<ValidateResult> {
  const normalised = code.trim();
  if (!normalised) return { ok: false, reason: "not_found" };

  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: normalised, mode: "insensitive" } },
  });
  if (!coupon) return { ok: false, reason: "not_found" };
  if (coupon.disabled) return { ok: false, reason: "disabled" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, reason: "not_yet_active" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, reason: "expired" };

  if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
    return { ok: false, reason: "max_redemptions_reached" };
  }

  // Per-user cap.
  if (ctx.userId && coupon.maxPerUser != null) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: ctx.userId },
    });
    if (used >= coupon.maxPerUser) return { ok: false, reason: "user_limit_reached" };
  }

  // Plan restrictions.
  if (ctx.plan && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(ctx.plan)) {
    return { ok: false, reason: "plan_not_applicable" };
  }
  if (ctx.plan && coupon.excludedPlans.includes(ctx.plan)) {
    return { ok: false, reason: "plan_excluded" };
  }

  // Targeting.
  if (coupon.targetUserId && coupon.targetUserId !== ctx.userId) {
    return { ok: false, reason: "not_for_user" };
  }
  if (coupon.targetBusinessId && coupon.targetBusinessId !== ctx.businessId) {
    return { ok: false, reason: "not_for_business" };
  }
  if (coupon.targetEmail && ctx.userEmail && coupon.targetEmail.toLowerCase() !== ctx.userEmail.toLowerCase()) {
    return { ok: false, reason: "not_for_email" };
  }

  // Idempotency: same user+business+coupon shouldn't redeem twice for
  // a credit/trial coupon. Discount coupons can re-apply across cycles
  // via the billing provider, but the redemption table still enforces
  // the unique constraint.
  if (ctx.userId && ctx.businessId) {
    const already = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId_businessId: {
          couponId:   coupon.id,
          userId:     ctx.userId,
          businessId: ctx.businessId,
        },
      },
    });
    if (already) return { ok: false, reason: "already_redeemed" };
  }

  return { ok: true, coupon };
}

export interface RedeemCouponContext {
  userId:        string;
  businessId:    string;
  userEmail?:    string;
  plan?:         PlanKey;
  // Optional subscription this redemption is attached to (so discount-
  // style coupons can be traced to the subscription that received them).
  subscriptionId?: string;
}

export interface RedeemEffect {
  discountAmount?:   number;
  creditsGranted?:   number;
  trialDaysGranted?: number;
}

export type RedeemResult =
  | { ok: true;  effect: RedeemEffect; redemptionId: string }
  | { ok: false; reason: CouponInvalidReason };

export async function redeemCoupon(code: string, ctx: RedeemCouponContext): Promise<RedeemResult> {
  const validation = await validateCoupon(code, {
    userId:     ctx.userId,
    userEmail:  ctx.userEmail,
    businessId: ctx.businessId,
    plan:       ctx.plan,
  });
  if (!validation.ok) return { ok: false, reason: validation.reason };
  const coupon = validation.coupon!;

  // Apply credit grants outside the redemption transaction because
  // grantCredits opens its own transaction. The redemption row is
  // the integrity boundary - if it fails we don't mark the coupon
  // used.
  const effect: RedeemEffect = {};
  if (coupon.kind === "credits") {
    await grantCredits(ctx.businessId, coupon.value, "coupon", {
      reason: `Coupon ${coupon.code}`,
      meta:   { couponId: coupon.id, couponCode: coupon.code },
    });
    effect.creditsGranted = coupon.value;
  } else if (coupon.kind === "trial_extension") {
    effect.trialDaysGranted = coupon.value;
  } else if (coupon.kind === "percentage" || coupon.kind === "fixed_amount") {
    effect.discountAmount = coupon.value;
  }

  const redemption = await prisma.$transaction(async (tx) => {
    const r = await tx.couponRedemption.create({
      data: {
        couponId:         coupon.id,
        userId:           ctx.userId,
        businessId:       ctx.businessId,
        subscriptionId:   ctx.subscriptionId ?? null,
        discountAmount:   effect.discountAmount   ?? null,
        creditsGranted:   effect.creditsGranted   ?? null,
        trialDaysGranted: effect.trialDaysGranted ?? null,
      },
    });
    await tx.coupon.update({
      where: { id: coupon.id },
      data:  { usedCount: { increment: 1 } },
    });
    return r;
  });

  return { ok: true, effect, redemptionId: redemption.id };
}

// Helper: format the human-readable summary of a coupon (used in
// checkout previews and the admin panel). Doesn't hit the DB.
export function summariseCoupon(coupon: {
  kind: string; value: number; billingCycle?: string | null; cycleCount?: number | null;
}): string {
  switch (coupon.kind) {
    case "percentage":
      return coupon.billingCycle === "first_payment"
        ? `${coupon.value}% off first payment`
        : coupon.billingCycle === "limited_cycles" && coupon.cycleCount
          ? `${coupon.value}% off for ${coupon.cycleCount} cycles`
          : `${coupon.value}% off`;
    case "fixed_amount":
      return `$${(coupon.value / 100).toFixed(2)} off`;
    case "credits":
      return `+${coupon.value.toLocaleString()} AI Credits`;
    case "trial_extension":
      return `${coupon.value} days of trial`;
    default:
      return "Discount applied";
  }
}

// Re-export PlanKey so coupon callers don't have to import from plans.ts.
export { isPlanKey };
