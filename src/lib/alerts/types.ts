// Real-Time Business Alerts - shared types + vocabulary used by the
// preferences UI, the dispatcher (Phase 4), and the Notification
// Center (Phase 2).

export type AlertSeverity = "critical" | "important" | "info";

// User-facing alert categories. Each maps to a toggle in the
// Notification Settings page. New categories can be added without
// a migration since AlertPreference.categories is a Json bag.
export const ALERT_CATEGORIES = [
  { value: "critical_signals", label: "Critical business signals",
    helper: "Cash flow risk, severe revenue drops, forecasted negative balance." },
  { value: "revenue",          label: "Revenue alerts",
    helper: "Drops, swings, and trend reversals on top-line." },
  { value: "expense",          label: "Expense alerts",
    helper: "Cost spikes, category overruns, runaway spend." },
  { value: "cashflow",         label: "Cash flow alerts",
    helper: "Burn-rate changes, runway risk, projected dips." },
  { value: "forecast",         label: "Forecast alerts",
    helper: "Material changes to the forecast outlook." },
  { value: "vendor_anomaly",   label: "Vendor anomaly alerts",
    helper: "Unusual jumps from a single vendor." },
  { value: "ai_recommendation", label: "AI recommendations",
    helper: "Suggested actions the advisor surfaces." },
  { value: "custom_monitor",   label: "Custom monitor alerts",
    helper: "Rules you defined in Business Monitors." },
  { value: "weekly_summary",   label: "Weekly AI business summary",
    helper: "A Monday roll-up of the week ahead." },
  { value: "data_coverage",    label: "Missing data alerts",
    helper: "When a financial source (bank, card, PayPal) is missing the previous month's import." },
] as const;

export type AlertCategory = (typeof ALERT_CATEGORIES)[number]["value"];

export type AlertSensitivity = "conservative" | "balanced" | "aggressive";

export const SENSITIVITY_OPTIONS = [
  { value: "conservative", label: "Conservative",
    helper: "Fewer alerts. Only high-confidence, high-impact signals." },
  { value: "balanced",     label: "Balanced",
    helper: "Recommended. Catches most material changes without noise." },
  { value: "aggressive",   label: "Aggressive",
    helper: "More proactive. Surfaces smaller patterns and early signals." },
] as const;

// Default category map used when an AlertPreference row doesn't have
// one yet. Everything on by default except weekly_summary (opt-in).
export function defaultCategoryMap(): Record<AlertCategory, boolean> {
  const out: Record<string, boolean> = {};
  for (const c of ALERT_CATEGORIES) {
    out[c.value] = c.value !== "weekly_summary";
  }
  return out as Record<AlertCategory, boolean>;
}
