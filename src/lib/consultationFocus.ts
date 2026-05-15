// Consultation focus engine — derives the daily AI focus, the single
// "Recommended Consultation" hero card, and a curated set of
// "Suggested Strategic Consultations" from the same data the dashboard
// and Business Signals already analyze.
//
// The goal is to make the Consultation screen feel like a continuation
// of the business analysis already happening elsewhere — not a static
// prompt library. Every selection here is derived from the current
// BusinessContext: revenue/expense moves, margin pressure, vendor
// concentration, payroll burden, forecast risk, and active signals.

import type { AdvisorRecommendation, BusinessContext } from "./advisor";
import { fmtMoney, fmtPct, ymToLabel } from "./format";

// Today's AI focus — one or two short themes summarizing what matters
// most in the business right now. Rendered as a calm banner above the
// rest of the consultation surface.
export type TodaysFocus = {
  themes: string[]; // 1–2 short labels, e.g. "Revenue slowdown", "Margin pressure"
};

// A strategic situation surfaced as a card. Title is a business theme
// (e.g. "Hiring Expansion"), question is the interpretive prompt
// pre-filled into the consultation textarea when the user picks it.
export type StrategicSituation = {
  id: string;
  title: string;       // "Hiring Expansion" — the business theme
  question: string;    // the actual prompt sent to the advisor
  blurb: string;       // short context shown under the title
  tone: "good" | "warn" | "bad" | "neutral";
};

