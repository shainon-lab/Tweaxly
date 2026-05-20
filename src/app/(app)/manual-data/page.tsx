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
        // The most recent materialized transaction carries the freshest
        // exchange rate for this entry. For non-base entries we use its
        // base-currency `amount` as the converted display number.
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 1,
          select: { amount: true, exchangeRate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
  ]);
  // Income first, outcome second - applied everywhere category lists render.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);

  return (
    <>
      <PageHeader
        title={fromOnboarding ? "Import Your Business Data" : t("page.manualData.title")}
        subtitle={
          fromOnboarding
            ? "Upload your business activity to generate your first business snapshot."
            : "Import data - add income or outcome entries manually, or bulk-upload a file."
        }
      />
      {fromOnboarding ? <OnboardingImportIntro /> : <BusinessSettingsTabs />}
      <ManualDataClient
        entries={entries.map((e) => {
          const entryCurrency = (e.currency ?? business.currency).toUpperCase();
          const baseCurrency  = business.currency.toUpperCase();
          // For non-base entries, prefer the most-recent occurrence's
          // base-currency amount. If nothing has materialized yet
          // (future start date), fall back to the entered amount -
          // the conversion will appear once an occurrence lands.
          const latestBaseAmount = e.transactions[0]?.amount;
          const convertedAmount =
            entryCurrency === baseCurrency
              ? e.amount
              : (typeof latestBaseAmount === "number" ? Math.abs(latestBaseAmount) : e.amount);
          return {
            id: e.id,
            type: e.type,
            amount: e.amount,
            currency: entryCurrency,
            convertedAmount,
            convertedCurrency: baseCurrency,
            frequency: e.frequency,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate?.toISOString() ?? null,
            notes: e.notes,
            createdAt: e.createdAt.toISOString(),
            categoryId: e.categoryId,
            categoryName: e.category.name,
            categoryKind: e.category.kind,
            materialized: e._count.transactions,
          };
        })}
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
