import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import DataTabs from "@/components/DataTabs";
import { Upload, FolderTree, ShieldCheck } from "lucide-react";
import ReviewBanner from "@/components/ReviewBanner";
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
  const sp = await searchParams;
  const fromOnboarding = sp.onboarding === "1";
  const [entries, categoriesRaw, uploadBatchCount] = await Promise.all([
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
    // Used to decide whether to default the intake to "Historical Range"
    // (jan-to-last-month) for first-time users so they see the full
    // backfill option pre-selected. Repeat users get the usual
    // single-month default since that's what they upload most often.
    prisma.uploadBatch.count({ where: { businessId: business.id } }),
  ]);
  const hasAnyUpload = uploadBatchCount > 0;
  // Income first, outcome second - applied everywhere category lists render.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);

  return (
    <>
      <PageHeader
        title="Import your business data"
        subtitle="Upload bank, credit card, PayPal, or Stripe statements to start generating AI insights."
        right={
          <HowItWorks
            title="How data import works"
            intro="Bring your business data into Tweaxly. Bank statements first, then add credit cards, PayPal, integrations. The more you upload, the better the signals, forecasts, and AI answers get."
            cards={[
              { icon: <Upload size={16} strokeWidth={1.7} />,     title: "Statement upload", body: "CSV from any source. Tweaxly auto-detects columns, currencies, and credit-card settlements so the import isn't blocked on column-mapping." },
              { icon: <FolderTree size={16} strokeWidth={1.7} />, title: "Sources",          body: "Each bank, card, or provider is its own source. The coverage matrix shows which months are uploaded per source - so you can see at a glance what's missing." },
              { icon: <ShieldCheck size={16} strokeWidth={1.7} />, title: "Read-only",       body: "Tweaxly only reads transactions and balances. We never store credentials, never move money, never connect to your bank with write access." },
            ]}
            outro="Historical first (3-12 months from every source), then a monthly cadence as new statements arrive. Manual entry handles one-offs that won't appear in any export."
          />
        }
      />
      {fromOnboarding ? <OnboardingImportIntro /> : <DataTabs />}
      {!fromOnboarding ? <ReviewBanner businessId={business.id} surface="data" /> : null}
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
        hasAnyUpload={hasAnyUpload}
      />
    </>
  );
}
