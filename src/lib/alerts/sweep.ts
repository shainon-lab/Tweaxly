// Phase-4 dispatcher. Sweeps AI signals + firing monitors for one
// user×business and writes any NEW fires to AlertNotification (which
// dispatchAlert also fires push for, when the user has push on).
//
// Idempotent + throttled:
//   • A 5-minute sweep throttle prevents repeated work on hot pages.
//   • Per-source dedup against AlertNotification within a recency
//     window keyed to severity (critical = 6h, important = 12h, info
//     = 24h) so the same signal can't pile up across navigations.
//   • Per-user preferences honoured: category toggle, quiet hours
//     (non-critical delayed; critical-bypass when enabled), daily
//     limit (critical always bypasses).
//
// Safe to call inline from any server-side render that has the user
// + business handy. Errors are swallowed so the host page never 500s
// because of an alert side-effect.

import { prisma } from "../db";
import { evaluateNotificationRules, type TriggeredAlert } from "../notificationsEval";
import { dispatchAlert } from "./dispatch";
import type { AlertCategory, AlertSeverity } from "./types";
import { evaluateSignals } from "../signals/evaluator";
import { dispatchSignalNotifications } from "../signals/notifications";

const SWEEP_THROTTLE_MS = 5 * 60_000;
const DEDUP_WINDOW_MS: Record<AlertSeverity, number> = {
  critical:  6  * 60 * 60_000,
  important: 12 * 60 * 60_000,
  info:      24 * 60 * 60_000,
};

export async function sweepAndDispatch(
  userId: string,
  businessId: string,
): Promise<{ skipped: boolean; dispatched: number }> {
  try {
    // 0. Premium gate. Notifications (the whole alerts pipeline - bell,
    // push, email) are a paid-plan feature; free workspaces never sweep
    // and never accumulate notifications. The fetch is cheap (one
    // wallet/subscription row) and runs before throttle so we never
    // even write a lastSweepAt for free workspaces.
    const { getEffectivePlan } = await import("@/lib/billing");
    const plan = await getEffectivePlan(businessId).catch(() => null);
    if (!plan || plan.plan === "free") {
      return { skipped: true, dispatched: 0 };
    }

    // 1. Throttle - skip work if a sweep ran recently.
    const prefRow = await prisma.alertPreference.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (prefRow?.lastSweepAt && Date.now() - prefRow.lastSweepAt.getTime() < SWEEP_THROTTLE_MS) {
      return { skipped: true, dispatched: 0 };
    }

    // Mark the sweep timestamp up-front so concurrent renders bail
    // out instead of double-dispatching.
    await prisma.alertPreference.upsert({
      where:  { userId_businessId: { userId, businessId } },
      create: { userId, businessId, lastSweepAt: new Date() },
      update: { lastSweepAt: new Date() },
    });

    // 2. Signals: persistent evaluator + diff-based dispatch.
    //
    // The signal pipeline is now event-driven, not snapshot-driven:
    // evaluateSignals() persists the current signal set and returns a
    // structured diff (created / updated / severity_changed / resolved).
    // dispatchSignalNotifications() emits ONE AlertNotification row per
    // real change. The 5-minute throttle above already keeps DB load
    // sane on hot pages; the diff itself ensures we never re-emit a
    // notification for a signal that is simply still present.
    let dispatched = 0;
    try {
      const diff = await evaluateSignals(businessId);
      const out  = await dispatchSignalNotifications(businessId, diff);
      dispatched += out.written;
    } catch (err) {
      console.error("[sweep] signal evaluation/dispatch failed", err);
    }

    // 3. Monitor fires + coverage gaps still go through the legacy
    // window-based dispatcher. They benefit from the per-severity
    // dedupe window because the underlying rules are inherently
    // "still firing today" style. Load the user's prefs so the legacy
    // tryDispatch can honour category gate / quiet hours / daily cap.
    const fires = await evaluateNotificationRules(businessId).catch(() => [] as TriggeredAlert[]);

    const prefs = await prisma.alertPreference.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    const categories = (prefs?.categories as Record<AlertCategory, boolean> | null) ?? null;
    const quietActive = inQuietHours(prefs);
    const dailyLimit  = prefs?.dailyLimit ?? 15;
    const criticalBypass = prefs?.criticalBypass ?? true;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let dispatchedToday = await prisma.alertNotification.count({
      where: { userId, businessId, createdAt: { gte: startOfToday } },
    });

    const tryDispatch = async (params: {
      sourceKey: string;
      source:    "signal" | "monitor";
      category:  AlertCategory;
      severity:  AlertSeverity;
      title:     string;
      body:      string;
      deepLink?: string;
      channels?: { push?: boolean; inApp?: boolean; email?: boolean };
    }) => {
      if (params.severity !== "critical") {
        if (categories && categories[params.category] === false) return;
      }
      if (quietActive) {
        if (params.severity !== "critical" || !criticalBypass) return;
      }
      if (params.severity !== "critical" && dispatchedToday >= dailyLimit) return;

      const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS[params.severity]);
      const existing = await prisma.alertNotification.findFirst({
        where: {
          userId, businessId,
          source: params.source, sourceKey: params.sourceKey,
          createdAt: { gte: windowStart },
        },
        select: { id: true },
      });
      if (existing) return;

      await dispatchAlert({
        userId, businessId,
        source:    params.source,
        sourceKey: params.sourceKey,
        category:  params.category,
        severity:  params.severity,
        title:     params.title,
        body:      params.body,
        deepLink:  params.deepLink ?? null,
        channels:  params.channels,
      });
      dispatched++;
      dispatchedToday++;
    };

    // ── Monitor fires ───────────────────────────────────────────
    // Cross-reference each firing rule with its DB row so we get the
    // user-chosen severity + channel preferences.
    const ruleIds = fires.map((f) => f.ruleId);
    const rules = ruleIds.length === 0 ? [] : await prisma.notificationRule.findMany({
      where: { id: { in: ruleIds }, businessId },
    });
    const ruleById = new Map(rules.map((r) => [r.id, r]));

    for (const f of fires) {
      const rule = ruleById.get(f.ruleId);
      const severity = (rule?.severity as AlertSeverity | undefined) ?? mapLevelToSeverity(f.level);
      const category: AlertCategory = "custom_monitor";
      const title = rule?.label?.trim() || f.headline;
      const body  = compressLine(f.detail, 220);
      const channels = (rule?.notificationChannels as { push?: boolean; inApp?: boolean; email?: boolean } | null | undefined) ?? undefined;
      await tryDispatch({
        sourceKey: f.ruleId,
        source:    "monitor",
        category,
        severity,
        title,
        body,
        deepLink:  "/business-signals/alerts",
        channels,
      });
    }

    // ── Data coverage gaps ──────────────────────────────────────
    // For each active financial source, check whether the PREVIOUS
    // full month was uploaded. Emits one alert per (source, month);
    // the per-severity dedup window keeps it from re-firing every
    // sweep until the user uploads.
    try {
      const prevYM = previousFullYm();
      const activeSources = await prisma.financialSource.findMany({
        where: { businessId, status: "active" },
        select: { id: true, name: true, startMonth: true },
      });
      const inWindow = activeSources.filter((s) => s.startMonth <= prevYM);
      if (inWindow.length > 0) {
        const covered = await prisma.uploadBatch.findMany({
          where: {
            businessId,
            status: "active",
            financialSourceId: { in: inWindow.map((s) => s.id) },
            periodStart: { lte: prevYM },
            periodEnd:   { gte: prevYM },
          },
          select: { financialSourceId: true },
        });
        const coveredIds = new Set(covered.map((b) => b.financialSourceId));
        for (const s of inWindow) {
          if (coveredIds.has(s.id)) continue;
          await tryDispatch({
            sourceKey: `coverage_gap:${s.id}:${prevYM}`,
            source:    "signal",
            category:  "data_coverage",
            severity:  "important",
            title:     `${s.name} is missing ${humanYM(prevYM)}`,
            body:      `Upload last month's statement so reports and the AI advisor stay accurate.`,
            deepLink:  "/manual-data",
          });
        }
      }
    } catch (err) {
      console.error("[alerts.sweep] coverage check failed", { userId, businessId, err });
    }

    return { skipped: false, dispatched };
  } catch (err) {
    console.error("[alerts.sweep] failed", { userId, businessId, err });
    return { skipped: false, dispatched: 0 };
  }
}

