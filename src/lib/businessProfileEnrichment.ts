// Smart Evolution - auto-derived observations the platform notices
// about a workspace over time. Runs against:
//   • the BusinessContext (trailing months, current/prev buckets,
//     averages, forecast, top categories/vendors)
//   • the live signal pool (recommendProactive output)
// and writes them to BusinessProfile.derivedSignals.
//
// Each observation is a single short, plain-English sentence the
// owner could nod at: "Highly seasonal — Nov/Dec do ~2× the
// average month." Persisted as String[] so the system prompt + the
// Settings panel can both render the same list.
//
// Deterministic detectors do the bulk of the work. A single Claude
// pass at the end is optional - it adds 1-2 observations no
// deterministic rule could spot (e.g. "Revenue depends heavily on a
// few large customer payments"). If the Claude call fails or the
// key isn't set, we just persist the deterministic findings.

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { buildBusinessContext, recommendProactive, type BusinessContext } from "./advisor";
import { tierConfigForBusiness } from "./aiTier";

// Cap on how many observations we keep at once - more becomes noise
// in the system prompt + visually overwhelming in the Settings
// panel. The detector list is ranked so the most useful survive.
const MAX_SIGNALS = 8;

// How long before a refresh is offered as "stale". Lazy refresh on
// the dashboard checks this; the user can also force a refresh.
export const ENRICHMENT_TTL_DAYS = 7;

export async function isEnrichmentStale(lastDerivedAt: Date | null): Promise<boolean> {
  if (!lastDerivedAt) return true;
  const days = (Date.now() - lastDerivedAt.getTime()) / 86_400_000;
  return days > ENRICHMENT_TTL_DAYS;
}

// ────────────────────────────────────────────────────────────────────
// Deterministic detectors
// ────────────────────────────────────────────────────────────────────

