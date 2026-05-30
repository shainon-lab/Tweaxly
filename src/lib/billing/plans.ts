// Plan definitions and feature limits.
// Single source of truth for what each tier (Free / Pro / Business)
// includes. Entitlements, credit grants, downgrade/read-only logic
// and the admin UI all read from here - so changing a limit is a
// one-line edit, not a sweep.

export type PlanKey = "free" | "pro" | "business";

export const PLAN_KEYS: readonly PlanKey[] = ["free", "pro", "business"] as const;
export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && (PLAN_KEYS as readonly string[]).includes(v);
}

// Plan-key normalisation. "business" is now a real tier - any legacy
// "business" rows that pre-dated this change were migrated to "pro"
// at flip-day (the production DB had zero such rows at the time),
// so the only remaining job is to defend against unknown strings by
// falling back to "free". Do NOT re-collapse "business" to "pro"
// here - new paid Business subs need to round-trip cleanly.
export function normalizePlan(raw: unknown): PlanKey {
  if (isPlanKey(raw)) return raw;
  return "free";
}

// `"unlimited"` is the explicit sentinel for "no cap" - callers should
// switch on it (e.g. `if (limit === "unlimited") return true`). Avoids
// the Number.POSITIVE_INFINITY footgun where it serialises as `null`
// in JSON.
export type Quota = number | "unlimited";

export interface PlanFeatures {
  // AI surfaces.
  smartAlerts:           boolean;
  advancedInsights:      boolean;
  contextualConsultation: boolean;
  // Forecasting.
  scenarioBuilder:       boolean;
  multiScenarioCompare:  boolean;
  // Workforce Planning surface (sub-tab under Forecast). Gated
  // alongside Scenarios since both are decision-support tools the
  // Free tier doesn't get.
  workforcePlanning:     boolean;
  // Reports.
  exportExcel:           boolean;
  exportCsv:             boolean;
  exportPdf:             boolean;
  whitelabelReports:     boolean;
  // Yearly insights / summaries. Free users see the page exists but
  // the data is hidden behind an upgrade overlay; Pro+ see it in full.
  yearlyReports:         boolean;
  // Workspace.
  multiBusiness:         boolean;
  multiUser:             boolean;
  teamRoles:             boolean;
  // Integrations.
  advancedIntegrations:  boolean;
  apiAccess:             boolean;
  webhooks:              boolean;
  // Ops.
  priorityAI:            boolean;
  auditLogs:             boolean;
  dedicatedOnboarding:   boolean;
  // Secure read-only share links for AI consultation answers,
  // signals, forecast explanations, and insights. The recipient
  // does not need a Tweaxly account. Phase 1 ships on Pro; the
  // flag is intentionally a separate entitlement so a future
  // higher tier can claim it without refactoring the wiring.
  shareAnalyses:         boolean;
}

export interface PlanLimits {
  // Quotas - any may be "unlimited".
  businesses:      Quota;
  members:         Quota;
  dataSources:     Quota;
  historyDays:     Quota;
  signalsPerMonth: Quota;
  forecastMonths:  Quota;
  // Threshold-alert rules (NotificationRule) the user can create at
  // once. Free is intentionally tight (1 rule) to encourage upgrade
  // for owners running multiple guardrails.
  maxNotificationRules: Quota;
  // Monthly AI credit allowance. Always finite; "unlimited" is granted
  // via AdminPlanOverride.kind = "unlimited_credits" rather than via a
  // sentinel in the plan itself. Free is 0 here - Free workspaces get
  // a one-time starter grant, not a recurring monthly allowance.
  monthlyAICredits: number;
  // One-time starter AI Credits granted on first wallet creation.
  // Used by Free to let new workspaces experience the AI; Pro is 0
  // since Pro receives a recurring monthlyAICredits allowance instead.
  // Never re-granted after the first wallet bootstrap.
  starterAICredits: number;
  features:        PlanFeatures;
}

export interface Plan {
  key:      PlanKey;
  label:    string;
  // Monthly list price in USD cents (0 for Free). Stored in cents so
  // promo/coupon math stays integer-precise.
  priceCents: number;
  limits:   PlanLimits;
}

