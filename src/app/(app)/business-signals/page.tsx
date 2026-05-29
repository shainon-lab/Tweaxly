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
import HowItWorks from "@/components/HowItWorks";
import { BadgeCheck, CheckCircle2, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ signal?: string }>;
}) {
  const { user, business } = await requireBusiness();
  const sp = await searchParams;
  // ?signal=<BusinessSignal.id> opens the detail panel for that
  // signal on first render. Bell notification deeplinks use this so
  // the user lands on the actual content, not a generic list.
  const openSignalId = typeof sp.signal === "string" ? sp.signal : null;
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

  // Bell notification deep-link recovery. If the URL says
  // ?signal=<id> but the active list doesn't contain it (because
  // the signal has since been resolved / archived), look the row up
  // directly so View Details from the notification still opens the
  // correct content. The matched row is appended to pushRecs only
  // when it's absent - active signals already in pushRecs come from
  // the same source of truth.
  let deeplinkedSignalId: string | null = openSignalId;
  if (openSignalId && !pushRecs.some((r) => r.id === openSignalId)) {
    const orphan = await prisma.businessSignal.findUnique({
      where: { id: openSignalId },
    });
    if (orphan && orphan.businessId === business.id) {
      pushRecs.push({
        id:             orphan.id,
        signalKey:      orphan.signalKey,
        level:          orphan.level,
        observation:    orphan.observation,
        interpretation: orphan.interpretation,
        recommendation: orphan.recommendation,
        impact:         orphan.impact,
        category:       orphan.category,
        status:         orphan.status,
        createdAt:      orphan.firstSeenAt.toISOString(),
      });
    } else {
      // Stale link (signal belongs to a different workspace or was
      // hard-deleted). Drop the request so the URL-cleanup hook can
      // remove the dead query param.
      deeplinkedSignalId = null;
    }
  }

  const planLabel = plan === "pro" ? "Pro" : "Free";
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("page.signals.title")}
        subtitle={t("page.signals.subtitle")}
        right={
          <HowItWorks
            title="How your business signals work"
            subtitle={`${activeSignals.length} of ${cap} active · ${planLabel} plan`}
            intro={`Signals are the most important business observations from your data right now. We only show signals that pass our importance threshold - if there's nothing meaningful to flag, slots stay empty. The ${planLabel} plan tops out at ${cap} active signals at a time.`}
            cards={[
              { icon: <BadgeCheck size={16} strokeWidth={1.7} />,  title: "Mark as read",     body: "You've seen this insight. The signal stays in the list, just visually muted, until the underlying condition changes or you resolve it." },
              { icon: <CheckCircle2 size={16} strokeWidth={1.7} />, title: "Mark as resolved", body: "You're closing this out. The signal is removed from the active list. If the same condition re-appears later, a brand-new signal opens automatically." },
              { icon: <RefreshCw size={16} strokeWidth={1.7} />,    title: "Refresh signals",  body: "Triggers a fresh AI analysis and uses 3 AI credits from your balance. Automatic updates (after data uploads or the weekly re-evaluation) are always free." },
            ]}
            outro={<><strong className="text-slate-300">Signals vs. notifications.</strong> Signals are the current state of your business. The bell shows notifications - events that happened to a signal. You get notified when a signal is created, updated, escalated, or resolved. We never repeat a notification for a signal that&apos;s simply still present.</>}
          />
        }
      />
      <BusinessSignalsTabs
        firingAlerts={triggeredAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <PushRecommendations initial={pushRecs} currency={ccy} initialSelectedId={deeplinkedSignalId} />
    </>
  );
}
