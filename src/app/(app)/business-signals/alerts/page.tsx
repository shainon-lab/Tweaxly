// Business Signals → Alerts sub-tab. Threshold notification rules that
// are currently over their limits. The empty-state copy already covers
// "no rules", "rules but none enabled", and "all clear", so this page
// just delegates to ThresholdAlertsBox.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ThresholdAlertsBox from "@/components/ThresholdAlertsBox";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateAndStampNotificationRules } from "@/lib/notificationsEval";
import BusinessSignalsTabs from "../BusinessSignalsTabs";

export const dynamic = "force-dynamic";

export default async function BusinessSignalsAlertsPage() {
  const { business } = await requireBusiness();

  const [thresholdAlerts, ruleCounts] = await Promise.all([
    evaluateAndStampNotificationRules(business.id),
    prisma.notificationRule.groupBy({
      by: ["enabled"],
      where: { businessId: business.id },
      _count: { _all: true },
    }),
  ]);
  const totalRules = ruleCounts.reduce((s, r) => s + r._count._all, 0);
  const enabledRules = ruleCounts.find((r) => r.enabled)?._count._all ?? 0;

  return (
    <>
      <PageHeader
        title="Business Signals"
        subtitle="Threshold rules — when one of your watched metrics crosses its limit, the breach lands here."
        right={
          <Link href="/business-signals/alerts/settings" className="btn-primary">
            Set Alerts
          </Link>
        }
      />
      <BusinessSignalsTabs
        firingAlerts={thresholdAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <ThresholdAlertsBox
        alerts={thresholdAlerts}
        totalRules={totalRules}
        enabledRules={enabledRules}
      />
    </>
  );
}
