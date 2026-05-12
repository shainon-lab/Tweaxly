import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const { business } = await requireBusiness();
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
        title="Set notifications"
        subtitle="Get alerted when your revenue, expenses, net profit, or any specific category crosses a threshold compared to the prior period."
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
      />
    </>
  );
}
