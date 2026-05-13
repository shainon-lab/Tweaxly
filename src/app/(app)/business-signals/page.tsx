// Business Signals tab — the AI advisor's rotating signal feed plus the
// threshold-alert box for user-defined notification rules.
//
// Previously these lived side-by-side at the top of the Overview tab; they
// got their own page so Overview can stay focused on the headline numbers.

import PageHeader from "@/components/PageHeader";
import PushRecommendations from "@/components/PushRecommendations";
import ThresholdAlertsBox from "@/components/ThresholdAlertsBox";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import { evaluateNotificationRules } from "@/lib/notificationsEval";

// Force fresh server render on every request so the visible 5 signals
// genuinely re-roll on every visit / refresh.
export const dynamic = "force-dynamic";

const MAX_VISIBLE_SIGNALS = 5;
function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  const a = arr.slice();
  for (let i = a.length - 1; i > a.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(a.length - n);
}

export default async function BusinessSignalsPage() {
  const { business } = await requireBusiness();
  const ccy = business.currency;

  const [advisorPool, mutedRows, thresholdAlerts, ruleCounts] = await Promise.all([
    (async () => {
      const ctx = await buildBusinessContext(business.id);
      return recommendProactive(business.id, ctx);
    })(),
    prisma.mutedSignal.findMany({
      where: { businessId: business.id, mutedUntil: { gt: new Date() } },
    }),
    evaluateNotificationRules(business.id),
    prisma.notificationRule.groupBy({
      by: ["enabled"],
      where: { businessId: business.id },
      _count: { _all: true },
    }),
  ]);
  const totalRules = ruleCounts.reduce((s, r) => s + r._count._all, 0);
  const enabledRules = ruleCounts.find((r) => r.enabled)?._count._all ?? 0;

  // Severity-first: any "bad" signals are always shown; the rest are a
  // uniform-random sample so the user sees variety on each visit.
  const mutedKeys = new Set(mutedRows.map((m) => m.signalKey));
  const eligible = advisorPool.filter((r) => !mutedKeys.has(r.signalKey));
  const severityOrder: Record<string, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  const sorted = [...eligible].sort(
    (a, b) => severityOrder[a.level] - severityOrder[b.level] || b.impact - a.impact,
  );
  const required = sorted.filter((r) => r.level === "bad").slice(0, MAX_VISIBLE_SIGNALS);
  const remaining = sorted.filter((r) => r.level !== "bad");
  const sampled = pickRandom(remaining, Math.max(0, MAX_VISIBLE_SIGNALS - required.length));
  const chosenSignals = [...required, ...sampled];
  const nowISO = new Date().toISOString();
  const pushRecs = chosenSignals.map((r, i) => ({
    id: `${r.signalKey}-${i}`,
    level: r.level,
    title: r.title,
    detail: r.detail,
    impact: r.impact,
    category: r.category,
    status: "active",
    createdAt: nowISO,
  }));

  return (
    <>
      <PageHeader
        title="Business Signals"
        subtitle="The AI advisor's rotating observations plus any threshold-alert rules you've set up. Refresh the page to roll a new random set of signals."
      />
      <div className="space-y-3">
        <PushRecommendations initial={pushRecs} currency={ccy} />
        <ThresholdAlertsBox
          alerts={thresholdAlerts}
          totalRules={totalRules}
          enabledRules={enabledRules}
        />
      </div>
    </>
  );
}
