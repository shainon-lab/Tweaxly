// Effective-plan resolution and feature/quota gates.
// The composition order is:
//   1. AdminPlanOverride (latest active by createdAt) - wins outright
//   2. Subscription      (latest active|trialing)     - normal billing
//   3. "free"                                          - default fallback
//
// Existing Business.plan String field is intentionally NOT consulted -
// it's a legacy display hint, kept for backwards-compat with old admin
// UI. New callers should always go through this module.

import { prisma } from "@/lib/db";
import {
  PLANS, getPlanLimits,
  type PlanKey, type PlanLimits, type PlanFeatures,
  normalizePlan,
} from "./plans";

export interface EffectivePlan {
  plan:         PlanKey;
  source:       "override" | "subscription" | "default";
  // Set when source = "override" - so callers can show "Plan: Pro (Admin Override)".
  overrideId?:  string;
  overrideKind?: string;
  // Set when source = "subscription" - includes the billing period end.
  subscriptionId?:      string;
  currentPeriodEnd?:    Date;
  cancelAtPeriodEnd?:   boolean;
  // True when the source is a Subscription in status="canceled" OR
  // status="past_due" - caller should render read-only mode.
  readOnly:     boolean;
}

const ACTIVE_SUB_STATUSES = ["active", "trialing"] as const;
const READ_ONLY_SUB_STATUSES = ["canceled", "past_due", "incomplete"] as const;

export async function getEffectivePlan(businessId: string): Promise<EffectivePlan> {
  const now = new Date();

  // 1. Admin override
  const override = await prisma.adminPlanOverride.findFirst({
    where: {
      businessId,
      effectiveFrom: { lte: now },
      revokedAt:     null,
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  if (override) {
    // Legacy "business" rows normalise up to Pro - the tier was
    // collapsed when we moved to the 2-plan model.
    const plan = normalizePlan(override.plan);
    return {
      plan,
      source:       "override",
      overrideId:   override.id,
      overrideKind: override.kind,
      readOnly:     false,
    };
  }

  // 2. Subscription
  const sub = await prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  if (sub) {
    const plan = normalizePlan(sub.plan);
    const activeLike = (ACTIVE_SUB_STATUSES as readonly string[]).includes(sub.status);
    const readOnlyLike = (READ_ONLY_SUB_STATUSES as readonly string[]).includes(sub.status);
    if (activeLike) {
      return {
        plan,
        source:             "subscription",
        subscriptionId:     sub.id,
        currentPeriodEnd:   sub.currentPeriodEnd,
        cancelAtPeriodEnd:  sub.cancelAtPeriodEnd,
        readOnly:           false,
      };
    }
    if (readOnlyLike) {
      // Plan stays the same so dashboards still render, but caller
      // sees readOnly=true and gates writes/AI accordingly.
      return {
        plan,
        source:             "subscription",
        subscriptionId:     sub.id,
        currentPeriodEnd:   sub.currentPeriodEnd,
        cancelAtPeriodEnd:  sub.cancelAtPeriodEnd,
        readOnly:           true,
      };
    }
  }

  // 3. Default
  return { plan: "free", source: "default", readOnly: false };
}

export async function getPlanFor(businessId: string): Promise<PlanKey> {
  return (await getEffectivePlan(businessId)).plan;
}

// Feature gate. Returns true when the effective plan grants the
// feature AND the subscription isn't in read-only mode.
//
// Grandfather exception: `shareAnalyses` moved from Pro to Business
// when the Business tier launched. Pro subscriptions that existed
// at that moment are marked with Subscription.shareInsightsGrandfathered
// and retain access. The check is feature-specific - we only honor
// the flag for shareAnalyses, never for other features.
export async function hasFeature(
  businessId: string,
  feature: keyof PlanFeatures,
): Promise<boolean> {
  const eff = await getEffectivePlan(businessId);
  if (eff.readOnly) return false;
  const baseGranted = getPlanLimits(eff.plan).features[feature];
  if (baseGranted) return true;

  // Grandfather check is a single targeted lookup, only when the
  // feature is shareAnalyses AND the effective source is a Pro
  // subscription (not an admin override, not a default-free fallback).
  if (
    feature === "shareAnalyses"
    && eff.plan === "pro"
    && eff.source === "subscription"
    && eff.subscriptionId
  ) {
    const sub = await prisma.subscription.findUnique({
      where:  { id: eff.subscriptionId },
      select: { shareInsightsGrandfathered: true },
    });
    if (sub?.shareInsightsGrandfathered) return true;
  }
  return false;
}

// Quota lookup. Returns the static cap for the effective plan -
// "unlimited" is a valid return.
export async function getQuota<K extends Exclude<keyof PlanLimits, "features">>(
  businessId: string,
  dimension: K,
): Promise<PlanLimits[K]> {
  const eff = await getEffectivePlan(businessId);
  return getPlanLimits(eff.plan)[dimension];
}

// Convenience: list every plan so admin UIs can render a tier picker.
export function listPlans() { return PLANS }
