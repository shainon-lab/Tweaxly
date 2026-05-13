// Business Signals → Signals sub-tab. Random 5 from the ~15-signal advisor
// pool, re-rolled on every visit/refresh. See /business-signals/alerts for
// the threshold-rule firing list.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PushRecommendations from "@/components/PushRecommendations";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import BusinessSignalsTabs from "./BusinessSignalsTabs";

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

  const [advisorPool, mutedRows, triggeredAlerts] = await Promise.all([
    (async () => {
      const ctx = await buildBusinessContext(business.id);
      return recommendProactive(business.id, ctx);
    })(),
    prisma.mutedSignal.findMany({
      where: { businessId: business.id, mutedUntil: { gt: new Date() } },
    }),
    // Pre-compute firing alerts here too so the sub-tab badge stays
    // in sync with what the user sees on the Alerts tab.
    evaluateNotificationRules(business.id),
  ]);

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
        subtitle="The AI advisor's rotating observations — refresh the page to roll a new random set."
        right={
          <Link href="/business-signals/alerts/settings" className="btn-primary">
            Set Alerts
          </Link>
        }
      />
      <BusinessSignalsTabs
        firingAlerts={triggeredAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <PushRecommendations initial={pushRecs} currency={ccy} />
    </>
  );
}