// Order matters - callers use this for upgrade-path display.
export const PLANS: Plan[] = [
  {
    key:        "free",
    label:      "Free",
    priceCents: 0,
    limits: {
      // Free is capped at 1 workspace. Existing accounts with more
      // than one workspace at the time this cap was introduced are
      // grandfathered - the cap is enforced on the create path only
      // (src/app/api/businesses), so a Free user with 3 legacy
      // workspaces keeps all 3 but cannot make a 4th. Premium
      // gating is per workspace.
      businesses:       1,
      members:          1,
      // Free unbounds data sources + historical uploads per spec -
      // the onboarding "upload 90 days" line is guidance, not a
      // cap. Premium gating happens around AI features and
      // collaboration, not around raw ingestion.
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  3,
      forecastMonths:   3,
      maxNotificationRules: 1,
      // Free workspaces get starter credits ONCE on bootstrap; no
      // monthly refresh. The Free plan exists for onboarding + value
      // demonstration, not as a recurring-AI tier.
      monthlyAICredits: 0,
      starterAICredits: 30,
      features: {
        smartAlerts:            false,
        advancedInsights:       false,
        contextualConsultation: false,
        scenarioBuilder:        false,
        multiScenarioCompare:   false,
        workforcePlanning:      false,
        exportExcel:            false,
        exportCsv:              false,
        exportPdf:              false,
        whitelabelReports:      false,
        yearlyReports:          false,
        multiBusiness:          true,
        multiUser:              false,
        teamRoles:              false,
        advancedIntegrations:   false,
        apiAccess:              false,
        webhooks:               false,
        priorityAI:             false,
        auditLogs:              false,
        dedicatedOnboarding:    false,
        shareAnalyses:          false,
      },
    },
  },
  {
    key:        "pro",
    label:      "Pro",
    priceCents: 4900,
    limits: {
      // Pro caps at 3 workspaces. Existing customers with more
      // than 3 at the time this cap shipped are grandfathered -
      // the cap is enforced on the create path only, so legacy
      // accounts keep their workspaces but can't add new ones
      // beyond 3.
      businesses:       3,
      // Pro = workspace owner + up to 2 additional members = 3 total
      // active+pending records per workspace. Pending invitations
      // count toward this cap so users can't pre-stage invites to
      // dodge the limit. Member role on Pro is "viewer" only;
      // "admin" is Business-tier.
      members:          3,
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  "unlimited",
      // Forecast horizon caps at 60 months on Pro - matches the
      // promise on /pricing ("Long-horizon forecasting (6, 12, 24,
      // 36, 60 months)").
      forecastMonths:   60,
      maxNotificationRules: "unlimited",
      monthlyAICredits: 100,
      starterAICredits: 0,
      features: {
        smartAlerts:            true,
        advancedInsights:       true,
        contextualConsultation: true,
        scenarioBuilder:        true,
        multiScenarioCompare:   true,
        workforcePlanning:      true,
        exportExcel:            true,
        exportCsv:              true,
        exportPdf:              true,
        whitelabelReports:      true,
        yearlyReports:          true,
        multiBusiness:          true,
        multiUser:              true,
        // Role model on Pro is Owner + Viewer (no Admin tier).
        // teamRoles stays true because a two-role model is still
        // role-based access, just a smaller set than Business.
        teamRoles:              true,
        advancedIntegrations:   true,
        apiAccess:              false,
        webhooks:               true,
        priorityAI:             true,
        auditLogs:              false,
        dedicatedOnboarding:    true,
        // shareAnalyses moved from Pro to Business at flip-day.
        // Pro subscriptions that existed at flip-day are
        // grandfathered via Subscription.shareInsightsGrandfathered
        // - the entitlements layer (hasFeature) OR's the flag in
        // for shareAnalyses specifically.
        shareAnalyses:          false,
      },
    },
  },
  {
    // Internal key stays "business" - it's stored on existing
    // Subscription / AdminPlanOverride rows and is the value the
    // Polar metadata.planId carries. Renaming the key would force a
    // DB migration and is unnecessary - only the user-facing label
    // changed. See the comment on PlanKey in this file for the
    // legacy-key naming policy.
    key:        "business",
    label:      "Executive",
    // $89/month. Positioned as the collaboration / multi-workspace
    // / Share Insights tier - not "Pro with more credits". Pricing
    // page copy leads with team + sharing, not credit numbers.
    priceCents: 8900,
    limits: {
      businesses:       "unlimited",
      // Owner + 5 invitees = 6 total. Pending invitations count
      // toward the cap. Both Admin and Viewer roles are available
      // (Pro only has Viewer).
      members:          6,
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  "unlimited",
      forecastMonths:   60,
      maxNotificationRules: "unlimited",
      // Business gets 250 credits per cycle (vs 100 on Pro). On
      // mid-cycle upgrade from Pro we grant the +150 difference
      // immediately - see the upgrade-credit logic in Phase B3.
      monthlyAICredits: 250,
      starterAICredits: 0,
      features: {
        smartAlerts:            true,
        advancedInsights:       true,
        contextualConsultation: true,
        scenarioBuilder:        true,
        multiScenarioCompare:   true,
        workforcePlanning:      true,
        exportExcel:            true,
        exportCsv:              true,
        exportPdf:              true,
        whitelabelReports:      true,
        yearlyReports:          true,
        multiBusiness:          true,
        multiUser:              true,
        teamRoles:              true,
        advancedIntegrations:   true,
        apiAccess:              false,
        webhooks:               true,
        priorityAI:             true,
        auditLogs:              false,
        dedicatedOnboarding:    true,
        // Share Insights (shareAnalyses) is the headline Business
        // entitlement. Free + Pro see the upgrade card; Business
        // unlocks the full sharing modal across every AI surface.
        shareAnalyses:          true,
      },
    },
  },
];

