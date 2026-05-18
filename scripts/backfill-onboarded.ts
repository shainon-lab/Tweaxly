// One-shot backfill: mark every business that already has transactions
// (or was created before this commit) as 'onboarded' so the new
// adaptive onboarding wizard doesn't ambush existing users on their
// next login. Idempotent.

import { prisma } from "../src/lib/db";

async function main() {
  const result = await prisma.business.updateMany({
    where: { onboardedAt: null },
    data:  { onboardedAt: new Date() },
  });
  console.log(`✓ Marked ${result.count} existing business(es) as onboarded.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
