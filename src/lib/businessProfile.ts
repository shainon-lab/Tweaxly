// Business DNA - the workspace profile that powers every Claude
// call. Captured during onboarding (or via Settings → Business
// Profile) and injected into the system prompt so the AI reasons
// in the specific context of THIS business.
//
// Public API:
//   getBusinessProfile(businessId)        → fetch the row (or null)
//   upsertBusinessProfile(id, fields)     → save partial updates
//   generateBusinessSummary(businessId)   → ask Claude for a fresh
//                                           80-200 word "About Your
//                                           Business" paragraph,
//                                           persist + return it
//   getProfileForPrompt(businessId)       → compact text block to
//                                           inject into Claude system
//                                           prompts elsewhere
//
// Vocabulary constants (INDUSTRY_OPTIONS, BUSINESS_MODEL_OPTIONS, …)
// are exported so the Settings UI + the AI summary share the same
// labels.

import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { buildBusinessContext } from "./advisor";
import {
  INDUSTRY_OPTIONS, BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
  AI_PREFERENCE_TOGGLES,
} from "./businessProfileOptions";

// Re-export the vocabulary so existing server-side imports from
// "@/lib/businessProfile" keep working.
export {
  INDUSTRY_OPTIONS, BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
  AI_PREFERENCE_TOGGLES,
};

// AI Context Preferences shape. Stored as JSON so we can evolve it
// without a migration per new field.
export interface AiContextPreferences {
  toggles?:     string[];   // values from AI_PREFERENCE_TOGGLES
  freeformNote?: string;    // free-text "anything else for the AI to know"
}

// ────────────────────────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────────────────────────

export type BusinessProfileFields = {
  industry?:         string | null;
  businessCategory?: string | null;
  businessModels?:   string[];
  mainGoal?:         string | null;
  customerType?:     string | null;
  revenueStage?:     string | null;
  biggestChallenge?: string | null;
  importantKpis?:    string[];
  aiContextPreferences?: AiContextPreferences | null;
};

export async function getBusinessProfile(businessId: string) {
  return prisma.businessProfile.findUnique({ where: { businessId } });
}

export async function upsertBusinessProfile(
  businessId: string,
  fields: BusinessProfileFields,
) {
  const clean = {
    industry:         fields.industry ?? undefined,
    businessCategory: fields.businessCategory ?? undefined,
    businessModels:   fields.businessModels ?? undefined,
    mainGoal:         fields.mainGoal ?? undefined,
    customerType:     fields.customerType ?? undefined,
    revenueStage:     fields.revenueStage ?? undefined,
    biggestChallenge: fields.biggestChallenge ?? undefined,
    importantKpis:    fields.importantKpis ?? undefined,
    // Prisma's Json column wants InputJsonValue | JsonNull on writes;
    // map our nice null/undefined contract onto that.
    aiContextPreferences:
      fields.aiContextPreferences === undefined
        ? undefined
        : (fields.aiContextPreferences === null
            ? Prisma.JsonNull
            : (fields.aiContextPreferences as unknown as Prisma.InputJsonValue)),
  };
  return prisma.businessProfile.upsert({
    where:  { businessId },
    create: { businessId, ...clean },
    update: clean,
  });
}

// True when the user has answered enough questions for the profile
// to be useful. We require industry + at least one business model -
// those two unlock most of the AI contextualization. Everything
// else strengthens it but isn't required.
export function isProfileSubstantive(p: { industry: string | null; businessModels: string[] } | null): boolean {
  if (!p) return false;
  return !!p.industry && p.businessModels.length > 0;
}

// ────────────────────────────────────────────────────────────────────
// AI summary
// ────────────────────────────────────────────────────────────────────

