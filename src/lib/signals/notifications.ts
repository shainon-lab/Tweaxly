// Signal-event -> notification dispatcher.
//
// Replaces the prior signal-snapshot dispatcher that re-fired the same
// notification every time the severity dedupe window expired. The new
// model is event-driven: exactly one notification per real change
// (created / updated / severity-changed / resolved) for every user who
// can see the workspace.
//
// Notification.sourceKey is the persisted BusinessSignal.id so the
// bell's "Open" can deeplink directly to a stable identifier even
// after the signal mutates or resolves later.

import "server-only";
import { prisma } from "@/lib/db";
import type { PersistedSignal, SignalDiff } from "./evaluator";

type EventCategory =
  | "signal_created"
  | "signal_updated"
  | "signal_severity_changed"
  | "signal_resolved";

interface NotifSpec {
  category: EventCategory;
  severity: "critical" | "important" | "info";
  sourceKey: string; // BusinessSignal.id
  title:    string;
  body:     string;
  deepLink: string;
}

// Translate the diff into one notification spec per event.
function specsFromDiff(diff: SignalDiff): NotifSpec[] {
  const specs: NotifSpec[] = [];

  for (const s of diff.created) {
    specs.push({
      category:  "signal_created",
      severity:  toNotifSeverity(s.level),
      sourceKey: s.id,
      title:     `New signal: ${s.observation}`,
      body:      s.interpretation,
      deepLink:  signalDeepLink(s.id),
    });
  }

  for (const u of diff.updated) {
    if (u.severityChanged) {
      const direction = severityRank(u.after.level) > severityRank(u.before.level) ? "escalated" : "downgraded";
      specs.push({
        category:  "signal_severity_changed",
        severity:  toNotifSeverity(u.after.level),
        sourceKey: u.after.id,
        title:     `Signal ${direction}: ${u.after.observation}`,
        body:      `Severity moved from ${severityLabel(u.before.level)} to ${severityLabel(u.after.level)}. ${u.after.interpretation}`,
        deepLink:  signalDeepLink(u.after.id),
      });
    } else {
      specs.push({
        category:  "signal_updated",
        severity:  toNotifSeverity(u.after.level),
        sourceKey: u.after.id,
        title:     `Signal updated: ${u.after.observation}`,
        body:      u.after.interpretation,
        deepLink:  signalDeepLink(u.after.id),
      });
    }
  }

  for (const s of diff.resolved) {
    specs.push({
      category:  "signal_resolved",
      severity:  "info",
      sourceKey: s.id,
      title:     `Signal resolved: ${s.observation}`,
      body:      "The underlying condition is no longer present in your data.",
      deepLink:  "/business-signals",
    });
  }

  return specs;
}

function signalDeepLink(signalId: string): string {
  // Phase 2 will introduce a detail modal opened by this query param.
  return `/business-signals?signal=${encodeURIComponent(signalId)}`;
}

function severityRank(level: PersistedSignal["level"]): number {
  return level === "bad" ? 3 : level === "warn" ? 2 : level === "good" ? 1 : 0;
}

function severityLabel(level: PersistedSignal["level"]): string {
  return level === "bad" ? "Critical"
       : level === "warn" ? "Attention"
       : level === "good" ? "Positive"
       : "Insight";
}

function toNotifSeverity(level: PersistedSignal["level"]): "critical" | "important" | "info" {
  return level === "bad" ? "critical" : level === "warn" ? "important" : "info";
}

// Write notification rows for every user who should be able to see
// the workspace. For the MVP that's the workspace owner + every
// active/suspended membership row (the Members & Access surface
// already enforces who can read the bell).
export async function dispatchSignalNotifications(businessId: string, diff: SignalDiff): Promise<{ written: number }> {
  const specs = specsFromDiff(diff);
  if (specs.length === 0) return { written: 0 };

  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      ownerId: true,
      memberships: {
        where:   { status: { in: ["active", "suspended"] } },
        select: { userId: true },
      },
    },
  });
  if (!biz) return { written: 0 };

  const userIds = new Set<string>([biz.ownerId, ...biz.memberships.map((m) => m.userId)]);

  let written = 0;
  for (const spec of specs) {
    for (const userId of userIds) {
      // Belt-and-braces dedupe: the diff itself should only ever
      // contain real change events, but a concurrent retry could
      // produce the same spec twice in a narrow window. Skip if a
      // notification with the same (userId, source, sourceKey,
      // category) already exists within the last 60 seconds.
      const recent = await prisma.alertNotification.findFirst({
        where: {
          userId,
          source:    "signal",
          sourceKey: spec.sourceKey,
          category:  spec.category,
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
        select: { id: true },
      });
      if (recent) continue;

      await prisma.alertNotification.create({
        data: {
          userId,
          businessId,
          source:    "signal",
          sourceKey: spec.sourceKey,
          category:  spec.category,
          severity:  spec.severity,
          title:     spec.title,
          body:      spec.body,
          deepLink:  spec.deepLink,
        },
      });
      written++;
    }
  }

  return { written };
}
