// Customer health score (0-100). A composite signal of how
// engaged a workspace is with the product. Used by the admin
// dashboard, accounts table, and the customer 360.
//
// The score is intentionally simple — it sums weighted signals
// from already-tracked data. As new signals exist (billing
// payments, support tickets, etc.) plug them in here without
// changing any callers.

export type HealthSignals = {
  // engagement
  lastActivityAt: Date | null;
  lastLoginAt: Date | null;
  // data
  hasUploadedData: boolean;
  transactionCount: number;
  categorizationPct: number;     // 0..100
  // product usage
  consultationsCount: number;
  forecastAssumptionsCount: number;
  notificationRulesCount: number;
  // account
  ageDays: number;
  isSuspended: boolean;
  // future: failedPaymentsCount, openSupportTickets, etc.
};

export type HealthVerdict = {
  score: number;             // 0..100
  band: "good" | "watch" | "risk";
  trend?: "improving" | "stable" | "declining"; // not used yet (no history)
  reasons: string[];         // top 3 bullet points
};

function daysAgo(d: Date | null | undefined, now: number): number | null {
  if (!d) return null;
  return Math.floor((now - new Date(d).getTime()) / 86_400_000);
}

// Clamp helper.
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function computeHealthScore(s: HealthSignals, now = Date.now()): HealthVerdict {
  // Suspended accounts always show as risk regardless of usage.
  if (s.isSuspended) {
    return {
      score: 0,
      band: "risk",
      reasons: ["Account is suspended"],
    };
  }

  const reasons: string[] = [];

  // 1. Recent activity (30 points). Linear decay over 21 days.
  const daysSinceActivity = daysAgo(s.lastActivityAt, now) ?? 999;
  const activityScore = 30 * clamp01(1 - daysSinceActivity / 21);
  if (daysSinceActivity > 14) reasons.push(`Inactive for ${daysSinceActivity} days`);

  // 2. Has uploaded data + categorization (25 points).
  let dataScore = 0;
  if (s.hasUploadedData) {
    // 10 for having any data; up to 15 more from categorization %.
    dataScore = 10 + (s.categorizationPct / 100) * 15;
    if (s.categorizationPct < 50) reasons.push(`Only ${s.categorizationPct}% of transactions categorized`);
  } else {
    reasons.push("No data uploaded yet");
  }

  // 3. AI engagement — consultations (15 points). Caps at 5 consultations.
  const consultScore = 15 * clamp01(s.consultationsCount / 5);
  if (s.consultationsCount === 0 && s.ageDays > 7) {
    reasons.push("No AI consultations started");
  }

  // 4. Forward-looking usage — forecast assumptions + alert rules (15 points).
  let forwardScore = 0;
  if (s.forecastAssumptionsCount > 0) forwardScore += 7.5;
  if (s.notificationRulesCount > 0)   forwardScore += 7.5;
  if (forwardScore === 0 && s.ageDays > 14) {
    reasons.push("No forecast scenarios or alerts configured");
  }

  // 5. Login recency (10 points). Linear decay over 14 days.
  const daysSinceLogin = daysAgo(s.lastLoginAt, now) ?? 999;
  const loginScore = 10 * clamp01(1 - daysSinceLogin / 14);
  if (daysSinceLogin > 10) reasons.push(`No login in ${daysSinceLogin} days`);

  // 6. New-account grace (5 points). First 14 days get the full 5 so brand
  // new accounts don't show red on day one.
  const graceScore = s.ageDays < 14 ? 5 : 0;

  const raw = activityScore + dataScore + consultScore + forwardScore + loginScore + graceScore;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const band: HealthVerdict["band"] =
    score >= 70 ? "good" :
    score >= 40 ? "watch" :
                  "risk";

  // If everything is fine, show a positive bullet.
  if (reasons.length === 0 && score >= 70) {
    reasons.push("Engaged across data, AI, and forecasting");
  }

  return { score, band, reasons: reasons.slice(0, 3) };
}

export const HEALTH_BAND_COLOR: Record<HealthVerdict["band"], string> = {
  good:  "text-good",
  watch: "text-warn",
  risk:  "text-bad",
};

export const HEALTH_BAND_LABEL: Record<HealthVerdict["band"], string> = {
  good:  "Healthy",
  watch: "Watch",
  risk:  "At risk",
};