// ────────────────────────────────────────────────────────────────────

function mapLevelToSeverity(level: TriggeredAlert["level"]): AlertSeverity {
  if (level === "bad")  return "critical";
  if (level === "warn") return "important";
  return "info";
}

function compressLine(s: string, max: number): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// True when the user has quiet hours enabled AND the current time in
// their declared timezone falls inside the window. Handles wrap-
// around windows (e.g. 22:00→07:00).
function inQuietHours(p: { quietHoursEnabled: boolean; quietHoursStart: string | null; quietHoursEnd: string | null; quietHoursTimezone: string | null } | null): boolean {
  if (!p?.quietHoursEnabled || !p.quietHoursStart || !p.quietHoursEnd) return false;
  const tz = p.quietHoursTimezone ?? "UTC";
  let nowHHMM: string;
  try {
    nowHHMM = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date());
  } catch {
    nowHHMM = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date());
  }
  const cur = hhmmToMinutes(nowHHMM);
  const start = hhmmToMinutes(p.quietHoursStart);
  const end   = hhmmToMinutes(p.quietHoursEnd);
  if (start === end) return false;
  if (start < end) {
    // Same-day window (e.g. 13:00→18:00).
    return cur >= start && cur < end;
  }
  // Wrap-around window (e.g. 22:00→07:00).
  return cur >= start || cur < end;
}

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h * 60) + (m ?? 0);
}

// Previous full month (e.g. on 2026-05-23 → "2026-04"). What the
// coverage-gap check considers "should be uploaded by now".
function previousFullYm(): string {
  const d = new Date();
  d.setUTCDate(1);                       // safe arithmetic in UTC
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "2026-04" → "April 2026" for human-readable alert titles.
function humanYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
