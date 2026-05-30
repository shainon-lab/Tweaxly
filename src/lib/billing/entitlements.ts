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

// ─────────────────────────────────────────────────────────────────────
// Workspace cap (per-user)
// ─────────────────────────────────────────────────────────────────────

// Workspace count is a per-user cap derived from the highest-tier
// plan among the workspaces the user OWNS. The new spec:
//   Free      → 1 workspace
//   Pro       → 3 workspaces
//   Business  → unlimited
// is enforced on the create path only - existing accounts with more
// than the new cap are grandfathered (we never silently kick anyone
// out of a workspace they already own).
//
// "Highest tier" = business > pro > free. A user with one Business
// workspace and one Free workspace gets the Business cap (unlimited).
// A user with only Free workspaces stays on the Free cap until they
// upgrade one of them.

const PLAN_RANK: Record<PlanKey, number> = {
  free:     0,
  pro:      1,
  business: 2,
};

export async function getHighestOwnedPlan(userId: string): Promise<PlanKey> {
  const owned = await prisma.business.findMany({
    where:  { ownerId: userId },
    select: { id: true },
  });
  if (owned.length === 0) return "free";
  let best: PlanKey = "free";
  for (const b of owned) {
    const eff = await getEffectivePlan(b.id);
    if (PLAN_RANK[eff.plan] > PLAN_RANK[best]) best = eff.plan;
  }
  return best;
}

export async function getWorkspaceCapStatus(userId: string): Promise<{
  plan:      PlanKey;
  cap:       number | "unlimited";
  owned:     number;
  canCreate: boolean;
}> {
  const [plan, ownedCount] = await Promise.all([
    getHighestOwnedPlan(userId),
    prisma.business.count({ where: { ownerId: userId } }),
  ]);
  const cap = getPlanLimits(plan).businesses;
  const canCreate = cap === "unlimited" || ownedCount < cap;
  return { plan, cap, owned: ownedCount, canCreate };
}
