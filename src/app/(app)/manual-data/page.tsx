import PageHeader from "@/components/PageHeader";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import ManualDataClient from "./ManualDataClient";

export default async function ManualDataPage() {
  const { business } = await requireBusiness();
  const [entries, categoriesRaw] = await Promise.all([
    prisma.manualEntry.findMany({
      where: { businessId: business.id },
      include: {
        category: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
  ]);
  // Income first, outcome second — applied everywhere category lists render.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Import data — add income or outcome entries manually, or bulk-upload a file."
      />
      <BusinessSettingsTabs />
      <ManualDataClient
        entries={entries.map((e) => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          frequency: e.frequency,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
          notes: e.notes,
          createdAt: e.createdAt.toISOString(),
          categoryId: e.categoryId,
          categoryName: e.category.name,
          categoryKind: e.category.kind,
          materialized: e._count.transactions,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
        }))}
        currency={business.currency}
      />
    </>
  );
}
