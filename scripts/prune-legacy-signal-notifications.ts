// One-off cleanup of pre-redesign signal notifications.
//
// The previous dispatcher re-emitted a notification every time the
// per-severity dedupe window (6h / 12h / 24h) expired for a still-
// present signal. That stacked up "X notifications for Y signals"
// rows where Y was much smaller. The new dispatcher only emits on
// real diff events (created / updated / severity_changed / resolved).
//
// Legacy rows can be identified deterministically:
//   - source = "signal"
//   - category is NOT one of the new event categories:
//       signal_created / signal_updated / signal_severity_changed /
//       signal_resolved
//
// Anything matching that filter is a stale dedupe-window emission
// and gets removed. New-event notifications are kept regardless of
// age - they're the meaningful history the spec asks us to preserve.
//
// Usage:
//   node --env-file=.env.local --experimental-strip-types \
//     --no-warnings scripts/prune-legacy-signal-notifications.ts [--apply]

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_EVENT_CATEGORIES = [
  "signal_created",
  "signal_updated",
  "signal_severity_changed",
  "signal_resolved",
];

async function main() {
  const apply = process.argv.includes("--apply");

  const where = {
    source:   "signal",
    category: { notIn: NEW_EVENT_CATEGORIES },
  } as const;

  const total = await prisma.alertNotification.count({ where });
  console.log(`\nLegacy signal-source notifications found: ${total}`);

  if (total === 0) {
    console.log("Nothing to prune.\n");
    await prisma.$disconnect();
    return;
  }

  // Snapshot a few examples for sanity-checking the filter before
  // committing to a delete.
  const sample = await prisma.alertNotification.findMany({
    where,
    take:    5,
    orderBy: { createdAt: "desc" },
    select:  { id: true, category: true, title: true, createdAt: true },
  });
  console.log("\nSample of rows that will be removed:");
  for (const s of sample) {
    console.log(`  - ${s.createdAt.toISOString()}  [${s.category}]  ${s.title}`);
  }

  if (!apply) {
    console.log(`\n[DRY-RUN] re-run with --apply to delete ${total} row(s).\n`);
    await prisma.$disconnect();
    return;
  }

  const r = await prisma.alertNotification.deleteMany({ where });
  console.log(`\n[APPLIED] deleted ${r.count} legacy signal notification(s).\n`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
