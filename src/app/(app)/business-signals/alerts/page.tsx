// Business Signals → Monitor sub-tab. Threshold notification rules that
// are currently over their limits, plus an inline "Monitor Events" panel
// that surfaces the full notification-rule manager - collapsing the
// formerly-separate /notifications page into this tab.

import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import ThresholdAlertsBox from "@/components/ThresholdAlertsBox";
import { Bell, Sliders, BellRing } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { evaluateAndStampNotificationRules } from "@/lib/notificationsEval";
import BusinessSignalsTabs from "../BusinessSignalsTabs";
import { sweepAndDispatch } from "@/lib/alerts/sweep";

export const dynamic = "force-dynamic";

export default async function BusinessSignalsMonitorPage() {
  const { user, business } = await requireBusiness();
  // Phase-4 Alerts dispatcher (5-min throttled inside the lib).
  void sweepAndDispatch(user.id, business.id).catch(() => {});

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
        title="Signals"
        subtitle="Monitor - threshold rules that have crossed their limits, plus the rule editor inline below."
        help={
          <HowItWorks
            title="How the Monitor tab works"
            intro="Build your own threshold rules that fire when revenue, expenses, profit, or any specific category crosses a limit you choose. Monitor rules are separate from the AI-generated signals - the AI watches the business broadly; Monitor watches the specific numbers you care about."
            cards={[
              { icon: <Sliders size={16} strokeWidth={1.7} />,  title: "Build a rule",   body: "Pick a metric (revenue, expenses, a specific category), a direction (up / down), a threshold (% change or absolute amount), and a comparison window (vs. last month / quarter / year)." },
              { icon: <BellRing size={16} strokeWidth={1.7} />, title: "Firing alerts",  body: "When a rule's condition is true, an alert lands in this list and in the bell notifications. You'll see it on the next dashboard / signals page load." },
              { icon: <Bell size={16} strokeWidth={1.7} />,     title: "Severity & channels", body: "Each rule has its own severity (critical / important / info) and channel preferences (in-app, push, email). Quiet hours and daily caps apply per your account preferences." },
            ]}
            outro="Monitor rules don't use AI credits - they're rule-based math on your data. Use them for ground-truth thresholds (your custom KPIs); use the AI Signals tab for the broader observations Tweaxly surfaces automatically."
          />
        }
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
