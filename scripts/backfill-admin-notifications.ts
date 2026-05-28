// One-off: mark every existing User as already admin-notified so the
// cron job at /api/cron/admin-new-account-notifications doesn't fire
// a backlog of historical signups the moment it goes live.
//
// Usage:
//   node --env-file=.env.local --experimental-strip-types \
//     --no-warnings scripts/backfill-admin-notifications.ts [--apply]

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const now = new Date();

  const candidates = await prisma.user.count({
    where: { adminNotificationSentAt: null },
  });
  console.log(`\nUsers with adminNotificationSentAt = NULL: ${candidates}`);

  if (!apply) {
    console.log("[DRY-RUN] re-run with --apply to mark them all as already-notified.\n");
    await prisma.$disconnect();
    return;
  }

  const r = await prisma.user.updateMany({
    where: { adminNotificationSentAt: null },
    data:  {
      adminNotificationSentAt: now,
      adminNotificationError:  "backfill:pre_feature_signup",
    },
  });
  console.log(`[APPLIED] updated ${r.count} user(s).\n`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