const SUMMARY_SYSTEM = `You write the "About Your Business" paragraph that lives at the top of a small business's Tweaxly workspace. The owner just filled out a short profile (industry, business model, main goal, customer type, stage, biggest challenge, key KPIs) and you also have a live snapshot of their recent financial data.

Write ONE paragraph, 80-200 words, in clean business English. Tone: professional but human - like a quick brief a smart analyst would write the first time they met the business. No emojis, no headers, no bullet lists. No phrases like "Here is", "I have", "As an AI", "based on the data provided". Just the paragraph itself.

Lead with what kind of business this is (industry + model + customer type), then their stage + main focus, then 1-2 sentences that connect their challenge / KPI priorities to whatever the live financial snapshot shows (recent revenue level, margin, payroll, etc.). Be concrete about magnitudes when the data supports it ("a ~$30K/month operation"), hedge when it doesn't.

Output: just the paragraph. No quotes, no markdown, no preamble.`;

// Build the "About Your Business" paragraph, persist it, return it.
// Falls back to a deterministic stub when ANTHROPIC_API_KEY isn't
// set so the UI still has something to show in mock mode.
export async function generateBusinessSummary(businessId: string): Promise<{ summary: string; mode: "claude" | "mock" }> {
  const profile = await getBusinessProfile(businessId);
  if (!profile) throw new Error("No profile to summarise");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const looksReal =
    !!apiKey && apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  // Build a compact context block. We pass the structured profile +
  // a thin slice of the BusinessContext (current month + averages)
  // so Claude can anchor the summary in real numbers.
  const ctx = await buildBusinessContext(businessId).catch(() => null);
  const profilePayload = JSON.stringify({
    industry:         profile.industry,
    businessCategory: profile.businessCategory,
    businessModels:   profile.businessModels,
    mainGoal:         profile.mainGoal,
    customerType:     profile.customerType,
    revenueStage:     profile.revenueStage,
    biggestChallenge: profile.biggestChallenge,
    importantKpis:    profile.importantKpis,
  }, null, 2);
  const snapshotPayload = ctx ? JSON.stringify({
    ccy:           ctx.ccy,
    ym:            ctx.ym,
    current:       ctx.current,
    avgRevenue:    ctx.avgRevenue,
    avgExpenses:   ctx.avgExpenses,
    avgPayroll:    ctx.avgPayroll,
    avgMarketing:  ctx.avgMarketing,
    employeeCount: ctx.employees.length,
  }, null, 2) : "(no live data yet)";

  let summary: string;
  let mode: "claude" | "mock";

  if (looksReal) {
    try {
      const client = new Anthropic({ apiKey: apiKey! });
      const res = await client.messages.create({
        model:      "claude-opus-4-7",
        max_tokens: 600,
        thinking:   { type: "adaptive" },
        system: [
          { type: "text", text: SUMMARY_SYSTEM },
          { type: "text", text: `Owner-filled profile:\n\n\`\`\`json\n${profilePayload}\n\`\`\`\n\nLive financial snapshot:\n\n\`\`\`json\n${snapshotPayload}\n\`\`\`` },
        ],
        messages: [{ role: "user", content: "Write the About Your Business paragraph for this workspace." }],
      });
      let text = "";
      for (const b of res.content) if (b.type === "text") text += b.text;
      summary = text.trim() || mockSummary(profile);
      mode = "claude";
    } catch (e) {
      console.error("[businessProfile.generateBusinessSummary] claude failed", e);
      summary = mockSummary(profile);
      mode = "mock";
    }
  } else {
    summary = mockSummary(profile);
    mode = "mock";
  }

  await prisma.businessProfile.update({
    where: { businessId },
    data:  { aiSummary: summary, aiSummaryUpdatedAt: new Date() },
  });

  return { summary, mode };
}

function mockSummary(p: NonNullable<Awaited<ReturnType<typeof getBusinessProfile>>>): string {
  // Prefer the specific business category over the broad industry
  // when both are present - "recording studio" reads more naturally
  // than "Music & Entertainment operation".
  const what  = p.businessCategory ?? p.industry ?? "small business";
  const mod   = p.businessModels?.[0] ?? "general";
  const cust  = customerLabel(p.customerType);
  const stage = stageLabel(p.revenueStage);
  const goal  = goalLabel(p.mainGoal);
  return `Tweaxly has identified your business as a ${stage.toLowerCase()} ${what} primarily serving ${cust} customers via ${mod.replace(/_/g, " ")} revenue. Current focus is on ${goal.toLowerCase()}${p.biggestChallenge ? `, with ${p.biggestChallenge} called out as the biggest active challenge` : ""}. The AI advisor will weigh recommendations against this profile - quoting the data when relevant and shaping its tone around your stage and priorities.`;
}

