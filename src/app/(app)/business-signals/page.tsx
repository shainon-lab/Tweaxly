// Business Signals → Signals sub-tab. Random 5 from the ~15-signal advisor
// pool, re-rolled on every visit/refresh. See /business-signals/alerts for
// the threshold-rule firing list.

import PageHeader from "@/components/PageHeader";
import PushRecommendations from "@/components/PushRecommendations";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import BusinessSignalsTabs from "./BusinessSignalsTabs";

export const dynamic = "force-dynamic";

// Per-row cap. The Business Signals view renders three rows of cards
// grouped by severity (urgent · positive · context), so we surface up
// to N signals per row to fit a 3-column grid cleanly.
const MAX_PER_GROUP = 3;

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
  // Four severity buckets, each its own row in the UI:
  //   Critical  — level "bad"
  //   Attention — level "warn"
  //   Positive  — level "good"
  //   Insight   — level "info"
  // Within a row, impact descending. Rows with zero items collapse out.
  const byImpact = (a: typeof eligible[number], b: typeof eligible[number]) => b.impact - a.impact;
  const critical  = eligible.filter((r) => r.level === "bad" ).sort(byImpact).slice(0, MAX_PER_GROUP);
  const attention = eligible.filter((r) => r.level === "warn").sort(byImpact).slice(0, MAX_PER_GROUP);
  const positive  = eligible.filter((r) => r.level === "good").sort(byImpact).slice(0, MAX_PER_GROUP);
  const insight   = eligible.filter((r) => r.level === "info").sort(byImpact).slice(0, MAX_PER_GROUP);
  const chosenSignals = [...critical, ...attention, ...positive, ...insight];
  const nowISO = new Date().toISOString();
  const pushRecs = chosenSignals.map((r, i) => ({
    id: `${r.signalKey}-${i}`,
    level: r.level,
    observation: r.observation,
    interpretation: r.interpretation,
    recommendation: r.recommendation,
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
      />
      <BusinessSignalsTabs
        firingAlerts={triggeredAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <PushRecommendations initial={pushRecs} currency={ccy} />
    </>
  );
}
