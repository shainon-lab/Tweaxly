// Business Signals → Alerts → Set Alerts. Configure the threshold-rule
// notifications that drive the firing-alerts list on /business-signals/alerts.
// Reuses NotificationsClient — the rule editor lives in /notifications and
// we render it here so users can manage rules without leaving the Business
// Signals umbrella.

import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import NotificationsClient from "../../../notifications/NotificationsClient";
import BusinessSignalsTabs from "../../BusinessSignalsTabs";
import { evaluateNotificationRules } from "@/lib/notificationsEval";

export const dynamic = "force-dynamic";

export default async function AlertSettingsPage() {
  const { business } = await requireBusiness();
  const [rules, categoriesRaw, triggered] = await Promise.all([
    prisma.notificationRule.findMany({
      where: { businessId: business.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { businessId: business.id } }),
    evaluateNotificationRules(business.id),
  ]);
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);
  const firingUnack = triggered.filter((a) => a.acknowledgedAt == null).length;
  return (
    <>
      <PageHeader
        title="Business Signals"
        subtitle="Set the threshold rules that trigger alerts on the Alerts tab — revenue dips, expense spikes, or any specific category crossing a threshold."
      />
      <BusinessSignalsTabs firingAlerts={firingUnack} />
      <NotificationsClient
        currency={business.currency}
        initialRules={rules.map((r) => ({
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