function customerLabel(v: string | null): string {
  return CUSTOMER_TYPE_OPTIONS.find((x) => x.value === v)?.label ?? "your";
}
function stageLabel(v: string | null): string {
  return REVENUE_STAGE_OPTIONS.find((x) => x.value === v)?.label ?? "Growing";
}
function goalLabel(v: string | null): string {
  return MAIN_GOAL_OPTIONS.find((x) => x.value === v)?.label ?? "operational improvement";
}

// ────────────────────────────────────────────────────────────────────
// Prompt injection
// ────────────────────────────────────────────────────────────────────

// Compact text block ready to drop into any Claude system prompt so
// the model can reason about the business's identity + priorities
// without the caller having to format it. Returns "" when there's
// no useful profile yet - callers can concatenate unconditionally.
export async function getProfileForPrompt(businessId: string): Promise<string> {
  const p = await getBusinessProfile(businessId);
  if (!isProfileSubstantive(p)) return "";
  const np = p!;
  const lines: string[] = [];
  lines.push("Business profile (owner-filled, treat as ground truth about who this business is and what they care about):");
  if (np.industry)         lines.push(`- Industry: ${np.industry}`);
  if (np.businessCategory) lines.push(`- Specific category: ${np.businessCategory}`);
  if (np.businessModels.length) {
    const labels = np.businessModels.map((v) => BUSINESS_MODEL_OPTIONS.find((o) => o.value === v)?.label ?? v);
    lines.push(`- Business model: ${labels.join(", ")}`);
  }
  if (np.customerType)     lines.push(`- Primary customers: ${customerLabel(np.customerType)}`);
  if (np.revenueStage)     lines.push(`- Stage: ${stageLabel(np.revenueStage)}`);
  if (np.mainGoal)         lines.push(`- Main goal right now: ${goalLabel(np.mainGoal)}`);
  if (np.biggestChallenge) lines.push(`- Biggest challenge: ${np.biggestChallenge}`);
  if (np.importantKpis.length) {
    const labels = np.importantKpis.map((v) => KPI_OPTIONS.find((o) => o.value === v)?.label ?? v);
    lines.push(`- KPIs the owner watches most: ${labels.join(", ")}`);
  }
  if (np.aiSummary) {
    lines.push("");
    lines.push(`AI-generated "About this business":`);
    lines.push(np.aiSummary);
  }

  // AI Context Preferences (Phase 3) - owner-set biases that shape
  // the advisor's tone, ranking, and risk posture.
  const prefs = np.aiContextPreferences as AiContextPreferences | null | undefined;
  const toggleLabels: string[] = [];
  for (const v of prefs?.toggles ?? []) {
    const label = AI_PREFERENCE_TOGGLES.find((o) => o.value === v)?.label;
    if (label) toggleLabels.push(label);
  }
  if (toggleLabels.length > 0 || (prefs?.freeformNote && prefs.freeformNote.trim())) {
    lines.push("");
    lines.push("AI context preferences (owner-set biases - honour these in tone, ranking, and risk posture):");
    for (const l of toggleLabels) lines.push(`- ${l}`);
    if (prefs?.freeformNote && prefs.freeformNote.trim()) {
      lines.push(`- Note from the owner: ${prefs.freeformNote.trim()}`);
    }
  }

  // Derived Signals (Phase 3 stub) - auto-enriched observations the
  // system has learned over time. Stay empty until enrichment runs.
  if (np.derivedSignals && np.derivedSignals.length > 0) {
    lines.push("");
    lines.push("Patterns Tweaxly has noticed about this business over time:");
    for (const s of np.derivedSignals) lines.push(`- ${s}`);
  }

  lines.push("");
  lines.push("Use this profile to bias your reasoning: prioritise the owner's stated goal, weigh recommendations against their stage + customer type, honour the context preferences above, and explicitly reference their challenge or watched KPIs when the question touches them.");
  return lines.join("\n");
}
