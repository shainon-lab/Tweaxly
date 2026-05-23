import PageHeader from "@/components/PageHeader";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DataLogClient from "./DataLogClient";

const FREQUENCY_LABEL: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default async function DataLogPage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();

  // Data log is a unified activity feed: every UploadBatch (file imports)
  // AND every ManualEntry (single rows the user typed in). Manual entries
  // don't have an UploadBatch - they materialize directly into Transactions
  // with source="manual" - so we surface them here as a synthetic row so
  // the user has one place to see/remove every chunk of data feeding the
  // dashboard.
  const [batches, manualEntries] = await Promise.all([
    prisma.uploadBatch.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { transactions: true, replaces: true } },
        financialSource: { select: { name: true } },
        replacedBy: { select: { filename: true, createdAt: true } },
      },
    }),
    prisma.manualEntry.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
    }),
  ]);

  // Normalize both sources into a single row type and sort by createdAt.
  // Each upload-batch row carries status + audit-chain metadata so the
  // client can render a "Replaced by …" / "Replaces N batches" pill.
  const rows = [
    ...batches.map((b) => ({
      id: b.id,
      kind: "upload" as const,
      createdAt: b.createdAt.toISOString(),
      source: b.source,
      mode: b.mode,
      label: b.filename,
      representsMonth: b.representsMonth ?? (b.periodStart
        ? (b.periodEnd && b.periodEnd !== b.periodStart ? `${b.periodStart}..${b.periodEnd}` : b.periodStart)
        : null),
      rowCount: b.rowCount,
      transactions: b._count.transactions,
      status: b.status,
      financialSourceName: b.financialSource?.name ?? null,
      replacedByFilename: b.replacedBy?.filename ?? null,
      replacedAt: b.replacedAt?.toISOString() ?? null,
      replacesCount: b._count.replaces,
    })),
    ...manualEntries.map((e) => {
      const freq = FREQUENCY_LABEL[e.frequency] ?? e.frequency;
      const startYM = e.startDate.toISOString().slice(0, 7);
      // Synthetic "filename" for manual entries: category · frequency,
      // so the user can identify the row at a glance.
      const label = `${e.category?.name ?? "Manual entry"} · ${freq.toLowerCase()}`;
      return {
        id: e.id,
        kind: "manual" as const,
        createdAt: e.createdAt.toISOString(),
        source: "manual",
        mode: "manual",
        label,
        representsMonth: startYM,
        rowCount: 1,
        transactions: e._count.transactions,
        // Manual entries don't have an audit chain — keep field shape
        // consistent with upload rows so the client can render the
        // same Row type without an extra union branch.
        status: "active" as const,
        financialSourceName: null,
        replacedByFilename: null,
        replacedAt: null,
        replacesCount: 0,
      };
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title={t("page.dataLog.title")}
        subtitle="Data log - every upload AND every manual entry that has fed data into your dashboard, forecast, and consultation. Removing a row deletes all transactions that came from it."
      />
      <BusinessSettingsTabs />
      <DataLogClient rows={rows} currency={business.currency} />
    </>
  );
}
