// Business Signals → Signals sub-tab. Deterministic top-N per severity
// from the ~15-signal advisor pool, ranked by monthly $ impact. Signals
// change only when the underlying data / lifecycle change, not on every
// refresh. See /business-signals/alerts for the threshold-rule firing list.

import PageHeader from "@/components/PageHeader";
import { getServerT } from "@/lib/i18n/server";
import PushRecommendations from "@/components/PushRecommendations";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import { getQuota, getPlanFor } from "@/lib/billing";
import LockedOverlay from "@/components/billing/LockedOverlay";
import BusinessSignalsTabs from "./BusinessSignalsTabs";
import { sweepAndDispatch } from "@/lib/alerts/sweep";

export const dynamic = "force-dynamic";

// Per-row cap. The Business Signals view renders three rows of cards
// grouped by severity (urgent · positive · context), so we surface up
// to N signals per row to fit a 3-column grid cleanly.
const MAX_PER_GROUP = 3;

export default async function BusinessSignalsPage() {
  const { user, business } = await requireBusiness();
  const ccy = business.currency;
  // Phase-4 Alerts dispatcher (5-min throttled inside the lib).
  void sweepAndDispatch(user.id, business.id).catch(() => {});

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
  //   Critical  - level "bad"
  //   Attention - level "warn"
  //   Positive  - level "good"
  //   Insight   - level "info"
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
    signalKey: r.signalKey,
    level: r.level,
    observation: r.observation,
    interpretation: r.interpretation,
    recommendation: r.recommendation,
    impact: r.impact,
    category: r.category,
    status: "active",
    createdAt: nowISO,
  }));

  // Plan gate: Free users see the top N signals only; everything
  // beyond that renders blurred behind a LockedOverlay so they can
  // see HOW MUCH more is waiting on Pro without being able to read
  // it. Pro/Business get the full list (signalsPerMonth = "unlimited").
  const signalsQuota = await getQuota(business.id, "signalsPerMonth");
  const currentPlan  = await getPlanFor(business.id);
  const limited      = signalsQuota !== "unlimited";
  const visibleRecs  = limited ? pushRecs.slice(0, signalsQuota) : pushRecs;
  const lockedRecs   = limited ? pushRecs.slice(signalsQuota)    : [];

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
      <PushRecommendations initial={visibleRecs} currency={ccy} />
      {lockedRecs.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {lockedRecs.length} more signal{lockedRecs.length === 1 ? "" : "s"} waiting on Pro
          </div>
          <LockedOverlay
            locked
            feature="Unlimited AI Business Signals"
            plan={currentPlan}
            blurb={`Free plans show ${typeof signalsQuota === "number" ? signalsQuota : ""} signals per month. Upgrade to unlock every signal Tweaxly detects.`}
            benefits={[
              "Every business signal Tweaxly detects, unblurred",
              "Smart alerts on top of the signal stream",
              "Action-oriented recommendations on every signal",
              "Plus full forecasting, exports, and 500 AI Credits / month",
            ]}
          >
            <PushRecommendations initial={lockedRecs} currency={ccy} />
          </LockedOverlay>
        </div>
      ) : null}
    </>
  );
}