const PLANS_BY_KEY: Record<PlanKey, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.key, p]),
) as Record<PlanKey, Plan>;

export function getPlan(key: PlanKey): Plan { return PLANS_BY_KEY[key] }
export function getPlanLimits(key: PlanKey): PlanLimits { return PLANS_BY_KEY[key].limits }

// AI credit costs per action. Mirrors the table on the /pricing page
// and the spec. Keep these in sync if either changes.
export const CREDIT_COSTS = {
  consultationMessage:  1,
  deepAnalysis:         3,
  forecastGeneration:   5,
  scenarioRun:          5,
} as const;
export type CreditAction = keyof typeof CREDIT_COSTS;
export function costFor(action: CreditAction): number { return CREDIT_COSTS[action] }

// Add-on credit packs available on every plan.
export const CREDIT_PACKS: { sku: string; credits: number; priceCents: number }[] = [
  { sku: "pack_30",  credits: 30,  priceCents:  900 },
  { sku: "pack_50",  credits: 50,  priceCents: 1400 },
  { sku: "pack_100", credits: 100, priceCents: 1900 },
];

// Custom pack: user picks any credit count >= CUSTOM_PACK_MIN_CREDITS
// and we price it via a sliding scale that mirrors the fixed packs.
// Polar enforces the minimum amount at the product level too; the
// server-side computation here is the authoritative source.
export const CUSTOM_PACK_SKU = "pack_custom" as const;
export const CUSTOM_PACK_MIN_CREDITS = 30;

// Sliding-scale rate per credit (in cents):
//   30-49   credits → 30¢ each   (matches pack_30: 30 × 30¢ = $9)
//   50-99   credits → 28¢ each   (matches pack_50: 50 × 28¢ = $14)
//   100+    credits → 19¢ each   (matches pack_100: 100 × 19¢ = $19)
export function calculateCustomPackPriceCents(credits: number): number {
  if (!Number.isFinite(credits) || credits < CUSTOM_PACK_MIN_CREDITS) {
    throw new Error(`Custom pack requires at least ${CUSTOM_PACK_MIN_CREDITS} credits`);
  }
  const intCredits = Math.floor(credits);
  const perCredit = intCredits >= 100 ? 19 : intCredits >= 50 ? 28 : 30;
  return intCredits * perCredit;
}

// Quota helpers - centralised so callers don't sprinkle the
// "unlimited" check everywhere.
export function isUnderQuota(used: number, quota: Quota): boolean {
  return quota === "unlimited" || used < quota;
}
export function quotaRemaining(used: number, quota: Quota): Quota {
  if (quota === "unlimited") return "unlimited";
  return Math.max(0, quota - used);
}
