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
  // Reports.
  exportExcel:           boolean;
  exportCsv:             boolean;
  exportPdf:             boolean;
  whitelabelReports:     boolean;
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
}

export interface PlanLimits {
  // Quotas - any may be "unlimited".
  businesses:      Quota;
  members:         Quota;
  dataSources:     Quota;
  historyDays:     Quota;
  signalsPerMonth: Quota;
  forecastMonths:  Quota;
  // Monthly AI credit allowance. Always finite; "unlimited" is granted
  // via AdminPlanOverride.kind = "unlimited_credits" rather than via a
  // sentinel in the plan itself.
  monthlyAICredits: number;
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
      businesses:       1,
      members:          1,
      dataSources:      1,
      historyDays:      90,
      signalsPerMonth:  5,
      forecastMonths:   3,
      monthlyAICredits: 30,
      features: {
        smartAlerts:            false,
        advancedInsights:       false,
        contextualConsultation: false,
        scenarioBuilder:        false,
        multiScenarioCompare:   false,
        exportExcel:            false,
        exportCsv:              false,
        exportPdf:              false,
        whitelabelReports:      false,
        multiBusiness:          false,
        multiUser:              false,
        teamRoles:              false,
        advancedIntegrations:   false,
        apiAccess:              false,
        webhooks:               false,
        priorityAI:             false,
        auditLogs:              false,
        dedicatedOnboarding:    false,
      },
    },
  },
  {
    key:        "pro",
    label:      "Pro",
    priceCents: 4900,
    limits: {
      businesses:       "unlimited",
      members:          "unlimited",
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  "unlimited",
      forecastMonths:   "unlimited",
      monthlyAICredits: 500,
      features: {
        smartAlerts:            true,
        advancedInsights:       true,
        contextualConsultation: true,
        scenarioBuilder:        true,
        multiScenarioCompare:   true,
        exportExcel:            true,
        exportCsv:              true,
        exportPdf:              true,
        whitelabelReports:      false,
        multiBusiness:          true,
        multiUser:              true,
        teamRoles:              false,
        advancedIntegrations:   false,
        apiAccess:              false,
        webhooks:               false,
        priorityAI:             false,
        auditLogs:              false,
        dedicatedOnboarding:    false,
      },
    },
  },
  {
    key:        "business",
    label:      "Business",
    priceCents: 14900,
    limits: {
      businesses:       "unlimited",
      members:          "unlimited",
      dataSources:      "unlimited",
      historyDays:      "unlimited",
      signalsPerMonth:  "unlimited",
      forecastMonths:   "unlimited",
      monthlyAICredits: 2000,
      features: {
        smartAlerts:            true,
        advancedInsights:       true,
        contextualConsultation: true,
        scenarioBuilder:        true,
        multiScenarioCompare:   true,
        exportExcel:            true,
        exportCsv:              true,
        exportPdf:              true,
        whitelabelReports:      true,
        multiBusiness:          true,
        multiUser:              true,
        teamRoles:              true,
        advancedIntegrations:   true,
        apiAccess:              true,
        webhooks:               true,
        priorityAI:             true,
        auditLogs:              true,
        dedicatedOnboarding:    true,
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
  { sku: "pack_100", credits: 100, priceCents: 1900 },
  { sku: "pack_500", credits: 500, priceCents: 7900 },
];

// Quota helpers - centralised so callers don't sprinkle the
// "unlimited" check everywhere.
export function isUnderQuota(used: number, quota: Quota): boolean {
  return quota === "unlimited" || used < quota;
}
export function quotaRemaining(used: number, quota: Quota): Quota {
  if (quota === "unlimited") return "unlimited";
  return Math.max(0, quota - used);
}
