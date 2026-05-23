// Trash / recycle bin for transactions.
//
// Bulk-trash creates a TrashBatch (one row per delete action) and
// soft-deletes every selected Transaction (deletedAt + deleteBatchId).
// The global Prisma extension in src/lib/db.ts hides soft-deleted rows
// from every read so trashed transactions never reach reports, the
// dashboard, settlement detection, or the user-facing list.
//
// Restore clears deletedAt + deleteBatchId in a single updateMany.
//
// Retention: 30 days. purgeExpired() permanently deletes every batch
// (and its transactions) older than 30 days; called lazily from the
// trash-list endpoint so no cron is required.

import { prisma } from "./db";
import { PrismaClient } from "@prisma/client";

// Lazy direct client for write operations that need to bypass the
// soft-delete extension (the extension only affects reads, but using
// the extended client for writes is fine — we just don't need it).
const writeClient = new PrismaClient();

export const TRASH_RETENTION_DAYS = 30;

export async function trashTransactions(input: {
  businessId:  string;
  userId:      string;
  txnIds:      string[];
  reason?:     string | null;
}): Promise<{ batchId: string; trashed: number }> {
  if (input.txnIds.length === 0) return { batchId: "", trashed: 0 };
  return await writeClient.$transaction(async (tx) => {
    const batch = await tx.trashBatch.create({
      data: {
        businessId:  input.businessId,
        deletedById: input.userId,
        reason:      input.reason ?? null,
      },
    });
    // Only soft-delete rows that belong to the workspace AND aren't
    // already trashed (idempotent if the user clicks twice).
    const res = await tx.transaction.updateMany({
      where: {
        id:        { in: input.txnIds },
        businessId: input.businessId,
        deletedAt:  null,
      },
      data: {
        deletedAt:     new Date(),
        deleteBatchId: batch.id,
      },
    });
    return { batchId: batch.id, trashed: res.count };
  });
}

export async function restoreBatch(input: {
  businessId: string;
  batchId:    string;
}): Promise<{ restored: number }> {
  return await writeClient.$transaction(async (tx) => {
    // Verify ownership before touching rows.
    const owned = await tx.trashBatch.findFirst({
      where: { id: input.batchId, businessId: input.businessId },
      select: { id: true },
    });
    if (!owned) return { restored: 0 };
    const res = await tx.transaction.updateMany({
      where: {
        deleteBatchId: input.batchId,
        businessId:    input.businessId,
        deletedAt:     { not: null },
      },
      data: {
        deletedAt:     null,
        deleteBatchId: null,
      },
    });
    // Remove the batch row itself — restored items aren't trash anymore.
    await tx.trashBatch.delete({ where: { id: input.batchId } });
    return { restored: res.count };
  });
}

// Hard-delete a single batch now (user explicitly emptied it before
// the 30-day expiry).
export async function purgeBatch(input: {
  businessId: string;
  batchId:    string;
}): Promise<{ purged: number }> {
  return await writeClient.$transaction(async (tx) => {
    const owned = await tx.trashBatch.findFirst({
      where: { id: input.batchId, businessId: input.businessId },
      select: { id: true },
    });
    if (!owned) return { purged: 0 };
    const res = await tx.transaction.deleteMany({
      where: { deleteBatchId: input.batchId, businessId: input.businessId },
    });
    await tx.trashBatch.delete({ where: { id: input.batchId } });
    return { purged: res.count };
  });
}

// Drop every batch whose creation date is older than the retention
// window. Called lazily from the trash list endpoint so users see
// expired batches disappear naturally without a separate cron.
export async function purgeExpired(businessId: string): Promise<{ purgedBatches: number; purgedRows: number }> {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86400_000);
  const expired = await writeClient.trashBatch.findMany({
    where: { businessId, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  if (expired.length === 0) return { purgedBatches: 0, purgedRows: 0 };
  let purgedRows = 0;
  await writeClient.$transaction(async (tx) => {
    for (const b of expired) {
      const res = await tx.transaction.deleteMany({
        where: { deleteBatchId: b.id, businessId },
      });
      purgedRows += res.count;
      await tx.trashBatch.delete({ where: { id: b.id } });
    }
  });
  return { purgedBatches: expired.length, purgedRows };
}

export function daysUntilExpiry(createdAt: Date): number {
  const expiresAt = createdAt.getTime() + TRASH_RETENTION_DAYS * 86400_000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400_000));
}
