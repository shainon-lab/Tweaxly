// One-time backfill: synthesize AuditLog rows for the "Shai Life"
// workspace from existing data so the Account → Access Logs feed
// shows historical events that pre-date the audit emissions.
//
// Sources of truth:
//   - UploadBatch  → "data.upload"
//   - FinancialSource → "source.created"
//   - Subscription → "billing.subscription_created" (+ canceled if cancelledAt set)
//
// Idempotent on re-run: we look for an existing audit row with the
// same action and createdAt before inserting. Other workspaces are
// left untouched — only Shai Life is affected.
//
// Usage: `npx tsx scripts/backfill-access-logs-shai-life.ts`

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_NAME = "Shai Life";

async function alreadyLogged(args: {
  actorUserId: string;
  action: string;
  targetBusinessId: string;
  createdAt: Date;
}): Promise<boolean> {
  // Match within ±1 second to tolerate any precision loss in the source rows.
  const lo = new Date(args.createdAt.getTime() - 1000);
  const hi = new Date(args.createdAt.getTime() + 1000);
  const existing = await prisma.auditLog.findFirst({
    where: {
      actorUserId: args.actorUserId,
      action: args.action,
      targetBusinessId: args.targetBusinessId,
      createdAt: { gte: lo, lte: hi },
    },
    select: { id: true },
  });
  return !!existing;
}

async function main() {
  const biz = await prisma.business.findFirst({
    where: { name: TARGET_NAME },
    select: { id: true, name: true, ownerId: true },
  });
  if (!biz) {
    console.error(`No workspace named "${TARGET_NAME}" found.`);
    return;
  }
  const actorUserId = biz.ownerId;
  console.log(`Backfilling access logs for "${biz.name}" (owner: ${actorUserId})`);

  // ── 1. UploadBatches → data.upload ─────────────────────────────
  const batches = await prisma.uploadBatch.findMany({
    where: { businessId: biz.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, source: true, filename: true, rowCount: true,
      periodStart: true, periodEnd: true, createdAt: true, status: true,
    },
  });
  let uploadInserts = 0;
  for (const b of batches) {
    if (await alreadyLogged({ actorUserId, action: "data.upload", targetBusinessId: biz.id, createdAt: b.createdAt })) {
      continue;
    }
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "data.upload",
        targetBusinessId: biz.id,
        createdAt: b.createdAt,
        metadata: JSON.stringify({
          uploadBatchId: b.id,
          source: b.source,
          filename: b.filename,
          rowCount: b.rowCount,
          imported: b.rowCount,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          status: b.status,
          backfilled: true,
        }),
      },
    });
    uploadInserts++;
  }
  console.log(`  data.upload: inserted ${uploadInserts} / ${batches.length}`);

  // ── 2. FinancialSources → source.created ───────────────────────
  const sources = await prisma.financialSource.findMany({
    where: { businessId: biz.id },
    orderBy: { createdAt: "asc" },
  });
  let sourceInserts = 0;
  for (const s of sources) {
    if (await alreadyLogged({ actorUserId, action: "source.created", targetBusinessId: biz.id, createdAt: s.createdAt })) {
      continue;
    }
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "source.created",
        targetBusinessId: biz.id,
        createdAt: s.createdAt,
        metadata: JSON.stringify({
          sourceId: s.id,
          name: s.name,
          type: s.type,
          currency: s.currency,
          last4: s.last4,
          startMonth: s.startMonth,
          backfilled: true,
        }),
      },
    });
    sourceInserts++;
  }
  console.log(`  source.created: inserted ${sourceInserts} / ${sources.length}`);

  // ── 3. Subscriptions → billing.* ───────────────────────────────
  const subs = await prisma.subscription.findMany({
    where: { businessId: biz.id },
    orderBy: { createdAt: "asc" },
  });
  let subInserts = 0;
  for (const s of subs) {
    if (!(await alreadyLogged({ actorUserId, action: "billing.subscription_created", targetBusinessId: biz.id, createdAt: s.createdAt }))) {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: "billing.subscription_created",
          targetBusinessId: biz.id,
          createdAt: s.createdAt,
          metadata: JSON.stringify({
            subscriptionId: s.id,
            plan: s.plan,
            status: s.status,
            externalProvider: s.externalProvider,
            backfilled: true,
          }),
        },
      });
      subInserts++;
    }
    if (s.cancelledAt && !(await alreadyLogged({ actorUserId, action: "billing.subscription_canceled", targetBusinessId: biz.id, createdAt: s.cancelledAt }))) {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: "billing.subscription_canceled",
          targetBusinessId: biz.id,
          createdAt: s.cancelledAt,
          metadata: JSON.stringify({
            subscriptionId: s.id,
            plan: s.plan,
            backfilled: true,
          }),
        },
      });
      subInserts++;
    }
  }
  console.log(`  billing.*: inserted ${subInserts}`);

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
