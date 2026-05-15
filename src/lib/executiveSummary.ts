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

// Bulletin — a single anchor in the right-side "Business Bulletins"
// column. Lightweight by design: a short label + a short value, with
// an optional trend arrow. NOT a KPI card.
export type Bulletin = {
  label: string;          // "Revenue", "Operating Margin", "Cost Pressure"
  value: string;          // "$2.05M", "21.8%", "Accelerating", "Moderate"
  trend?: "up" | "down" | "flat";
  tone?: "good" | "warn" | "bad" | "neutral";
};

export type ExecutiveSummary = {
  narrative: string;
  chips: SummaryChip[];
  bulletins: Bulletin[];
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
  const bulletins = buildBulletins(input);

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
          bulletins,
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
    bulletins,
    source: "deterministic",
    periodLabel: input.periodLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude path
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTIONS = `You are an executive business advisor writing a short, nuanced summary for a small-business owner.

Tone:
- Calm, analytical, executive-level. Like a thoughtful CFO speaking to the owner.
- Balanced and credible. Never marketing-polished. Never breathless.
- Never robotic. Never dramatic. Never use AI buzzwords or hype.

Confidence calibration — this is critical:
- Never assert the future as certain. Avoid "WILL decline", "IS failing", "guaranteed to improve".
- Prefer soft phrasings: "current trends indicate", "based on recent activity", "the data suggests", "appears to be stabilizing", "may continue if…", "remains uncertain", "for now".
- Acknowledge uncertainty when warranted. It is fine to say "the picture is mixed" or "this stabilization may not hold if X continues".

Length: one paragraph, 3–5 sentences. Plain prose only — no headings, no bullets, no markdown, no emoji.

Variability — equally critical. Every summary must feel like it was written specifically for this business, this period:
- Do NOT use a fixed template. Do not always open with "The business started…" or "Revenue increased…" or "During this period…". Vary the opening every time.
- Choose what to lead with based on what's most material in this period — sometimes lead with profitability, sometimes cash flow, sometimes operational pressure, sometimes growth momentum, sometimes a single vendor or category move that dominates the data.
- Vary sentence structure across summaries. Do not always go in the order opening→change→impact→forward. If the most important thing is the forward-looking concern, you can lead with that. If the most important thing is that a margin held despite revenue weakness, lead with the resilience.
- A summary can omit a "section" if it's not interesting. If nothing is forward-looking-worthy, don't tack on a forecast sentence just to fill the slot.

Focus selection (pick at most two to highlight, not all of them):
- growth / revenue momentum
- profitability / margin
- expenses / cost growth
- payroll / headcount
- cash flow
- operational efficiency
- seasonal or one-time effects
- vendor or category concentration

Adapt emphasis to the timeframe:
- monthly  → anomalies, short-term shifts, operational changes.
- quarterly → trend evolution, momentum, category-level moves.
- yearly   → strategic evolution, profitability trends, forecast direction.
- custom   → treat as a free range; lean on the biggest movements regardless of length.

Honesty rules:
- Do not invent numbers. Use the figures in the snapshot. If a metric isn't present, don't fabricate one.
- Avoid percentages in every sentence — one or two grounded numbers in the paragraph is enough. Prose first, figures sparingly.
- If the picture is genuinely mixed (revenue up but margin down; profit positive but cash flow softening), say so plainly. Mixed reads as more credible than uniformly positive or negative.
- It's okay — and often better — to surface a small concern even in a generally good period ("collections slowed slightly", "expense growth bears watching").

Examples of preferred phrasing:
- "Cash flow remained stable, although recent collections appear to have slowed."
- "Profitability improved moderately following payroll adjustments, though revenue growth has flattened."
- "Operating margins held above 20% for the period, partly because one-time expenses dropped — sustainable margin still bears watching."
- "Current trends suggest possible margin pressure if expense growth continues at this pace."

Examples to avoid:
- "Your business is doing great."
- "Everything looks healthy."
- "Revenue will continue growing strongly."
- "The company is performing excellently."`;

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
//
// Strategy: score the candidate focus areas (revenue-growth, revenue-decline,
// expense-pressure, margin-compression, loss, stability, mixed), pick the
// dominant one, and emit a 3–4 sentence paragraph composed from that focus's
// templates. A deterministic per-input variant index picks between template
// options so the wording varies across businesses and periods without
// becoming nondeterministic for the same inputs.

function buildDeterministicNarrative(input: SummaryInput): string {
  const m = input.current;
  const p = input.prev;
  const ccy = input.ccy;
  const revDelta = pctDelta(m.income, p.income);
  const expDelta = pctDelta(m.expenses, p.expenses);
  const curMargin = m.income > 0 ? (m.income - m.expenses) / m.income : null;
  const prevMargin = p.income > 0 ? (p.income - p.expenses) / p.income : null;
  const marginShift = curMargin != null && prevMargin != null ? curMargin - prevMargin : null;
  const netImproving = m.netProfit > p.netProfit;
  const netDeclining = m.netProfit < p.netProfit;

  // Score candidate focuses. Highest score wins; ties break by priority order.
  type Focus =
    | "loss"
    | "margin_compression"
    | "expense_pressure"
    | "revenue_decline"
    | "revenue_growth"
    | "margin_resilience"
    | "stability";
  const scores: { focus: Focus; score: number }[] = [];

  if (m.netProfit < 0) scores.push({ focus: "loss", score: Math.max(50, Math.abs(m.netProfit) / 100) });
  if (marginShift != null && marginShift < -0.05) scores.push({ focus: "margin_compression", score: 30 + Math.abs(marginShift) * 100 });
  if (expDelta != null && expDelta > 0.10) scores.push({ focus: "expense_pressure", score: 20 + expDelta * 100 });
  if (revDelta != null && revDelta < -0.05) scores.push({ focus: "revenue_decline", score: 20 + Math.abs(revDelta) * 100 });
  if (revDelta != null && revDelta > 0.10) scores.push({ focus: "revenue_growth", score: 15 + revDelta * 80 });
  // Resilience: revenue softened but margins held — worth highlighting.
  if (revDelta != null && revDelta < -0.05 && curMargin != null && curMargin >= 0.15 && (marginShift == null || marginShift > -0.03)) {
    scores.push({ focus: "margin_resilience", score: 25 });
  }

  scores.sort((a, b) => b.score - a.score);
  const focus: Focus = scores[0]?.focus ?? "stability";

  // Variant seed — stable per (period × business name) so a given page
  // always reads the same, but different periods/businesses pick
  // different template options.
  const seed = hashString(`${input.periodLabel}|${input.businessName}|${focus}`);

  const ctx = {
    ccy,
    periodLabel: input.periodLabel,
    timeframe: input.timeframe,
    current: m,
    prev: p,
    revDelta,
    expDelta,
    curMargin,
    prevMargin,
    marginShift,
    netImproving,
    netDeclining,
    seed,
  };

  switch (focus) {
    case "loss":               return composeLoss(ctx);
    case "margin_compression": return composeMarginCompression(ctx);
    case "expense_pressure":   return composeExpensePressure(ctx);
    case "revenue_decline":    return composeRevenueDecline(ctx);
    case "revenue_growth":     return composeRevenueGrowth(ctx);
    case "margin_resilience":  return composeMarginResilience(ctx);
    case "stability":
    default:                   return composeStability(ctx);
  }
}

type NarrCtx = {
  ccy: string;
  periodLabel: string;
  timeframe: SummaryTimeframe;
  current: PeriodAggregate;
  prev: PeriodAggregate;
  revDelta: number | null;
  expDelta: number | null;
  curMargin: number | null;
  prevMargin: number | null;
  marginShift: number | null;
  netImproving: boolean;
  netDeclining: boolean;
  seed: number;
};

function pctDelta(curr: number, prior: number): number | null {
  if (prior <= 0) return null;
  return (curr - prior) / prior;
}

// Tiny string hash used to pick a sentence variant — deterministic and
// good enough for choosing between 2–3 phrasings per spot.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

function pick<T>(variants: T[], seed: number, offset = 0): T {
  return variants[(seed + offset) % variants.length];
}

// Compose helpers — each builds a paragraph for one focus. Each picks
// among 2–3 sentence variants so the wording differs across periods.

function composeLoss(c: NarrCtx): string {
  const loss = fmtMoney(Math.abs(c.current.netProfit), c.ccy);
  const exp = fmtMoney(c.current.expenses, c.ccy);
  const opening = pick([
    `${c.periodLabel} closed in a loss position of ${loss}, with expenses of ${exp} running ahead of revenue.`,
    `The period ended with a ${loss} loss, as the cost base of ${exp} outpaced what came in.`,
    `Profitability slipped into negative territory in ${c.periodLabel} — a ${loss} loss against ${exp} of operating cost.`,
  ], c.seed, 0);

  const middle =
    c.revDelta != null && c.revDelta < -0.05
      ? pick([
          `Revenue softened by ${fmtPct(Math.abs(c.revDelta))} compared with the prior period, which is the primary driver of the result.`,
          `Top-line activity slowed by roughly ${fmtPct(Math.abs(c.revDelta))} period-over-period, leaving fixed costs more exposed.`,
        ], c.seed, 1)
      : c.expDelta != null && c.expDelta > 0.10
        ? pick([
            `Expenses ran ${fmtPct(c.expDelta)} higher than the prior period; without a matching revenue lift, the gap widened the loss.`,
            `Cost growth of ${fmtPct(c.expDelta)} did most of the damage, since revenue did not move enough to absorb it.`,
          ], c.seed, 2)
        : `The picture is mixed — the loss reflects a cost base sized for stronger revenue than the period delivered.`;

  const forward = c.prev.netProfit < 0
    ? pick([
        `Recent activity points to continued pressure on profitability; a structural rebalance likely matters more than another single-period adjustment.`,
        `The data suggests this is not a one-off, and the response probably needs to be at the cost-structure level rather than the line-item level.`,
      ], c.seed, 3)
    : pick([
        `Whether this reverses next period depends largely on whether revenue recovers or cost growth slows — both can carry the result.`,
        `The next period will likely turn on which side of the equation moves first; for now, the loss appears more recoverable than structural.`,
      ], c.seed, 4);

  return [opening, middle, forward].join(" ");
}

function composeMarginCompression(c: NarrCtx): string {
  if (c.curMargin == null) return composeStability(c);
  const opening = pick([
    `Margins compressed during ${c.periodLabel}, landing at ${fmtPct(c.curMargin)} after running at ${c.prevMargin != null ? fmtPct(c.prevMargin) : "a wider band"} in the prior period.`,
    `${c.periodLabel} saw operating margin tighten to ${fmtPct(c.curMargin)} — a ${c.marginShift != null ? fmtPct(Math.abs(c.marginShift)) : "noticeable"} contraction from the prior period.`,
    `Profitability gave back some ground in ${c.periodLabel}, with net margin slipping to ${fmtPct(c.curMargin)}.`,
  ], c.seed, 0);

  const driver =
    c.revDelta != null && c.revDelta < -0.05 && c.expDelta != null && c.expDelta > 0.05
      ? `The compression came from both sides — revenue softening while expenses pressed higher.`
      : c.expDelta != null && c.expDelta > 0.10
        ? pick([
            `The pressure came mostly from the cost side, with expenses up ${fmtPct(c.expDelta)} period-over-period.`,
            `Cost growth of ${fmtPct(c.expDelta)} did most of the work, more than offsetting any revenue gains.`,
          ], c.seed, 1)
        : c.revDelta != null && c.revDelta < -0.05
          ? pick([
              `Revenue eased by ${fmtPct(Math.abs(c.revDelta))} while expenses stayed largely flat — the margin took the hit.`,
              `Top-line softness of ${fmtPct(Math.abs(c.revDelta))} carried the compression; the cost base was largely intact.`,
            ], c.seed, 2)
          : `The cause is distributed across smaller line items rather than a single dominant driver.`;

  const forward = c.curMargin >= 0.10
    ? pick([
        `Margins remain workable for now, but the trajectory bears watching if expense growth continues at this pace.`,
        `For now the business is still in a positive band, though current trends suggest further pressure if the same dynamics persist.`,
      ], c.seed, 3)
    : pick([
        `At this margin level, an unplanned cost could push the period negative, so tightening discretionary spend would be prudent.`,
        `Current trends indicate the margin is now thin enough that a single bad month could flip the result — caution on new commitments is warranted.`,
      ], c.seed, 4);

  return [opening, driver, forward].join(" ");
}

function composeExpensePressure(c: NarrCtx): string {
  const exp = fmtMoney(c.current.expenses, c.ccy);
  const expPct = c.expDelta != null ? fmtPct(c.expDelta) : null;
  const opening = pick([
    `Expense growth was the defining feature of ${c.periodLabel} — costs ran to ${exp}${expPct ? `, up ${expPct} period-over-period` : ""}.`,
    `${c.periodLabel} saw operating costs climb to ${exp}${expPct ? ` (${expPct} above the prior period)` : ""}, dominating the period's narrative.`,
    `The biggest move in ${c.periodLabel} came from the cost side, with total expenses landing at ${exp}${expPct ? ` — a ${expPct} increase` : ""}.`,
  ], c.seed, 0);

  const rev =
    c.revDelta != null && c.revDelta >= 0.05
      ? pick([
          `Revenue grew alongside it, so the impact on profitability was partially absorbed.`,
          `Top-line growth of ${fmtPct(c.revDelta)} cushioned the impact, but did not fully offset it.`,
        ], c.seed, 1)
      : c.revDelta != null && c.revDelta <= -0.03
        ? `Revenue did not keep pace — it eased by ${fmtPct(Math.abs(c.revDelta))} — so the cost growth landed disproportionately on the bottom line.`
        : pick([
            `Revenue held roughly flat, so the cost increase translated almost directly into margin pressure.`,
            `Top-line was essentially unchanged, meaning the increase showed up in margin rather than scale.`,
          ], c.seed, 2);

  const forward = pick([
    `Current trends suggest possible margin pressure if expense growth continues at this pace; identifying which categories drove the increase is the natural next step.`,
    `Based on recent activity, this is the kind of move that compounds — the next period will likely turn on whether the cost growth was one-off or structural.`,
    `For now profitability remains workable, but the data suggests caution on any further discretionary commitments until the cost base settles.`,
  ], c.seed, 3);

  return [opening, rev, forward].join(" ");
}

function composeRevenueDecline(c: NarrCtx): string {
  const decline = c.revDelta != null ? fmtPct(Math.abs(c.revDelta)) : "noticeably";
  const rev = fmtMoney(c.current.income, c.ccy);
  const opening = pick([
    `Top-line activity softened in ${c.periodLabel} — revenue came in at ${rev}, ${decline} below the prior period.`,
    `Revenue is the headline story for ${c.periodLabel}: ${rev}, down ${decline} from the prior period.`,
    `${c.periodLabel} saw revenue ease by ${decline}, landing at ${rev}.`,
  ], c.seed, 0);

  const impact = c.curMargin != null && c.curMargin >= 0.15
    ? pick([
        `Margins held above ${fmtPct(c.curMargin)} despite the softness, which suggests the cost base is right-sized for now — though that resilience may not last if the slowdown continues.`,
        `Profitability held up at ${fmtPct(c.curMargin)} — encouraging, but contingent on expense discipline continuing.`,
      ], c.seed, 1)
    : c.curMargin != null && c.curMargin >= 0
      ? `Margins tightened to ${fmtPct(c.curMargin)} as a result — workable, but with less cushion than before.`
      : `Profitability turned negative as the cost base wasn't able to absorb the drop quickly enough.`;

  const forward = pick([
    `Tracing the decline to a specific channel, customer, or contract is the highest-leverage next step — the data suggests it is concentrated rather than broad.`,
    `Based on recent activity, near-term revenue appears soft, and holding the expense line will matter more than usual until the cause is identified.`,
    `Current trends indicate this may stabilize, but for now the picture warrants caution — particularly around new fixed commitments.`,
  ], c.seed, 2);

  return [opening, impact, forward].join(" ");
}

function composeRevenueGrowth(c: NarrCtx): string {
  const growth = c.revDelta != null ? fmtPct(c.revDelta) : "noticeably";
  const rev = fmtMoney(c.current.income, c.ccy);
  const opening = pick([
    `Revenue led ${c.periodLabel}, growing ${growth} period-over-period to ${rev}.`,
    `${c.periodLabel} stood out for top-line momentum — revenue rose ${growth} to ${rev}.`,
    `Growth was the defining feature of ${c.periodLabel}: ${rev} in revenue, ${growth} above the prior period.`,
  ], c.seed, 0);

  const margin = c.curMargin != null && c.curMargin >= 0.20
    ? pick([
        `Margins came along — net margin landed at a healthy ${fmtPct(c.curMargin)}, suggesting the growth was efficient rather than bought.`,
        `Profitability scaled with revenue rather than diluting it, with margin holding at ${fmtPct(c.curMargin)}.`,
      ], c.seed, 1)
    : c.curMargin != null && c.curMargin >= 0
      ? `Margin came in at ${fmtPct(c.curMargin)} — the growth absorbed some cost pressure but did not fully translate into profitability.`
      : `The growth did not translate into profit yet — the period still closed below breakeven.`;

  const forward = pick([
    `Whether this momentum continues likely depends on whether the underlying driver — channel, contract, or seasonal — is repeatable.`,
    `For now, the data suggests durable growth is possible, though concentrating bets on what drove this period is worth doing carefully.`,
    `Current trends are encouraging, but a single strong period is not yet a trend — the next period will tell.`,
  ], c.seed, 2);

  return [opening, margin, forward].join(" ");
}

function composeMarginResilience(c: NarrCtx): string {
  const margin = c.curMargin != null ? fmtPct(c.curMargin) : "the prior band";
  const decline = c.revDelta != null ? fmtPct(Math.abs(c.revDelta)) : "modestly";
  const opening = pick([
    `${c.periodLabel} is a study in resilience — revenue eased by ${decline}, yet net margin held at ${margin}.`,
    `Despite a ${decline} softening in revenue during ${c.periodLabel}, profitability held up at ${margin}.`,
    `Margins stayed firm at ${margin} in ${c.periodLabel}, even as top-line activity slipped by ${decline}.`,
  ], c.seed, 0);

  const middle = pick([
    `That points to a cost base that's currently right-sized — discretionary spend appears to have flexed with revenue rather than running on autopilot.`,
    `The resilience suggests expense discipline is working; whether it can be sustained as the slowdown continues is the open question.`,
  ], c.seed, 1);

  const forward = pick([
    `For now the picture is steady, but margin resilience without a revenue recovery typically has a half-life — the next period or two will indicate whether this stabilizes.`,
    `Current trends suggest profitability can hold a while longer at this margin, though planning around the assumption it does could leave the business exposed if revenue softens further.`,
  ], c.seed, 2);

  return [opening, middle, forward].join(" ");
}

function composeStability(c: NarrCtx): string {
  const rev = fmtMoney(c.current.income, c.ccy);
  const exp = fmtMoney(c.current.expenses, c.ccy);
  const opening = pick([
    `${c.periodLabel} settled into a stable band — revenue of ${rev} and expenses of ${exp} both tracked close to the prior period.`,
    `The picture for ${c.periodLabel} is mostly continuity: ${rev} in revenue against ${exp} in operating costs, with neither side moving materially.`,
    `${c.periodLabel} closed with the business operating in a familiar range — ${rev} of revenue and ${exp} of expense, in line with recent periods.`,
  ], c.seed, 0);

  const middle = c.curMargin != null
    ? c.curMargin >= 0.20
      ? `Net margin of ${fmtPct(c.curMargin)} is a healthy place to be — there's room to invest selectively or hold cash for optionality.`
      : c.curMargin >= 0
        ? `Margin of ${fmtPct(c.curMargin)} is workable, though it leaves limited room to absorb an unplanned expense.`
        : `Margin remains below breakeven, so this stability is in a thin band rather than a comfortable one.`
    : `Without booked revenue, the picture is more a cost-base snapshot than a profitability one.`;

  const forward = pick([
    `Current trends suggest the next period will look similar absent a deliberate change — a useful baseline for planning, not necessarily a position to defend.`,
    `Based on recent activity, the business appears to be in a steady operational rhythm; stability is its own kind of result, even if it's the least interesting one to write about.`,
    `For now the data suggests continuity, which is a reasonable platform for whichever specific bet — growth, cost reduction, or hire — feels most useful next.`,
  ], c.seed, 1);

  return [opening, middle, forward].join(" ");
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

// ─────────────────────────────────────────────────────────────────────────────
// Bulletins — the right-side anchor list. Lightweight, max 5, dynamically
// chosen so the most material business dimensions are surfaced first.
// ─────────────────────────────────────────────────────────────────────────────

function buildBulletins(input: SummaryInput): Bulletin[] {
  const { ccy, current, prev } = input;
  const revDelta = pctDeltaSafe(current.income, prev.income);
  const expDelta = pctDeltaSafe(current.expenses, prev.expenses);
  const netDelta = pctDeltaSafe(current.netProfit, prev.netProfit);
  const curMargin = current.income > 0 ? (current.income - current.expenses) / current.income : null;
  const prevMargin = prev.income > 0 ? (prev.income - prev.expenses) / prev.income : null;
  const marginShift = curMargin != null && prevMargin != null ? curMargin - prevMargin : null;

  // Each candidate has a priority score; we sort desc and take the top 5.
  // Always-on anchors get a generous baseline so they appear when nothing
  // else is more material.
  type Candidate = Bulletin & { priority: number };
  const candidates: Candidate[] = [];

  // ── Anchor 1: Revenue (always-on)
  candidates.push({
    label: "Revenue",
    value: shortMoney(current.income, ccy),
    trend: revDelta == null ? undefined : revDelta > 0.02 ? "up" : revDelta < -0.02 ? "down" : "flat",
    tone: revDelta == null ? "neutral" : revDelta > 0.02 ? "good" : revDelta < -0.05 ? "warn" : "neutral",
    priority: 100,
  });

  // ── Anchor 2: Operating margin (when revenue exists)
  if (curMargin != null) {
    const marginTone: Bulletin["tone"] =
      curMargin >= 0.20 ? "good" :
      curMargin >= 0.05 ? "neutral" :
      curMargin >= 0    ? "warn" :
                          "bad";
    const marginTrend: Bulletin["trend"] =
      marginShift == null ? undefined :
      marginShift > 0.02  ? "up" :
      marginShift < -0.02 ? "down" :
                            "flat";
    candidates.push({
      label: "Operating Margin",
      value: fmtPct(curMargin),
      trend: marginTrend,
      tone: marginTone,
      priority: 95,
    });
  }

  // ── Anchor 3: Revenue trend (qualitative) — only when meaningful movement
  if (revDelta != null && Math.abs(revDelta) >= 0.05) {
    candidates.push({
      label: "Revenue Trend",
      value: revDelta >= 0.10 ? "Accelerating" : revDelta > 0 ? "Improving" : revDelta > -0.10 ? "Softening" : "Slowing",
      tone: revDelta > 0 ? "good" : "warn",
      priority: revDelta >= 0.10 || revDelta <= -0.10 ? 90 : 60,
    });
  }

  // ── Anchor 4: Cost pressure (qualitative) — only when expense move is non-trivial
  if (expDelta != null && Math.abs(expDelta) >= 0.05) {
    const elevated = expDelta >= 0.15;
    const moderate = expDelta >= 0.05;
    const easing   = expDelta <= -0.05;
    const value =
      elevated ? "Elevated" :
      moderate ? "Moderate" :
      easing   ? "Easing"   : "Stable";
    candidates.push({
      label: "Cost Pressure",
      value,
      tone: elevated ? "warn" : easing ? "good" : "neutral",
      priority: elevated ? 85 : 50,
    });
  }

  // ── Anchor 5: Cash Flow (qualitative)
  let cashState: { value: string; tone: Bulletin["tone"]; priority: number } | null = null;
  if (current.netProfit < 0) {
    cashState = { value: "Under Pressure", tone: "bad", priority: 90 };
  } else if (current.netProfit > 0 && (netDelta == null || netDelta >= -0.05)) {
    cashState = { value: current.netProfit >= prev.netProfit ? "Healthy" : "Stable", tone: "good", priority: 70 };
  } else if (current.netProfit > 0 && netDelta != null && netDelta < -0.20) {
    cashState = { value: "Softening", tone: "warn", priority: 75 };
  }
  if (cashState) {
    candidates.push({
      label: "Cash Flow",
      value: cashState.value,
      tone: cashState.tone,
      priority: cashState.priority,
    });
  }

  // ── Anchor 6: Payroll load (when heavy)
  if (current.payroll > 0 && current.income > 0) {
    const ratio = current.payroll / current.income;
    if (ratio >= 0.5) {
      candidates.push({
        label: "Payroll Load",
        value: ratio >= 0.70 ? "Very Heavy" : "Heavy",
        tone: "warn",
        priority: 65,
      });
    } else if (ratio >= 0.30 && ratio < 0.50) {
      // Only worth surfacing if payroll dominates a not-overly-heavy mix —
      // skip otherwise so we don't crowd the panel.
    }
  }

  // ── Anchor 7: Net Profit (when there's a story to tell vs prev)
  if (current.netProfit !== 0 && netDelta != null && Math.abs(netDelta) >= 0.10) {
    candidates.push({
      label: "Net Profit",
      value: shortMoney(current.netProfit, ccy),
      trend: netDelta > 0 ? "up" : "down",
      tone: current.netProfit < 0 ? "bad" : netDelta > 0 ? "good" : "warn",
      priority: 55,
    });
  }

  // Sort by priority desc, dedup labels (first wins), cap at 5.
  candidates.sort((a, b) => b.priority - a.priority);
  const seen = new Set<string>();
  const out: Bulletin[] = [];
  for (const c of candidates) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    out.push({ label: c.label, value: c.value, trend: c.trend, tone: c.tone });
    if (out.length >= 5) break;
  }
  // Floor at 3: if we somehow have fewer, pad with a quiet baseline.
  if (out.length < 3) {
    if (!seen.has("Expenses")) {
      out.push({
        label: "Expenses",
        value: shortMoney(current.expenses, ccy),
        trend: expDelta == null ? undefined : expDelta > 0.02 ? "up" : expDelta < -0.02 ? "down" : "flat",
        tone: "neutral",
      });
    }
  }
  return out;
}

function pctDeltaSafe(curr: number, prior: number): number | null {
  if (prior === 0) return null;
  return (curr - prior) / Math.abs(prior);
}

// Compact money formatting for bulletins: $2.05M, $187K, $920.
function shortMoney(value: number, ccy: string): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const symbol = currencySymbol(ccy);
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000)    return `${sign}${symbol}${Math.round(abs / 1000)}K`;
  if (abs >= 1_000)     return `${sign}${symbol}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

function currencySymbol(ccy: string): string {
  if (ccy === "USD") return "$";
  if (ccy === "EUR") return "€";
  if (ccy === "GBP") return "£";
  if (ccy === "ILS") return "₪";
  if (ccy === "JPY") return "¥";
  return `${ccy} `;
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
