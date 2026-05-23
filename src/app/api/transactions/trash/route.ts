// GET  /api/transactions/trash       → list active TrashBatches for the
//                                       current workspace, newest first
// POST /api/transactions/trash        → bulk-trash (alternate path to
//                                       the /bulk endpoint's "trash"
//                                       action; useful for clients that
//                                       prefer a dedicated route)
//
// Lazy purges expired batches (createdAt < now - 30d) before returning
// the list so the UI never shows an entry that's about to vanish on
// the next request.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  TRASH_RETENTION_DAYS,
  daysUntilExpiry,
  purgeExpired,
  trashTransactions,
} from "@/lib/trash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { business } = await requireBusiness();
  // Drop anything past 30 days before reading so the UI is always
  // accurate without a separate cron job.
  await purgeExpired(business.id).catch(() => null);
  const batches = await prisma.trashBatch.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { transactions: true } },
      // Pull a few sample transactions so the UI can preview what's
      // inside without a second fetch.
      transactions: {
        take: 3,
        orderBy: { transactionDate: "desc" },
        // The Transaction reads are extension-filtered by deletedAt:null
        // by default — pass an explicit non-null filter so the trash
        // page actually sees the trashed rows.
        where: { deletedAt: { not: null } },
        select: {
          id: true, transactionDate: true, amount: true, currency: true,
          description: true, vendor: true,
        },
      },
    },
  });
  return NextResponse.json({
    retentionDays: TRASH_RETENTION_DAYS,
    batches: batches.map((b) => ({
      id:              b.id,
      createdAt:       b.createdAt.toISOString(),
      daysUntilExpiry: daysUntilExpiry(b.createdAt),
      reason:          b.reason,
      transactionCount: b._count.transactions,
      sample: b.transactions.map((t) => ({
        id:              t.id,
        transactionDate: t.transactionDate.toISOString(),
        amount:          t.amount,
        currency:        t.currency,
        description:     t.description,
        vendor:          t.vendor,
      })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();
  const body = await req.json() as { ids?: unknown; reason?: string };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }
  const ids = body.ids.filter((x): x is string => typeof x === "string");
  const result = await trashTransactions({
    businessId: business.id,
    userId:     user.id,
    txnIds:     ids,
    reason:     body.reason ?? null,
  });
  return NextResponse.json({ ok: true, ...result });
}
