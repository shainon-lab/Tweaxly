// Business Signals → Signals sub-tab.
//
// Signals are now persisted, lifecycle-tracked, and capped per plan at
// evaluation time. This page just READS the workspace's current
// active + acknowledged signals; the deterministic evaluator runs
// from sweepAndDispatch (kicked off in the background on this render)
// and is what writes / updates / resolves rows.
//
// One signal = one BusinessSignal row. Notifications fire only on
// real change events (created / updated / severity-changed / resolved),
// not on every page render. See src/lib/signals/* for the engine.

import PageHeader from "@/components/PageHeader";
import { getServerT } from "@/lib/i18n/server";
import PushRecommendations, { type PushRec } from "@/components/PushRecommendations";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import { getPlanFor } from "@/lib/billing";
import EmptyDataPreview from "@/components/EmptyDataPreview";
import BusinessSignalsTabs from "./BusinessSignalsTabs";
import { sweepAndDispatch } from "@/lib/alerts/sweep";
import { listActiveSignals, planSignalCap } from "@/lib/signals/evaluator";
import SignalsExplanation from "./SignalsExplanation";

export const dynamic = "force-dynamic";

export default async function BusinessSignalsPage() {
  const { user, business } = await requireBusiness();
  const ccy = business.currency;
  // Background sweep: persists / diffs / dispatches notifications on
  // real change events. Throttled to once per 5 minutes inside the lib.
  void sweepAndDispatch(user.id, business.id).catch(() => {});

  // Empty-state short-circuit: no transactions = no meaningful signals.
  const totalTxnCount = await prisma.transaction.count({
    where: { businessId: business.id },
  });
  if (totalTxnCount === 0) {
    const { t } = await getServerT();
    return (
      <>
        <PageHeader
          title={t("page.signals.title")}
          subtitle={t("page.signals.subtitle")}
        />
        <BusinessSignalsTabs firingAlerts={0} />
        <EmptyDataPreview surface="signals" />
      </>
    );
  }

  const [activeSignals, triggeredAlerts, plan] = await Promise.all([
    listActiveSignals(business.id),
    evaluateNotificationRules(business.id),
    getPlanFor(business.id),
  ]);
  const cap = planSignalCap(plan);

  // Convert persisted BusinessSignal rows to the PushRec shape the
  // existing card UI expects. We pass the BusinessSignal.id through
  // as PushRec.id so the Mark-as-Read / Mark-as-Resolved actions can
  // round-trip to /api/signals/[id].
  const pushRecs: PushRec[] = activeSignals.map((s) => ({
    id:             s.id,
    signalKey:      s.signalKey,
    level:          s.level,
    observation:    s.observation,
    interpretation: s.interpretation,
    recommendation: s.recommendation,
    impact:         s.impact,
    category:       s.category,
    status:         s.status,
    createdAt:      s.firstSeenAt.toISOString(),
  }));

  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("page.signals.title")}
        subtitle={t("page.signals.subtitle")}
      />
      <BusinessSignalsTabs
        firingAlerts={triggeredAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <SignalsExplanation
        plan={plan}
        cap={cap}
        activeCount={activeSignals.length}
      />
      <PushRecommendations initial={pushRecs} currency={ccy} />
    </>
  );
}
