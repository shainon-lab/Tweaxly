// One-time backfill for the duplicateDismissedAt sticky marker.
//
// Before commit f323197, dismissing a duplicate cleared the row's
// duplicateGroupId but left no record that the user had triaged it.
// So every subsequent upload re-flagged the same rows. This script
// runs the duplicate scanner against every transaction in every
// workspace and stamps duplicateDismissedAt on every row that would
// be flagged today — effectively pre-dismissing the backlog of
// suspicious pairs the user has already reviewed.
//
// Safe because:
//   - Rows currently flagged (isDuplicateCandidate=true) are left
//     alone — those are unreviewed alerts the user still needs to
//     see.
//   - Only candidate rows get stamped; non-candidate rows aren't
//     touched.
//   - duplicateDismissedAt is idempotent — re-running this is a no-op.
//
// Usage: `npx tsx scripts/backfill-dismissed-duplicates.ts`

import { PrismaClient } from "@prisma/client";
import { findDuplicateCandidates } from "../src/lib/duplicates";

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({ select: { id: true, name: true } });
  let totalStamped = 0;
  for (const biz of businesses) {
    const txns = await prisma.transaction.findMany({
      where: {
        businessId: biz.id,
        duplicateDismissedAt: null,
        isDuplicateCandidate: false, // skip rows still awaiting review
      },
    });
    if (txns.length === 0) continue;
    const groups = findDuplicateCandidates(txns);
    const ids = new Set<string>();
    for (const g of groups) for (const id of g.txnIds) ids.add(id);
    if (ids.size === 0) {
      console.log(`[${biz.name}] no candidate pairs to backfill`);
      continue;
    }
    const res = await prisma.transaction.updateMany({
      where: { id: { in: Array.from(ids) } },
      data: { duplicateDismissedAt: new Date() },
    });
    totalStamped += res.count;
    console.log(`[${biz.name}] stamped ${res.count} rows across ${groups.length} candidate group(s)`);
  }
  console.log(`Done. Total stamped: ${totalStamped}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
