import PageHeader from "@/components/PageHeader";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import ManualDataClient from "./ManualDataClient";
import OnboardingImportIntro from "./OnboardingImportIntro";

export default async function ManualDataPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  const sp = await searchParams;
  const fromOnboarding = sp.onboarding === "1";
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
        title={fromOnboarding ? "Import Your Business Data" : t("page.manualData.title")}
        subtitle={
          fromOnboarding
            ? "Upload your business activity to generate your first business snapshot."
            : "Import data — add income or outcome entries manually, or bulk-upload a file."
        }
      />
      {fromOnboarding ? <OnboardingImportIntro /> : <BusinessSettingsTabs />}
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
