// Diagnostic: report what's in the database for the target account.
// Runs against whatever DATABASE_URL is pointed at, so use the SAME
// connection string the dev server uses to confirm they match.
//
// Run:
//   DATABASE_URL=... npx tsx prisma/diagnose-mock-account.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_EMAIL = "shainon+767356@gmail.com";

async function main() {
  console.log(`\n=== Diagnose: ${TARGET_EMAIL} ===\n`);

  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    console.log(`✗ User not found. Have they signed up?`);
    return;
  }
  console.log(`✓ User: id=${user.id}  name=${user.name ?? "(none)"}`);

  const businesses = await prisma.business.findMany({
    where:   { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select:  { id: true, name: true, currency: true, plan: true, createdAt: true },
  });
  if (businesses.length === 0) {
    console.log(`✗ No businesses owned by this user.`);
    return;
  }
  console.log(`\n${businesses.length} business(es) owned by this user (oldest first):`);
  for (const b of businesses) {
    const oldest = b.id === businesses[0].id ? "  ← seeded here" : "";
    console.log(`  • ${b.name}  id=${b.id}  ccy=${b.currency}  plan=${b.plan}${oldest}`);
  }

  const targetBusiness = businesses[0];

  // Transaction count + month coverage for the seeded business.
  const totalTxns = await prisma.transaction.count({ where: { businessId: targetBusiness.id } });
  console.log(`\nTransactions on "${targetBusiness.name}" (id=${targetBusiness.id}): ${totalTxns}`);

  // Per-month breakdown for the mock window
  const months = await prisma.transaction.groupBy({
    by: ["accountingMonth"],
    where: {
      businessId:      targetBusiness.id,
      accountingMonth: { gte: "2025-06", lte: "2026-04" },
    },
    _count: true,
    orderBy: { accountingMonth: "asc" },
  });
  if (months.length === 0) {
    console.log(`  ✗ No transactions in 2025-06 → 2026-04. The seed didn't write to this database.`);
  } else {
    console.log(`  Mock window (Jun 2025 - Apr 2026):`);
    for (const m of months) {
      console.log(`    ${m.accountingMonth}: ${m._count} transactions`);
    }
  }

  // Memberships - which workspace shows in the switcher when this user logs in?
  const memberships = await prisma.businessMembership.findMany({
    where:   { userId: user.id, status: "active" },
    orderBy: { createdAt: "asc" },
    include: { business: { select: { id: true, name: true } } },
  });
  console.log(`\nActive memberships: ${memberships.length}`);
  for (const m of memberships) {
    console.log(`  • ${m.business.name}  role=${m.role}`);
  }

  console.log(`\nIf the txn count above is 0, the seed ran against a different database than this script. Check DATABASE_URL.`);
  console.log(`If the txn count is non-zero, your dev server may need a restart so the Prisma client picks up the fresh rows.\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
