// Persistent signal evaluator.
//
// Replaces the prior "recompute from advisor on every page load, never
// store" model. The flow is:
//
//   1. Run the deterministic recommendProactive() against the current
//      business context.
//   2. Apply plan caps + importance threshold to the candidate set so
//      we only ever surface the top-N high-quality signals (3 for
//      Free, 6 for Pro). Quality > quantity - empty slots stay empty
//      when there's nothing meaningful to show.
//   3. Diff the kept candidates against the workspace's currently
//      "open" BusinessSignal rows (active + acknowledged).
//        - candidate signalKey not in open set       -> created event
//        - open signalKey not in candidate set       -> resolved event
//        - both: compare level + impact + text       -> updated event
//                                                      or no-op
//   4. Persist the updates (insert new rows, mark resolved rows,
//      update existing on real change, bump lastSeenAt + evaluationCount
//      on every match so we know it survived the latest eval).
//   5. Return the diff so the caller can emit notifications. The
//      evaluator itself never writes notifications - that's the
//      dispatcher's job, decoupled here so the same diff can be
//      reused by callers that want signals only (e.g. the future
//      manual-refresh flow).
//
// Read-only by design. Zero AI credits consumed - the underlying
// signal generator is rule-based arithmetic over BusinessContext.

import "server-only";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive, type AdvisorRecommendation } from "@/lib/advisor";
import { getPlanFor } from "@/lib/billing";

// Per-plan cap on simultaneously-active signals. Pro tier is 6 today;
// the FUTURE_PREMIUM > 6 expansion is reserved and not exposed yet.
const PLAN_CAPS: Record<string, number> = {
  free:     3,
  pro:      6,
  business: 6,
};

// Importance threshold. A candidate must score at or above this to
// occupy a slot. This is what enforces "never fill slots with weak
// signals" from the product spec - if only two candidates clear the
// bar, the workspace shows two signals.
const MIN_IMPORTANCE_SCORE = 30;

// Per-level base score. "bad" signals (e.g. cash flow risk) clear the
// threshold even when their dollar impact rounds to zero. Observational
// "info" signals need real magnitude to make the cut.
const LEVEL_BASE: Record<AdvisorRecommendation["level"], number> = {
  bad:  90,
  warn: 60,
  good: 35,
  info: 10,
};

function importanceScore(c: AdvisorRecommendation): number {
  const base = LEVEL_BASE[c.level] ?? 0;
  // Diminishing-returns weighting on dollar impact so a $5K signal
  // doesn't dominate a $50K one by a factor of 10. log1p keeps the
  // small-impact case alive (info signals with impact=0 keep their
  // base level score; large impact contributes meaningfully).
  const mag = Math.log1p(Math.max(0, Math.abs(c.impact))) * 6;
  return base + mag;
}

export interface SignalDiff {
  // Newly opened rows (no prior active row for this signalKey).
  created:  PersistedSignal[];
  // Existing rows whose level / impact / text changed materially.
  updated:  Array<{ before: PersistedSignal; after: PersistedSignal; severityChanged: boolean }>;
  // Open rows the latest evaluation didn't produce -> system-resolved.
  resolved: PersistedSignal[];
  // Open rows that survived unchanged (just bumped lastSeenAt).
  unchanged: PersistedSignal[];
  // The final "active + acknowledged" set after this evaluation, in
  // ranking order, capped at the plan limit.
  current:  PersistedSignal[];
}

export interface PersistedSignal {
  id:              string;
  signalKey:       string;
  level:           AdvisorRecommendation["level"];
  impact:          number;
  observation:     string;
  interpretation:  string;
  recommendation:  string;
  category:        AdvisorRecommendation["category"];
  status:          "active" | "acknowledged" | "resolved" | "archived";
  firstSeenAt:     Date;
  lastSeenAt:      Date;
}

