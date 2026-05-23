import PageHeader from "@/components/PageHeader";
import DataTabs from "@/components/DataTabs";
import { requireBusiness } from "@/lib/auth";
import { purgeExpired, TRASH_RETENTION_DAYS } from "@/lib/trash";
import { prisma } from "@/lib/db";
import { daysUntilExpiry } from "@/lib/trash";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
  const { business } = await requireBusiness();
  // Drop anything past 30 days before reading so the list never shows
  // a batch that's about to disappear on the next refresh.
  await purgeExpired(business.id).catch(() => null);

  const batches = await prisma.trashBatch.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { transactions: true } },
      // Trashed transactions are hidden by the soft-delete extension on
      // every read. Pass explicit `deletedAt: { not: null }` so they
      // become visible here.
      transactions: {
        take: 3,
        orderBy: { transactionDate: "desc" },
        where: { deletedAt: { not: null } },
        select: {
          id: true, transactionDate: true, amount: true, currency: true,
          description: true, vendor: true,
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Trash"
        subtitle={`Deleted transactions stay restorable for ${TRASH_RETENTION_DAYS} days. After that the rows are permanently removed and can't be recovered.`}
      />
      <DataTabs />
      <TrashClient
        retentionDays={TRASH_RETENTION_DAYS}
        currency={business.currency}
        batches={batches.map((b) => ({
          id:               b.id,
          createdAt:        b.createdAt.toISOString(),
          daysUntilExpiry:  daysUntilExpiry(b.createdAt),
          reason:           b.reason,
          transactionCount: b._count.transactions,
          sample: b.transactions.map((t) => ({
            id:              t.id,
            transactionDate: t.transactionDate.toISOString(),
            amount:          t.amount,
            currency:        t.currency,
            description:     t.description,
            vendor:          t.vendor,
          })),
        }))}
      />
    </>
  );
}
