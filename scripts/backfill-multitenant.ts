// One-shot backfill for the multi-tenant migration.
//
//   1. Seed shainon@gmail.com as systemRole = "super_admin"
//   2. For every existing Business, create a BusinessMembership row
//      for the owner with role = "account_admin" (if missing)
//   3. Tag demo@example.com's business as status = "demo"
//
// Idempotent — safe to run multiple times.

import { prisma } from "../src/lib/db";

async function main() {
  const SUPER_ADMIN_EMAIL = "shainon@gmail.com";

  // 1. Promote super admin if the account exists.
  const superAdmin = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
  if (superAdmin) {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { systemRole: "super_admin" },
    });
    console.log(`✓ ${SUPER_ADMIN_EMAIL} → super_admin`);
  } else {
    console.log(`! ${SUPER_ADMIN_EMAIL} not found — will be promoted on first signup if email matches`);
  }

  // 2. Backfill memberships for every existing business.
  const businesses = await prisma.business.findMany({
    select: { id: true, ownerId: true, name: true },
  });
  let createdMemberships = 0;
  for (const b of businesses) {
    const existing = await prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId: b.ownerId, businessId: b.id } },
    });
    if (!existing) {
      await prisma.businessMembership.create({
        data: {
          userId: b.ownerId,
          businessId: b.id,
          role: "account_admin",
        },
      });
      createdMemberships += 1;
    }
  }
  console.log(`✓ Backfilled ${createdMemberships} memberships (across ${businesses.length} businesses)`);

  // 3. Tag the demo account explicitly so it's filterable in the
  //    admin panel.
  const demoUser = await prisma.user.findUnique({ where: { email: "demo@example.com" } });
  if (demoUser) {
    const updated = await prisma.business.updateMany({
      where: { ownerId: demoUser.id, status: "active" },
      data: { status: "demo" },
    });
    console.log(`✓ Tagged ${updated.count} demo account(s) as status='demo'`);
  }

  console.log("\nBackfill complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
