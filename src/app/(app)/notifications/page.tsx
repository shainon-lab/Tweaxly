import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { Bell, Smartphone, Moon } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { getQuota, getPlanFor } from "@/lib/billing";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  const rulesQuota  = await getQuota(business.id, "maxNotificationRules");
  const currentPlan = await getPlanFor(business.id);
  const quotaMax    = rulesQuota === "unlimited" ? null : rulesQuota;
  const [rules, categoriesRaw] = await Promise.all([
    prisma.notificationRule.findMany({
      where: { businessId: business.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
  ]);
  // Revenue (income) categories first, then outcome categories.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);
  return (
    <>
      <PageHeader
        title={t("page.notifications.title")}
        subtitle={t("page.notifications.subtitle")}
        help={
          <HowItWorks
            title="How notifications work"
            intro="Two layers: the rules you build here, and the account-wide delivery preferences below. Rules decide WHAT triggers an alert; preferences decide HOW and WHEN it reaches you."
            cards={[
              { icon: <Bell size={16} strokeWidth={1.7} />,       title: "Threshold rules",  body: "Watch any metric (revenue, expenses, net profit, or a specific category). Pick a direction, a threshold (% or $), and a comparison window. When the condition trips, an alert fires." },
              { icon: <Smartphone size={16} strokeWidth={1.7} />, title: "Channels",         body: "Each rule can fire to the in-app bell, browser push, and email. Toggle channels per rule and per category so the noisy stuff stays in-app while the critical events ring through." },
              { icon: <Moon size={16} strokeWidth={1.7} />,       title: "Quiet hours & caps", body: "Account-level quiet hours pause non-critical alerts during evenings / weekends. A daily cap stops you from drowning in alerts on a busy day. Critical-severity rules can bypass both." },
            ]}
            outro="Rules don't use AI credits - they're rule-based math. The signals you see on the Business Signals page are a separate, AI-generated layer that runs in the background for free."
          />
        }
      />
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
        quotaMax={quotaMax}
        plan={currentPlan}
      />
    </>
  );
}