interface Detected {
  // Rank determines survival order when more than MAX_SIGNALS fire.
  rank: number;
  text: string;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtUSD(n: number, ccy: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function detectSeasonality(ctx: BusinessContext): Detected | null {
  // Need 12+ months of trailing data to talk about seasonality. The
  // BusinessContext only carries 6 trailing months, so we inspect
  // the dataFlow totalsByMonth if available, otherwise skip.
  const dataFlow = (ctx as unknown as { dataFlow?: { totalsByMonth?: Record<string, { income: number }> } }).dataFlow;
  const totals = dataFlow?.totalsByMonth;
  if (!totals) return null;
  const monthEntries = Object.entries(totals).map(([ym, t]) => ({ ym, income: t.income }));
  if (monthEntries.length < 12) return null;
  // Compute average; then look for months that consistently hit
  // ≥ 1.5× average across multiple years. Group by month number.
  const byMonth: Record<string, number[]> = {};
  for (const m of monthEntries) {
    const mm = m.ym.split("-")[1];
    if (!byMonth[mm]) byMonth[mm] = [];
    byMonth[mm].push(m.income);
  }
  const overallAvg = monthEntries.reduce((s, m) => s + m.income, 0) / monthEntries.length;
  if (overallAvg <= 0) return null;
  const heavyMonths: string[] = [];
  for (const [mm, values] of Object.entries(byMonth)) {
    if (values.length < 2) continue;       // need at least 2 same-month data points
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    if (avg >= overallAvg * 1.5) heavyMonths.push(mm);
  }
  if (heavyMonths.length === 0) return null;
  const names = heavyMonths
    .sort()
    .map((mm) => new Date(Date.UTC(2000, Number(mm) - 1, 1)).toLocaleString(undefined, { month: "short" }))
    .join("/");
  return {
    rank: 95,
    text: `Highly seasonal — ${names} consistently run ~50%+ above the average month.`,
  };
}

function detectGrowthTrajectory(ctx: BusinessContext): Detected | null {
  const trail = ctx.trailing;
  if (trail.length < 4) return null;
  // Compare first half vs second half of the trailing window.
  const mid = Math.floor(trail.length / 2);
  const firstAvg = trail.slice(0, mid).reduce((s, m) => s + m.income, 0) / mid;
  const secondAvg = trail.slice(mid).reduce((s, m) => s + m.income, 0) / (trail.length - mid);
  if (firstAvg <= 0) return null;
  const change = (secondAvg - firstAvg) / firstAvg;
  if (change >= 0.25) {
    return { rank: 90, text: `Revenue trending up — averaging ${pct(change)} higher in the last few months vs the prior half.` };
  }
  if (change <= -0.20) {
    return { rank: 92, text: `Revenue softening — averaging ${pct(Math.abs(change))} lower in the last few months vs the prior half.` };
  }
  return null;
}

function detectMarketingDependence(ctx: BusinessContext): Detected | null {
  if (ctx.marketingRatio >= 0.15) {
    return {
      rank: 80,
      text: `Marketing-heavy — paid acquisition runs at ~${pct(ctx.marketingRatio)} of revenue on average.`,
    };
  }
  if (ctx.marketingRatio > 0 && ctx.marketingRatio < 0.02 && ctx.avgRevenue > 0) {
    return {
      rank: 60,
      text: `Light on paid acquisition — marketing is under ${pct(ctx.marketingRatio)} of revenue.`,
    };
  }
  return null;
}

function detectPayrollHeaviness(ctx: BusinessContext): Detected | null {
  if (ctx.avgRevenue <= 0) return null;
  const payrollRatio = ctx.avgPayroll / ctx.avgRevenue;
  if (payrollRatio >= 0.45) {
    return { rank: 75, text: `Payroll-heavy — roughly ${pct(payrollRatio)} of revenue goes to staff.` };
  }
  return null;
}

function detectCashflowConcern(ctx: BusinessContext): Detected | null {
  const negativeMonths = ctx.trailing.filter((m) => m.net < 0).length;
  if (negativeMonths >= 3) {
    return { rank: 88, text: `Cash flow under pressure — ${negativeMonths} of the last ${ctx.trailing.length} months ran negative.` };
  }
  if (ctx.forecast[0] && ctx.forecast[0].expectedNet < 0) {
    return { rank: 85, text: `Forecast flags negative net next month — worth watching the burn closely.` };
  }
  return null;
}

function detectVendorConcentration(ctx: BusinessContext): Detected | null {
  if (!ctx.topVendors || ctx.topVendors.length === 0) return null;
  const totalSpend = ctx.topVendors.reduce((s, v) => s + Math.abs(v.amount), 0);
  if (totalSpend <= 0) return null;
  const top = ctx.topVendors[0];
  const share = Math.abs(top.amount) / totalSpend;
  if (share >= 0.35) {
    return { rank: 70, text: `Vendor concentration — ${top.vendor} alone accounts for ~${pct(share)} of tracked spend.` };
  }
  return null;
}

function detectCategoryConcentration(ctx: BusinessContext): Detected | null {
  if (!ctx.topCategories || ctx.topCategories.length === 0) return null;
  const totalSpend = ctx.topCategories.reduce((s, c) => s + Math.abs(c.amount), 0);
  if (totalSpend <= 0) return null;
  const top = ctx.topCategories[0];
  const share = Math.abs(top.amount) / totalSpend;
  if (share >= 0.40) {
    return { rank: 65, text: `Expense concentration — "${top.name}" makes up ~${pct(share)} of expense spend.` };
  }
  return null;
}

function detectScale(ctx: BusinessContext): Detected | null {
  if (ctx.avgRevenue <= 0) return null;
  return {
    rank: 50,
    text: `Operating at roughly ${fmtUSD(ctx.avgRevenue, ctx.ccy)}/mo revenue and ${fmtUSD(ctx.avgExpenses, ctx.ccy)}/mo expenses on average.`,
  };
}

function runDeterministic(ctx: BusinessContext): Detected[] {
  const out: (Detected | null)[] = [
    detectSeasonality(ctx),
    detectGrowthTrajectory(ctx),
    detectCashflowConcern(ctx),
    detectMarketingDependence(ctx),
    detectPayrollHeaviness(ctx),
    detectVendorConcentration(ctx),
    detectCategoryConcentration(ctx),
    detectScale(ctx),
  ];
  return out.filter((d): d is Detected => d != null);
}

// ────────────────────────────────────────────────────────────────────
// Claude polish (optional)
// ────────────────────────────────────────────────────────────────────

const POLISH_SYSTEM = `You are spotting patterns in a small business's financial profile that simple rules might miss. The user has filled out their business profile + the system already detected some patterns deterministically (listed below). Your job: return 1-2 ADDITIONAL observations that the deterministic rules would not have caught.

Examples of what fits: customer concentration risk hinted at by lumpy revenue, an emerging shift in expense mix, signs that one channel is starting to plateau, a margin pattern that's masked by the topline.

Output rules:
- Return ONE JSON array of 1-2 strings. No prose, no fences if possible.
- Each string is a single sentence, plain English, owner-voice, ≤ 18 words.
- DO NOT restate any deterministic observation; if you have nothing genuinely new to add, return [].
- DO NOT include numbers you can't verify from the context. If you cite a percentage or dollar, it must be derivable.

Output example: ["Revenue is concentrated in a few large invoices each month rather than steady volume.", "Margin held up despite revenue softening — costs flexed down well."]`;

async function claudePolish(
  ctx: BusinessContext,
  deterministic: Detected[],
  businessId: string,
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const looksReal = !!apiKey && apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);
  if (!looksReal) return [];
  try {
    const tier = await tierConfigForBusiness(businessId, "derived_signals");
    const client = new Anthropic({ apiKey: apiKey! });
    const snapshot = JSON.stringify({
      ccy:          ctx.ccy,
      ym:           ctx.ym,
      current:      ctx.current,
      prev:         ctx.prev,
      trailing:     ctx.trailing,
      avgRevenue:   ctx.avgRevenue,
      avgExpenses:  ctx.avgExpenses,
      avgPayroll:   ctx.avgPayroll,
      avgMarketing: ctx.avgMarketing,
      topVendors:   ctx.topVendors,
      topCategories: ctx.topCategories,
      forecast:     ctx.forecast,
    }, null, 2);
    const res = await client.messages.create({
      model:      tier.model,
      max_tokens: tier.maxTokens,
      ...(tier.thinking ? { thinking: tier.thinking } : {}),
      ...(tier.effort ? { output_config: { effort: tier.effort } } : {}),
      system: [
        { type: "text", text: POLISH_SYSTEM },
        { type: "text", text: `Live business snapshot:\n\n\`\`\`json\n${snapshot}\n\`\`\`\n\nDeterministic observations already captured:\n${deterministic.map((d) => `- ${d.text}`).join("\n")}` },
      ],
      messages: [{ role: "user", content: "What 1-2 additional patterns stand out?" }],
    });
    let raw = "";
    for (const b of res.content) if (b.type === "text") raw += b.text;
    raw = raw.trim();
    // Tolerate a fenced ```json block or bare JSON.
    const fence = raw.match(/```json\s*([\s\S]*?)```/i);
    const txt   = (fence ? fence[1] : raw).trim();
    const parsed = JSON.parse(txt);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim().slice(0, 200))
      .slice(0, 2);
  } catch (err) {
    console.error("[businessProfileEnrichment] claude polish failed", err);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────
// Public
// ────────────────────────────────────────────────────────────────────

export async function enrichDerivedSignals(businessId: string): Promise<{ signals: string[]; mode: "claude+rules" | "rules" }> {
  const ctx = await buildBusinessContext(businessId);
  // The signal pool isn't directly used yet, but pulling it warms the
  // forecast-engine cache and keeps the function future-proof when we
  // start mixing signal-level observations into the derived list.
  await recommendProactive(businessId, ctx).catch(() => []);

  const detected = runDeterministic(ctx);
  const polished = await claudePolish(ctx, detected, businessId);

  // Rank the deterministic items, then append polished ones. Cap at
  // MAX_SIGNALS and dedupe by exact match.
  detected.sort((a, b) => b.rank - a.rank);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of detected) {
    if (seen.has(d.text)) continue;
    seen.add(d.text);
    out.push(d.text);
    if (out.length >= MAX_SIGNALS) break;
  }
  for (const p of polished) {
    if (out.length >= MAX_SIGNALS) break;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }

  await prisma.businessProfile.update({
    where: { businessId },
    data:  { derivedSignals: out, lastDerivedAt: new Date() },
  });

  return { signals: out, mode: polished.length > 0 ? "claude+rules" : "rules" };
}