// The single AI-prioritized Recommended Consultation — the hero.
export type RecommendedConsultation = {
  title: string;          // e.g. "Analyze Revenue Decline"
  observation: string;    // what happened (1 sentence)
  interpretation: string; // why it matters (1–2 sentences)
  question: string;       // the prompt sent to the advisor on click
  cta: string;            // CTA label, e.g. "Analyze Revenue Decline"
  tone: "warn" | "bad" | "info" | "good";
  signalKey?: string;     // optional link back to the originating signal
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function pickTodaysFocus(
  ctx: BusinessContext,
  signals: AdvisorRecommendation[],
): TodaysFocus {
  const themes = new Set<string>();

  // 1) Pull from the highest-severity signals first — those are the
  //    most immediate things the user should pay attention to.
  const ranked = [...signals].sort(
    (a, b) => severityScore(b.level) - severityScore(a.level) || b.impact - a.impact,
  );
  for (const s of ranked) {
    const theme = themeForSignal(s);
    if (theme) themes.add(theme);
    if (themes.size >= 2) break;
  }

  // 2) If we didn't get two themes from signals, derive from the raw
  //    snapshot — revenue/expense/margin movements that are big enough
  //    to be worth surfacing.
  if (themes.size < 2) {
    const revDelta = pctDelta(ctx.current.income, ctx.prev.income);
    const expDelta = pctDelta(ctx.current.expenses, ctx.prev.expenses);
    const curMargin = ctx.current.income > 0
      ? (ctx.current.income - ctx.current.expenses) / ctx.current.income
      : null;
    if (revDelta != null && revDelta <= -0.05) themes.add("Revenue slowdown");
    if (expDelta != null && expDelta >= 0.10) themes.add("Expense pressure");
    if (curMargin != null && curMargin < 0)   themes.add("Profitability under pressure");
    if (curMargin != null && curMargin >= 0.20 && revDelta != null && revDelta < 0)
      themes.add("Margin resilience");
    if (ctx.forecast[0] && ctx.forecast[0].expectedNet < 0) themes.add("Cash flow risk");
  }

  // 3) Fallback — stable period.
  if (themes.size === 0) {
    themes.add("Steady operations");
  }

  return { themes: Array.from(themes).slice(0, 2) };
}

export function pickRecommendedConsultation(
  ctx: BusinessContext,
  signals: AdvisorRecommendation[],
): RecommendedConsultation | null {
  // Prefer the most severe active signal — that's the AI's
  // highest-priority recommendation by definition. Fall back to
  // raw-context derived themes if there are no signals.
  const ranked = [...signals].sort(
    (a, b) => severityScore(b.level) - severityScore(a.level) || b.impact - a.impact,
  );
  const top = ranked.find((s) => s.level === "bad" || s.level === "warn");
  if (top) return recommendedFromSignal(top, ctx);

  // No urgent signals — surface a strategic-but-not-urgent recommendation
  // derived from the raw context (e.g. growth headroom, payroll efficiency).
  const fallback = recommendedFromContext(ctx, signals);
  return fallback;
}

export function pickSuggestedConsultations(
  ctx: BusinessContext,
  signals: AdvisorRecommendation[],
  recommendedSignalKey?: string,
): StrategicSituation[] {
  const out: StrategicSituation[] = [];
  const seen = new Set<string>();

  // 1) Mine the signal pool for thematic situations — pick the next 3
  //    most material signals after the recommended one.
  const ranked = [...signals]
    .filter((s) => !recommendedSignalKey || s.signalKey !== recommendedSignalKey)
    .sort((a, b) => severityScore(b.level) - severityScore(a.level) || b.impact - a.impact);
  for (const s of ranked) {
    const sit = situationForSignal(s, ctx);
    if (!sit) continue;
    if (seen.has(sit.title)) continue;
    seen.add(sit.title);
    out.push(sit);
    if (out.length >= 4) break;
  }

  // 2) Always include at least a few evergreen strategic themes if we
  //    have spare slots. These are the most useful advisor entry
  //    points when nothing else is screaming.
  for (const evergreen of evergreenSituations(ctx)) {
    if (out.length >= 4) break;
    if (seen.has(evergreen.title)) continue;
    seen.add(evergreen.title);
    out.push(evergreen);
  }

  return out.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function severityScore(level: string): number {
  if (level === "bad") return 100;
  if (level === "warn") return 75;
  if (level === "info") return 40;
  if (level === "good") return 30;
  return 0;
}

function pctDelta(curr: number, prior: number): number | null {
  if (prior <= 0) return null;
  return (curr - prior) / prior;
}

// Map a signal's signalKey to a short theme suitable for the focus
// banner. We strip per-target suffixes (e.g. "vendor_spike:Acme" →
// "vendor_spike") and translate to human-readable themes.
function themeForSignal(s: AdvisorRecommendation): string | null {
  const key = s.signalKey.split(":")[0];
  switch (key) {
    case "forecast_negative_next_month": return "Cash flow risk";
    case "expense_mom_jump":              return "Expense pressure";
    case "marketing_intensity_high":      return "Marketing efficiency";
    case "vendor_spike":                  return "Vendor cost spikes";
    case "vendor_concentration":          return "Vendor concentration";
    case "payroll_heavy":                 return "Payroll efficiency";
    case "revenue_mom_swing":             return s.level === "good" ? "Revenue momentum" : "Revenue slowdown";
    case "net_margin_observation":        return s.level === "warn" ? "Margin pressure" : null;
    case "growth_headroom":               return "Growth opportunity";
    case "uncategorized_high":            return "Data hygiene";
    case "marketing_cut_held":            return "Cost discipline";
    case "trailing_3_net":                return s.level === "warn" ? "Sustained pressure" : null;
    case "ytd_snapshot":                  return s.level === "warn" ? "YTD shortfall" : null;
    default: return null;
  }
}

// Build the Recommended Consultation card from a specific signal. Uses
// the signal's existing observation/interpretation since those are
// already executive-toned, and crafts a CTA + question that matches.
function recommendedFromSignal(
  s: AdvisorRecommendation,
  ctx: BusinessContext,
): RecommendedConsultation {
  const ctaForSignal = (): string => {
    const key = s.signalKey.split(":")[0];
    const target = s.signalKey.includes(":") ? s.signalKey.split(":")[1] : null;
    switch (key) {
      case "vendor_spike":                 return `Investigate ${target ?? "Vendor"} Cost Spike`;
      case "vendor_concentration":         return `Reduce ${target ?? "Vendor"} Concentration`;
      case "forecast_negative_next_month": return "Address Cash Flow Risk";
      case "expense_mom_jump":             return "Investigate Expense Jump";
      case "marketing_intensity_high":     return "Optimize Marketing Spend";
      case "payroll_heavy":                return "Analyze Payroll Efficiency";
      case "revenue_mom_swing":            return s.level === "good" ? "Explore Revenue Momentum" : "Analyze Revenue Decline";
      case "net_margin_observation":       return "Address Margin Pressure";
      case "top_expense_category":         return `Review ${target ?? "Top Category"} Spend`;
      default:                              return "Analyze This Signal";
    }
  };
  const tone: RecommendedConsultation["tone"] =
    s.level === "bad" ? "bad" :
    s.level === "warn" ? "warn" :
    s.level === "good" ? "good" :
    "info";
  const question = `${s.observation} ${s.interpretation} The recommended action was: ${s.recommendation} Walk me through the diagnosis — is that read correct, and what should I actually do next, in order of priority? Use my recent data (latest month is ${ymToLabel(ctx.ym)}) and be specific.`;
  return {
    title: ctaForSignal(),
    observation: s.observation,
    interpretation: s.interpretation,
    question,
    cta: ctaForSignal(),
    tone,
    signalKey: s.signalKey,
  };
}

// Fallback recommendation when there are no urgent signals — surface a
// strategic-but-quiet consultation derived from the raw context.
function recommendedFromContext(
  ctx: BusinessContext,
  signals: AdvisorRecommendation[],
): RecommendedConsultation | null {
  const ccy = ctx.ccy;
  const m = ctx.current;
  const curMargin = m.income > 0 ? (m.income - m.expenses) / m.income : null;

  // Healthy with growth headroom — most useful executive prompt.
  if (curMargin != null && curMargin >= 0.20 && ctx.marketingRatio < 0.10 && ctx.avgRevenue > 0) {
    return {
      title: "Explore Growth Opportunity",
      observation: `Margins held at ${fmtPct(curMargin)} while marketing spend is only ${fmtPct(ctx.marketingRatio)} of revenue.`,
      interpretation: `You have unused growth headroom — the business is generating profit faster than it's reinvesting in acquisition, which tends to plateau revenue over the medium term.`,
      question: `My current margin is ${fmtPct(curMargin)} and marketing is only ${fmtPct(ctx.marketingRatio)} of revenue. Walk me through a measured approach to deploying ${fmtMoney(ctx.avgRevenue * 0.05, ccy)}/mo of additional acquisition spend — what should I measure, what level of CAC degradation is acceptable, and how would you stage the test? Use my actual numbers.`,
      cta: "Explore Growth Opportunity",
      tone: "good",
    };
  }

  // Use the first available info-level signal as a soft recommendation
  // if nothing else qualifies.
  const softest = [...signals].sort((a, b) => b.impact - a.impact).find((s) => s.level === "info");
  if (softest) return recommendedFromSignal(softest, ctx);

  // Final fallback — a generic strategic prompt.
  return {
    title: "Set Strategic Priorities",
    observation: `${ymToLabel(ctx.ym)} is operating in a stable band — nothing is flagging as urgent.`,
    interpretation: `Stable periods are the most useful time to make a deliberate strategic bet. The window where the cost of being wrong is lowest is exactly when most owners coast.`,
    question: `My business is currently operating in a stable band — nothing urgent is flagging. Given my recent numbers, what would be the single highest-leverage strategic bet to consider this quarter — growth investment, cost optimization, hiring, or runway extension? Be specific about which numbers in my data drive your recommendation.`,
    cta: "Set Strategic Priorities",
    tone: "info",
  };
}

// Turn an advisor signal into a Suggested Strategic Consultation. Same
// tone as the Recommended hero but card-sized rather than hero-sized.
function situationForSignal(
  s: AdvisorRecommendation,
  ctx: BusinessContext,
): StrategicSituation | null {
  const tone: StrategicSituation["tone"] =
    s.level === "bad" ? "bad" :
    s.level === "warn" ? "warn" :
    s.level === "good" ? "good" :
    "neutral";
  const key = s.signalKey.split(":")[0];
  const target = s.signalKey.includes(":") ? s.signalKey.split(":")[1] : null;
  const titleMap: Record<string, string> = {
    vendor_spike:                 `${target ?? "Vendor"} Cost Spike`,
    vendor_concentration:         "Vendor Concentration",
    forecast_negative_next_month: "Cash Flow Risk",
    expense_mom_jump:             "Expense Pressure",
    marketing_intensity_high:     "Marketing Efficiency",
    payroll_heavy:                "Payroll Efficiency",
    revenue_mom_swing:            s.level === "good" ? "Revenue Momentum" : "Revenue Decline",
    net_margin_observation:       "Margin Health",
    growth_headroom:              "Growth Headroom",
    uncategorized_high:           "Data Hygiene",
    top_expense_category:         `${target ?? "Top Category"} Spend`,
    expense_concentration:        "Spend Concentration",
  };
  const title = titleMap[key];
  if (!title) return null;
  return {
    id: s.signalKey,
    title,
    blurb: s.observation,
    question: `${s.observation} ${s.interpretation} The advisor's recommended action was: ${s.recommendation} Walk me through this in depth — is the diagnosis correct, what would you actually do first, and what should I be tracking after I act? Use my recent data (latest month: ${ymToLabel(ctx.ym)}).`,
    tone,
  };
}

// Always-on strategic themes — used to fill remaining slots so the
// section never feels empty. Each maps to a high-leverage CFO
// conversation that's worth having even when nothing urgent is firing.
function evergreenSituations(ctx: BusinessContext): StrategicSituation[] {
  const out: StrategicSituation[] = [];

  // Hiring expansion — most common executive question.
  if (ctx.employees.length > 0) {
    out.push({
      id: "evergreen_hiring",
      title: "Hiring Expansion",
      blurb: "Can current margins support additional headcount?",
      question: `I have ${ctx.employees.length} employees today and a fully-loaded payroll cost of ${fmtMoney(ctx.employeeCostMonthly, ctx.ccy)}/mo. Walk me through whether my current revenue and margin trajectory could absorb one additional hire, and which role would have the highest leverage. Use my numbers and be specific about the break-even threshold.`,
      tone: "neutral",
    });
  } else {
    out.push({
      id: "evergreen_first_hire",
      title: "First Hire Readiness",
      blurb: "When would the business be ready to bring on its first employee?",
      question: `I have no employees today. Walk me through the revenue and margin thresholds I'd need to clear before considering my first hire, and what role would unlock the most growth. Use my actual numbers.`,
      tone: "neutral",
    });
  }

  // Expense pressure — always useful.
  out.push({
    id: "evergreen_expense_pressure",
    title: "Expense Pressure",
    blurb: "Identify the categories creating the highest operational drag.",
    question: `Walk me through my current expense base. Identify the 2–3 categories with the highest operational drag relative to revenue, the largest variance vs prior periods, or the most realistic optimization potential. Be specific — name the categories and the dollar amounts.`,
    tone: "neutral",
  });

  // Strategic priorities — broadest, always relevant.
  out.push({
    id: "evergreen_priorities",
    title: "Strategic Priorities",
    blurb: "What operational areas currently deserve immediate attention?",
    question: `Based on my recent business activity, what are the 3 most important operational priorities I should be focused on this quarter? Rank them by leverage and explain which specific numbers in my data drive each one.`,
    tone: "neutral",
  });

  // Cash flow durability — universal CFO question.
  out.push({
    id: "evergreen_cashflow",
    title: "Cash Flow Durability",
    blurb: "How resilient is the business to a soft month?",
    question: `Walk me through how durable my current cash flow position is. If revenue dropped 20% next month, how would the numbers look? What would I need to cut, and which fixed commitments would force my hand first?`,
    tone: "neutral",
  });

  return out;
}
