// GET  /api/business/profile  - read the workspace's Business DNA
// PATCH /api/business/profile - upsert any subset of the 7 fields
//
// All edits are scoped to the active workspace via requireBusiness().

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import {
  getBusinessProfile, upsertBusinessProfile,
  INDUSTRY_OPTIONS, BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
  AI_PREFERENCE_TOGGLES,
  BUSINESS_CHALLENGE_OPTIONS, BUSINESS_CHALLENGE_MAX,
  type AiContextPreferences,
} from "@/lib/businessProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { business } = await requireBusiness();
  const profile = await getBusinessProfile(business.id);
  return NextResponse.json({ profile });
}

const BUSINESS_MODEL_VALUES = new Set<string>(BUSINESS_MODEL_OPTIONS.map((o) => o.value));
const KPI_VALUES            = new Set<string>(KPI_OPTIONS.map((o) => o.value));
const GOAL_VALUES           = new Set<string>(MAIN_GOAL_OPTIONS.map((o) => o.value));
const CUSTOMER_VALUES       = new Set<string>(CUSTOMER_TYPE_OPTIONS.map((o) => o.value));
const STAGE_VALUES          = new Set<string>(REVENUE_STAGE_OPTIONS.map((o) => o.value));
const INDUSTRY_VALUES       = new Set<string>(INDUSTRY_OPTIONS);
const PREF_TOGGLE_VALUES    = new Set<string>(AI_PREFERENCE_TOGGLES.map((o) => o.value));
const CHALLENGE_VALUES      = new Set<string>(BUSINESS_CHALLENGE_OPTIONS.map((o) => o.value));

function asStr(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim().slice(0, 500) : undefined;
}
function asArrFiltered(v: unknown, allowed: Set<string>): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = new Set<string>();
  for (const x of v) {
    if (typeof x === "string" && allowed.has(x)) out.add(x);
  }
  return Array.from(out);
}

export async function PATCH(req: Request) {
  const { business } = await requireBusiness();
  let body: Record<string, unknown>;
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  // Industry accepts the curated list values OR free text - we keep
  // the user's input as-is when it isn't in the list so industries
  // we haven't enumerated still work.
  const industryRaw = asStr(body.industry);
  const industry = industryRaw === undefined
    ? undefined
    : industryRaw === "" ? null
    : INDUSTRY_VALUES.has(industryRaw) ? industryRaw : industryRaw;

  // Business category: same treatment as industry - curated typeahead
  // OR free text. We don't reject unknown values.
  const categoryRaw = asStr(body.businessCategory);
  const businessCategory = categoryRaw === undefined
    ? undefined
    : (categoryRaw === "" ? null : categoryRaw);

  const mainGoalRaw     = asStr(body.mainGoal);
  const customerRaw     = asStr(body.customerType);
  const stageRaw        = asStr(body.revenueStage);
  const challengeRaw    = asStr(body.biggestChallenge);

  // AI Context Preferences (Phase 3). Accept either a structured
  // payload with `toggles` + `freeformNote`, or `undefined` (no
  // change), or `null` (clear). Toggles validated against the
  // vocabulary; freeform note clipped to 1000 chars.
  let aiContextPreferences: AiContextPreferences | null | undefined = undefined;
  if (body.aiContextPreferences === null) {
    aiContextPreferences = null;
  } else if (body.aiContextPreferences && typeof body.aiContextPreferences === "object") {
    const p = body.aiContextPreferences as Record<string, unknown>;
    aiContextPreferences = {
      toggles: asArrFiltered(p.toggles, PREF_TOGGLE_VALUES) ?? [],
      freeformNote: typeof p.freeformNote === "string"
        ? p.freeformNote.trim().slice(0, 1000)
        : undefined,
    };
  }

  const updated = await upsertBusinessProfile(business.id, {
    industry,
    businessCategory,
    businessModels:   asArrFiltered(body.businessModels, BUSINESS_MODEL_VALUES),
    mainGoal:         mainGoalRaw === undefined ? undefined : (mainGoalRaw === "" ? null : GOAL_VALUES.has(mainGoalRaw) ? mainGoalRaw : null),
    customerType:     customerRaw === undefined ? undefined : (customerRaw === "" ? null : CUSTOMER_VALUES.has(customerRaw) ? customerRaw : null),
    revenueStage:     stageRaw    === undefined ? undefined : (stageRaw    === "" ? null : STAGE_VALUES.has(stageRaw) ? stageRaw : null),
    biggestChallenge: challengeRaw === undefined ? undefined : (challengeRaw === "" ? null : challengeRaw),
    // Server-side enforce the max-3 cap so a tampered client can't
    // stuff in more. asArrFiltered also dedupes + drops unknowns.
    businessChallenges: (() => {
      const arr = asArrFiltered(body.businessChallenges, CHALLENGE_VALUES);
      return arr === undefined ? undefined : arr.slice(0, BUSINESS_CHALLENGE_MAX);
    })(),
    importantKpis:    asArrFiltered(body.importantKpis, KPI_VALUES),
    aiContextPreferences,
  });

  return NextResponse.json({ profile: updated });
}
