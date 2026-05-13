import PageHeader from "@/components/PageHeader";
import DataTabs from "@/components/DataTabs";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DataLogClient from "./DataLogClient";

export default async function DataLogPage() {
  const { business } = await requireBusiness();
  const batches = await prisma.uploadBatch.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactions: true } } },
  });
  return (
    <>
      <PageHeader
        title="Data log"
        subtitle="Every upload that has fed data into your dashboard, forecast, and consultation. Removing an upload deletes all transactions that came from it."
      />
      <DataTabs />
      <DataLogClient
        batches={batches.map((b) => ({
          id: b.id,
          createdAt: b.createdAt.toISOString(),
          source: b.source,
          mode: b.mode,
          filename: b.filename,
          rowCount: b.rowCount,
          representsMonth: b.representsMonth,
          transactions: b._count.transactions,
        }))}
        currency={business.currency}
      />
    </>
  );
}