export async function evaluateSignals(businessId: string): Promise<SignalDiff> {
  const ctx = await buildBusinessContext(businessId);
  const allCandidates = await recommendProactive(businessId, ctx);

  const plan = await getPlanFor(businessId);
  const cap  = PLAN_CAPS[plan] ?? PLAN_CAPS.free;

  // 1. Score, filter to threshold, rank by score desc, cap to plan.
  const ranked = allCandidates
    .map((c) => ({ c, score: importanceScore(c) }))
    .filter((x) => x.score >= MIN_IMPORTANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
    .map((x) => x.c);
  const rankedByKey = new Map(ranked.map((c) => [c.signalKey, c]));

  // 2. Load currently-open rows (active + acknowledged). Resolved
  //    rows from past evaluations are intentionally excluded - if the
  //    same signalKey shows up again, we open a brand-new row so the
  //    timeline is honest.
  const openRows = await prisma.businessSignal.findMany({
    where:   { businessId, status: { in: ["active", "acknowledged"] } },
    orderBy: { createdAt: "asc" },
  });
  const openByKey = new Map(openRows.map((r) => [r.signalKey, r]));

  const now = new Date();
  const created:  PersistedSignal[] = [];
  const updated:  SignalDiff["updated"] = [];
  const resolved: PersistedSignal[] = [];
  const unchanged: PersistedSignal[] = [];

  // 3. Process candidates against the open set.
  for (const c of ranked) {
    const existing = openByKey.get(c.signalKey);
    if (!existing) {
      const row = await prisma.businessSignal.create({
        data: {
          businessId,
          signalKey:      c.signalKey,
          level:          c.level,
          impact:         c.impact,
          observation:    c.observation,
          interpretation: c.interpretation,
          recommendation: c.recommendation,
          category:       c.category,
          status:         "active",
          firstSeenAt:    now,
          lastSeenAt:     now,
        },
      });
      created.push(toPersisted(row));
      continue;
    }

    const before = toPersisted(existing);
    const severityChanged = existing.level !== c.level;
    const impactChanged   = Math.abs(existing.impact - c.impact) > 0.01;
    const textChanged     =
      existing.observation    !== c.observation ||
      existing.interpretation !== c.interpretation ||
      existing.recommendation !== c.recommendation;
    const changed = severityChanged || impactChanged || textChanged;

    if (changed) {
      const row = await prisma.businessSignal.update({
        where: { id: existing.id },
        data: {
          level:           c.level,
          impact:          c.impact,
          observation:     c.observation,
          interpretation:  c.interpretation,
          recommendation:  c.recommendation,
          // Severity change should re-activate an acknowledged signal -
          // the user previously said "I get it" about the old level;
          // the new level is a new event worth their attention.
          status:          severityChanged && existing.status === "acknowledged" ? "active" : existing.status,
          // Severity change clears the prior "I got it" stamp so the
          // explanation panel can flag the row as fresh again.
          acknowledgedAt:  severityChanged ? null : existing.acknowledgedAt,
          lastSeenAt:      now,
          evaluationCount: existing.evaluationCount + 1,
        },
      });
      updated.push({ before, after: toPersisted(row), severityChanged });
    } else {
      const row = await prisma.businessSignal.update({
        where: { id: existing.id },
        data:  { lastSeenAt: now, evaluationCount: existing.evaluationCount + 1 },
      });
      unchanged.push(toPersisted(row));
    }
  }

  // 4. Anything in the open set that the latest evaluation did NOT
  //    produce is system-resolved. We do not delete - we mark resolved
  //    so the user has a history (and the bell notification can read
  //    the resolved title later if needed).
  for (const existing of openRows) {
    if (rankedByKey.has(existing.signalKey)) continue;
    const before = toPersisted(existing);
    await prisma.businessSignal.update({
      where: { id: existing.id },
      data: {
        status:     "resolved",
        resolvedAt: now,
        resolvedBy: "system",
      },
    });
    resolved.push(before);
  }

  // 5. Compose the final current set in ranking order.
  const current: PersistedSignal[] = [];
  for (const c of ranked) {
    const row = openByKey.get(c.signalKey);
    if (row) {
      // Fresh state for the row we just touched - read from local
      // diffs rather than another DB hit.
      const u = updated.find((u) => u.after.id === row.id);
      if (u) { current.push(u.after); continue; }
      const un = unchanged.find((u) => u.id === row.id);
      if (un) { current.push(un); continue; }
    }
    const cr = created.find((cr) => cr.signalKey === c.signalKey);
    if (cr) current.push(cr);
  }

  return { created, updated, resolved, unchanged, current };
}

function toPersisted(r: {
  id:             string;
  signalKey:      string;
  level:          string;
  impact:         number;
  observation:    string;
  interpretation: string;
  recommendation: string;
  category:       string;
  status:         string;
  firstSeenAt:    Date;
  lastSeenAt:     Date;
}): PersistedSignal {
  return {
    id:              r.id,
    signalKey:       r.signalKey,
    level:           r.level as PersistedSignal["level"],
    impact:          r.impact,
    observation:     r.observation,
    interpretation:  r.interpretation,
    recommendation:  r.recommendation,
    category:        r.category as PersistedSignal["category"],
    status:          r.status as PersistedSignal["status"],
    firstSeenAt:     r.firstSeenAt,
    lastSeenAt:      r.lastSeenAt,
  };
}

// Read helper for callers that need the current state without
// re-running the evaluator. Used by the signals page on every render
// (the evaluator runs from sweepAndDispatch independently).
export async function listActiveSignals(businessId: string): Promise<PersistedSignal[]> {
  const plan = await getPlanFor(businessId);
  const cap  = PLAN_CAPS[plan] ?? PLAN_CAPS.free;
  const rows = await prisma.businessSignal.findMany({
    where:   { businessId, status: { in: ["active", "acknowledged"] } },
    orderBy: [{ status: "asc" }, { impact: "desc" }],
    take:    cap,
  });
  return rows.map(toPersisted);
}

export function planSignalCap(plan: string): number {
  return PLAN_CAPS[plan] ?? PLAN_CAPS.free;
}
