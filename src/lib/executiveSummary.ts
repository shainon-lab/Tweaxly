// AI-generated executive summary for the dashboard hero. Produces a
// short narrative paragraph plus a row of supporting "chips" that
// surface the key signals at a glance.
//
// Two paths:
//   1. Claude path — if ANTHROPIC_API_KEY is set, prompt the model with
//      a structured snapshot of the period and a tight set of
//      instructions about tone, structure, and soft-confidence language.
//   2. Deterministic fallback — assemble the narrative from the same
//      snapshot using templated phrasing. Used when no API key is
//      configured or the API call errors.

import Anthropic from "@anthropic-ai/sdk";
import type { PeriodAggregate } from "./period";
import { fmtMoney, fmtPct, ymToLabel } from "./format";

export type SummaryTimeframe = "monthly" | "quarterly" | "yearly" | "custom";

export type SummaryChip = {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
};

export type ExecutiveSummary = {
  narrative: string;
  chips: SummaryChip[];
  source: "claude" | "deterministic";
  periodLabel: string;
};

export type SummaryInput = {
  ccy: string;
  businessName: string;
  rangeLabel: string;
  periodLabel: string;
  timeframe: SummaryTimeframe;
  current: PeriodAggregate;
  prev: PeriodAggregate;
  employeeCostMonthly: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function buildExecutiveSummary(
  input: SummaryInput,
): Promise<ExecutiveSummary> {
  const chips = buildChips(input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeEnabled =
    !!apiKey && apiKey.length > 20 && !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  if (claudeEnabled) {
    try {
      const narrative = await buildNarrativeWithClaude(input, apiKey!);
      if (narrative) {
        return {
          narrative,
          chips,
          source: "claude",
          periodLabel: input.periodLabel,
        };
      }
    } catch {
      // Fall through to deterministic. We don't surface the error to
      // the user — the deterministic version reads fine on its own.
    }
  }

  return {
    narrative: buildDeterministicNarrative(input),
    chips,
    source: "deterministic",
    periodLabel: input.periodLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude path
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTIONS = `You are an executive business advisor writing a short summary for a small-business owner.

Tone:
- Calm, intelligent, executive-level.
- Data-aware and trustworthy.
- Never robotic. Never dramatic. Never use AI buzzwords.

Confidence calibration — this is critical:
- Never assert the future as certain.
- Use phrasings like "current trends indicate", "based on recent activity", "the data suggests", "appears to be stabilizing".
- Avoid: "Revenue WILL decline", "The business IS failing", or any other certainty about what comes next.

Length: one paragraph, 3–5 sentences. No headings, no bullets, no markdown — just flowing prose.

Structure the paragraph as four moves:
  1. Opening state — how the business started the period.
  2. Major change — the most important operational or financial shift.
  3. Business impact — what happened as a result and how the business adapted.
  4. Forward-looking insight — a cautious read on where things are heading.

Adapt emphasis to the timeframe:
- monthly  → anomalies, short-term shifts, operational changes.
- quarterly → trend evolution, momentum, category-level moves.
- yearly   → strategic evolution, profitability trends, forecast direction.
- custom   → treat as a free range and lean on the biggest movements.

Do not invent numbers. Use the figures provided. If a metric isn't present in the snapshot, don't fabricate one.`;

async function buildNarrativeWithClaude(
  input: SummaryInput,
  apiKey: string,
): Promise<string | null> {
  const client = new Anthropic({ apiKey });
  const snapshot = buildSnapshotForPrompt(input);
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 600,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: [
      { type: "text", text: SYSTEM_INSTRUCTIONS },
    ],
    messages: [
      {
        role: "user",
        content: `Write the executive summary paragraph for this period.\n\nBusiness: ${input.businessName}\nTimeframe: ${input.timeframe}\nPeriod label: ${input.periodLabel}\n\nSnapshot:\n\`\`\`json\n${snapshot}\n\`\`\``,
      },
    ],
  });

  let text = "";
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
  }
  const cleaned = text.trim().replace(/^["“”]|["“”]$/g, "").trim();
  return cleaned || null;
}

function buildSnapshotForPrompt(input: SummaryInput): string {
  const m = input.current;
  const p = input.prev;
  return JSON.stringify({
    currency: input.ccy,
    period: { label: input.periodLabel, from: m.fromYM, to: m.toYM, monthCount: m.monthCount },
    prior: { from: p.fromYM, to: p.toYM, monthCount: p.monthCount },
    metrics: {
      revenue:        { current: round0(m.income),    prior: round0(p.income) },
      expenses:       { current: round0(m.expenses),  prior: round0(p.expenses) },
      netProfit:      { current: round0(m.netProfit), prior: round0(p.netProfit) },
      payroll:        { current: round0(m.payroll),   prior: round0(p.payroll) },
      marketing:      { current: round0(m.marketing), prior: round0(p.marketing) },
      oneTime:        { current: round0(m.oneTime),   prior: round0(p.oneTime) },
      grossMargin: {
        current: m.income > 0 ? round2((m.income - m.expenses) / m.income) : null,
        prior:   p.income > 0 ? round2((p.income - p.expenses) / p.income) : null,
      },
    },
    employeeCostMonthly: round0(input.employeeCostMonthly),
  }, null, 2);
}

function round0(n: number): number { return Math.round(n); }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic narrative
// ─────────────────────────────────────────────────────────────────────────────

function buildDeterministicNarrative(input: SummaryInput): string {
  const { ccy, current, prev, timeframe, periodLabel } = input;
  const revDelta = pctDelta(current.income, prev.income);
  const expDelta = pctDelta(current.expenses, prev.expenses);
  const curMargin = current.income > 0 ? (current.income - current.expenses) / current.income : null;
  const prevMargin = prev.income > 0 ? (prev.income - prev.expenses) / prev.income : null;
  const marginShift = curMargin != null && prevMargin != null ? curMargin - prevMargin : null;

  // 1. Opening
  const opening = openingSentence(timeframe, periodLabel, current, ccy);
  // 2. Major change
  const change = changeSentence(revDelta, expDelta, current, prev, ccy);
  // 3. Impact
  const impact = impactSentence(curMargin, marginShift, current);
  // 4. Forward
  const forward = forwardSentence(revDelta, expDelta, current, prev);

  return [opening, change, impact, forward].filter(Boolean).join(" ");
}

function pctDelta(curr: number, prior: number): number | null {
  if (prior <= 0) return null;
  return (curr - prior) / prior;
}

function openingSentence(
  tf: SummaryTimeframe,
  label: string,
  cur: PeriodAggregate,
  ccy: string,
): string {
  const revText = cur.income > 0
    ? `${fmtMoney(cur.income, ccy)} in revenue`
    : `no booked revenue`;
  if (tf === "monthly") {
    return `${label} opened with ${revText} and ${fmtMoney(cur.expenses, ccy)} in operating costs.`;
  }
  if (tf === "quarterly") {
    return `Across ${label}, the business posted ${revText} against ${fmtMoney(cur.expenses, ccy)} in operating costs.`;
  }
  if (tf === "yearly") {
    return `The year-to-date view for ${label} shows ${revText} alongside ${fmtMoney(cur.expenses, ccy)} in operating costs.`;
  }
  return `Over ${label}, the business booked ${revText} against ${fmtMoney(cur.expenses, ccy)} in operating costs.`;
}

function changeSentence(
  revDelta: number | null,
  expDelta: number | null,
  cur: PeriodAggregate,
  prev: PeriodAggregate,
  ccy: string,
): string {
  // Pick the most material movement: largest absolute pct change among
  // revenue and expenses. If neither is material, surface payroll or
  // marketing if those shifted.
  const moves: { kind: string; pct: number; absDelta: number }[] = [];
  if (revDelta != null) moves.push({ kind: "revenue", pct: revDelta, absDelta: cur.income - prev.income });
  if (expDelta != null) moves.push({ kind: "expenses", pct: expDelta, absDelta: cur.expenses - prev.expenses });
  moves.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const top = moves[0];
  if (!top || Math.abs(top.pct) < 0.03) {
    // Nothing moved much.
    return `Revenue and expenses tracked close to the prior period, with no single category dominating the change.`;
  }
  if (top.kind === "revenue") {
    if (top.pct > 0) {
      return `The most notable shift was revenue accelerating by ${fmtPct(top.pct)} — ${fmtMoney(Math.abs(top.absDelta), ccy)} above the prior period — likely concentrated in a specific channel or contract.`;
    }
    return `The most notable shift was revenue softening by ${fmtPct(Math.abs(top.pct))} — ${fmtMoney(Math.abs(top.absDelta), ccy)} below the prior period — worth tracing to a specific channel or customer.`;
  }
  // Expenses
  if (top.pct > 0) {
    return `The most material shift was expenses rising by ${fmtPct(top.pct)} — ${fmtMoney(Math.abs(top.absDelta), ccy)} above the prior period — concentrated in a handful of categories worth reviewing.`;
  }
  return `The most material shift was expenses easing by ${fmtPct(Math.abs(top.pct))} — ${fmtMoney(Math.abs(top.absDelta), ccy)} below the prior period — suggesting earlier cost actions are landing.`;
}

function impactSentence(
  curMargin: number | null,
  marginShift: number | null,
  cur: PeriodAggregate,
): string {
  if (curMargin == null) {
    return cur.netProfit < 0
      ? `The period closed in a loss position, and without booked revenue, the cost base is fully exposed.`
      : `With no booked revenue, the period is best read as an operating-cost snapshot rather than a profitability one.`;
  }
  if (curMargin >= 0.20) {
    if (marginShift != null && marginShift < -0.05) {
      return `Net margin held at ${fmtPct(curMargin)} but is trending down by roughly ${fmtPct(Math.abs(marginShift))} of revenue — still healthy but worth watching.`;
    }
    return `Net margin landed at a healthy ${fmtPct(curMargin)}, leaving operational cushion to absorb noise or invest selectively.`;
  }
  if (curMargin >= 0) {
    if (marginShift != null && marginShift > 0.03) {
      return `Net margin came in at ${fmtPct(curMargin)} — thin but improving from the prior period.`;
    }
    return `Net margin came in at ${fmtPct(curMargin)}, which is workable but leaves limited room for an unplanned expense.`;
  }
  return `The period closed at a ${fmtPct(curMargin)} margin, meaning operations ran at a loss before any non-recurring items.`;
}

function forwardSentence(
  revDelta: number | null,
  expDelta: number | null,
  cur: PeriodAggregate,
  prev: PeriodAggregate,
): string {
  // Confidence-soft forward language.
  if (revDelta != null && revDelta < -0.10) {
    return `Based on current activity, near-term revenue appears soft, and holding the expense line will matter more than usual.`;
  }
  if (expDelta != null && expDelta > 0.15 && (revDelta == null || revDelta < 0.05)) {
    return `Current trends suggest expense growth is outpacing revenue, so the next period will likely turn on whether that gap closes.`;
  }
  if (cur.netProfit > prev.netProfit && cur.netProfit > 0) {
    return `Current trends suggest gradual improvement is possible if revenue and expense discipline both hold.`;
  }
  if (cur.netProfit < 0 && prev.netProfit < 0) {
    return `Recent activity points to continued pressure on profitability — a structural fix likely matters more than a single-period adjustment.`;
  }
  return `Based on recent activity, the business appears to be in a stable band, with the next period likely to look similar absent a deliberate change.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chips — small headline signals shown under the narrative.
// ─────────────────────────────────────────────────────────────────────────────

function buildChips(input: SummaryInput): SummaryChip[] {
  const { current, prev } = input;
  const chips: SummaryChip[] = [];
  const revDelta = pctDelta(current.income, prev.income);
  const expDelta = pctDelta(current.expenses, prev.expenses);
  const curMargin = current.income > 0 ? (current.income - current.expenses) / current.income : null;
  const prevMargin = prev.income > 0 ? (prev.income - prev.expenses) / prev.income : null;

  if (revDelta != null) {
    if (revDelta >= 0.10)       chips.push({ label: "Revenue accelerating", tone: "good" });
    else if (revDelta <= -0.10) chips.push({ label: "Revenue slowing",      tone: "warn" });
    else if (revDelta <= -0.05) chips.push({ label: "Revenue softening",    tone: "warn" });
  }

  if (expDelta != null) {
    if (expDelta >= 0.15)      chips.push({ label: "Expense growth elevated", tone: "warn" });
    else if (expDelta <= -0.10) chips.push({ label: "Expenses easing",        tone: "good" });
  }

  if (curMargin != null) {
    if (curMargin >= 0.20)      chips.push({ label: "Margin healthy",   tone: "good" });
    else if (curMargin < 0)     chips.push({ label: "Operating at a loss", tone: "bad" });
    else if (prevMargin != null && curMargin < prevMargin - 0.03) chips.push({ label: "Margin pressure", tone: "warn" });
  }

  if (current.netProfit > 0 && current.netProfit >= prev.netProfit) {
    chips.push({ label: "Cash flow positive", tone: "good" });
  }

  if (current.payroll > 0 && current.income > 0 && current.payroll / current.income > 0.5) {
    chips.push({ label: "Payroll-heavy", tone: "warn" });
  }

  // Dedup just in case + cap at 5
  const seen = new Set<string>();
  return chips.filter((c) => {
    if (seen.has(c.label)) return false;
    seen.add(c.label);
    return true;
  }).slice(0, 5);
}

// Map a DashboardRange to the timeframe used by the narrative engine.
export function timeframeForRange(range: string): SummaryTimeframe {
  if (range === "this_month" || range === "last_month") return "monthly";
  if (range === "this_quarter" || range === "last_quarter") return "quarterly";
  if (range === "this_year" || range === "last_year") return "yearly";
  return "custom";
}

// Light label suitable for the hero subtitle, derived from a YM range.
export function periodLabelForHero(fromYM: string, toYM: string): string {
  if (fromYM === toYM) return ymToLabel(fromYM);
  return `${ymToLabel(fromYM)} → ${ymToLabel(toYM)}`;
}
