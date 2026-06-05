// Tiered AI strategy - one helper, four call sites.
//
// Free workspaces hit a smaller, faster, cheaper model with tighter
// output ceilings. Pro+ workspaces hit Opus with adaptive thinking and
// deeper output. The platform's voice stays the same across both
// tiers - we never expose the model name in the UI; instead the
// experience is branded as:
//
//   Free      → "Pulse AI"      (basic intelligence layer)
//   Pro/Biz   → "Strategic AI"  (advanced intelligence layer)
//
// The Free tier is NOT a degraded experience - it's the trust-building
// layer of the product. Lower-cost inference is the trade-off, NOT
// lower-quality insight. The system prompts for each call site can
// additionally pass `tier` to ask for shorter / more focused output
// when Free is in effect.
//
// Why Haiku for Free: it's stable, has very low hallucination on
// structured/financial summarization, supports the same 200K context
// the platform already designs around, and is roughly 5× cheaper than
// Opus. It does NOT support adaptive thinking; the per-call config
// below disables thinking on Free accordingly.

import "server-only";
import { getPlanFor } from "./billing";

export type AiTier = "free" | "pro";

export type AiSurface =
  | "executive_summary"     // dashboard narrative
  | "business_profile"      // settings / DNA summary
  | "derived_signals"       // signal-enrichment polish
  | "consultation"          // free-form Q&A advisor
  | "financial_review"      // uploaded-report review (large structured output)
  | "business_evolution";   // multi-year evolution narrative (V2)

// Tier-aware model / token / thinking config. Kept per-surface
// because each call has its own natural ceiling - a tight 3-sentence
// summary needs far fewer tokens than an open-ended consultation.
export type TierConfig = {
  model:     string;
  maxTokens: number;
  // Adaptive thinking is Opus-only in this codebase. On Haiku we omit
  // the `thinking` parameter entirely.
  thinking:  { type: "adaptive" } | null;
  // Effort (Opus): higher = deeper reasoning. Haiku ignores this - we
  // return null on Free so callers can spread the field conditionally.
  effort:    "low" | "medium" | "high" | "xhigh" | "max" | null;
  // UI-facing brand label for "who analyzed this".
  label:     string;
};

const OPUS  = "claude-opus-4-7";
const HAIKU = "claude-haiku-4-5";

const FREE_LABEL = "Pulse AI";
const PRO_LABEL  = "Strategic AI";

// Per-surface ceilings. Free is intentionally smaller so the model
// produces tighter output and inference cost stays bounded. Pro
// keeps the existing values verbatim so nothing regresses.
const SURFACE_BUDGETS: Record<AiSurface, { free: number; pro: number }> = {
  executive_summary: { free: 350,   pro: 600   },
  business_profile:  { free: 400,   pro: 600   },
  derived_signals:   { free: 300,   pro: 500   },
  consultation:      { free: 4000,  pro: 16000 },
  // The review is one large structured JSON document (4 sections +
  // forecast). A big multi-page report can run long, and on Pro the
  // adaptive-thinking tokens share this budget - so the ceiling must be
  // generous or the JSON gets truncated before its closing fence.
  financial_review:  { free: 16000, pro: 32000 },
  // Multi-year evolution narrative + DNA + strategy - also large.
  business_evolution: { free: 16000, pro: 32000 },
};

export function tierConfigFor(tier: AiTier, surface: AiSurface): TierConfig {
  const budget = SURFACE_BUDGETS[surface];
  if (tier === "pro") {
    return {
      model:     OPUS,
      maxTokens: budget.pro,
      thinking:  { type: "adaptive" },
      effort:    surface === "consultation" ? "high" : "high",
      label:     PRO_LABEL,
    };
  }
  return {
    model:     HAIKU,
    maxTokens: budget.free,
    thinking:  null,
    effort:    null,
    label:     FREE_LABEL,
  };
}

// Resolves the tier from a business id. Anything other than the "pro"
// plan key (today: free) falls back to Free tier. This includes the
// read-only state (canceled subs viewing their old data) - they
// keep getting the Pulse AI tier because their subscription isn't
// actively paying.
export async function aiTierFor(businessId: string): Promise<AiTier> {
  try {
    const plan = await getPlanFor(businessId);
    return plan === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

export async function tierConfigForBusiness(
  businessId: string,
  surface: AiSurface,
): Promise<TierConfig & { tier: AiTier }> {
  const tier = await aiTierFor(businessId);
  return { ...tierConfigFor(tier, surface), tier };
}

// Brand label only - server components pass this through to client
// components via props (this module is server-only because it
// transitively imports billing helpers).
export function aiBrandLabel(tier: AiTier): string {
  return tier === "pro" ? PRO_LABEL : FREE_LABEL;
}
