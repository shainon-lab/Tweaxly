// Plan definitions and feature limits.
// Single source of truth for what each tier (Free / Pro / Business)
// includes. Entitlements, credit grants, downgrade/read-only logic
// and the admin UI all read from here - so changing a limit is a
// one-line edit, not a sweep.

export type PlanKey = "free" | "pro";

export const PLAN_KEYS: readonly PlanKey[] = ["free", "pro"] as const;
export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && (PLAN_KEYS as readonly string[]).includes(v);
}

// Legacy normalisation. The previous architecture had a third tier
// ("business") that we collapsed into Pro - this helper maps any
// stored "business" string on legacy Subscription / AdminPlanOverride
// rows up to "pro" so the entitlements layer never sees a stale value.
// Anything else unknown falls back to "free".
export function normalizePlan(raw: unknown): PlanKey {
  if (raw === "business") return "pro";
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
      // Workspaces are unlimited on every plan - the unit of
      // subscription IS the workspace, so capping how many a user
      // can have makes no sense. Premium gating is per workspace.
      businesses:       "unlimited",
      members:          1,
      dataSources:      1,
      historyDays:      90,
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
    // Pro is now the single premium tier. It absorbs every feature
    // the previous Business plan had (team roles, audit logs, API
    // access, advanced integrations) - the only scaling dimension
    // above Pro is the AI Credit allowance, sold as packs from
    // /settings/billing.
    limits: {
      businesses:       "unlimited",
      // Pro = workspace owner + up to 2 additional members = 3 total
      // active+pending records per workspace. Pending invitations
      // count toward this cap so users can't pre-stage 50 invites to
      // dodge the limit (the cap-check counts both BusinessMembership
      // rows and pending BusinessInvitation rows). Future tier can
      // raise this number without touching the entitlements wiring.
      members:          3,
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  "unlimited",
      // Forecast horizon caps at 60 months on Pro - matches the
      // promise on /pricing ("Long-horizon forecasting (6, 12, 24,
      // 36, 60 months)"). Used to be "unlimited" but no UI surfaces
      // a horizon beyond 60 anyway, so we made the entitlement layer
      // and the pricing page agree.
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
        teamRoles:              true,
        advancedIntegrations:   true,
        // apiAccess + auditLogs are intentionally OFF on Pro - the
        // /pricing page doesn't list them, so the entitlements layer
        // shouldn't either. They're declared on the PlanFeatures shape
        // for forward compatibility (future tier or org plan) but no
        // tier surfaces them today.
        apiAccess:              false,
        webhooks:               true,
        priorityAI:             true,
        auditLogs:              false,
        dedicatedOnboarding:    true,
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
