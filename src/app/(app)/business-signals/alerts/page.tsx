// Business Signals → Monitor sub-tab. Threshold notification rules that
// are currently over their limits, plus an inline "Monitor Events" panel
// that surfaces the full notification-rule manager — collapsing the
// formerly-separate /notifications page into this tab.

import PageHeader from "@/components/PageHeader";
import ThresholdAlertsBox from "@/components/ThresholdAlertsBox";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { evaluateAndStampNotificationRules } from "@/lib/notificationsEval";
import BusinessSignalsTabs from "../BusinessSignalsTabs";

export const dynamic = "force-dynamic";

export default async function BusinessSignalsMonitorPage() {
  const { business } = await requireBusiness();

  const [thresholdAlerts, rules, categoriesRaw] = await Promise.all([
    evaluateAndStampNotificationRules(business.id),
    prisma.notificationRule.findMany({
      where: { businessId: business.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
  ]);
  const totalRules = rules.length;
  const enabledRules = rules.filter((r) => r.enabled).length;
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);

  return (
    <>
      <PageHeader
        title="Business Signals"
        subtitle="Monitor — threshold rules that have crossed their limits, plus the rule editor inline below."
      />
      <BusinessSignalsTabs
        firingAlerts={thresholdAlerts.filter((a) => a.acknowledgedAt == null).length}
      />
      <ThresholdAlertsBox
        alerts={thresholdAlerts}
        totalRules={totalRules}
        enabledRules={enabledRules}
        currency={business.currency}
        rules={rules.map((r) => ({
          id: r.id,
          metric: r.metric,
          categoryId: r.categoryId,
          categoryName: r.category?.name ?? null,
          direction: r.direction,
          thresholdType: r.thresholdType,
          thresholdValue: r.thresholdValue,
          period: r.period,
          label: r.label,
          enabled: r.enabled,
          createdAt: r.createdAt.toISOString(),
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
      />
    </>
  );
}
