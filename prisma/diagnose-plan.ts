// Diagnose the effective plan for every business a given user owns.
// Reports the composition (override > subscription > default) so you
// can see exactly why someone is unlocked.
//
// Run:
//   DATABASE_URL=... EMAIL=demo@example.com npx tsx prisma/diagnose-plan.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL ?? "demo@example.com";
  console.log(`\n=== Effective plan for ${email} ===\n`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`✗ User not found.`);
    return;
  }
  console.log(`✓ User id=${user.id}  systemRole=${user.systemRole}`);

  const businesses = await prisma.business.findMany({
    where:   { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (businesses.length === 0) {
    console.log(`(no businesses)`);
    return;
  }

  const now = new Date();
  for (const b of businesses) {
    console.log(`\nBusiness "${b.name}" (${b.id})`);
    console.log(`  Legacy Business.plan field   : ${b.plan}`);

    const override = await prisma.adminPlanOverride.findFirst({
      where: {
        businessId: b.id,
        effectiveFrom: { lte: now },
        revokedAt: null,
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
      include: { assignedBy: { select: { email: true } } },
    });
    const sub = await prisma.subscription.findFirst({
      where: { businessId: b.id },
      orderBy: { createdAt: "desc" },
    });

    if (override) {
      console.log(`  Active override              : plan=${override.plan}  kind=${override.kind}  by=${override.assignedBy?.email ?? "?"}`);
      console.log(`  → EFFECTIVE PLAN             : ${override.plan} (source: override)`);
    } else if (sub && ["active", "trialing"].includes(sub.status)) {
      console.log(`  Active subscription          : plan=${sub.plan}  status=${sub.status}`);
      console.log(`  → EFFECTIVE PLAN             : ${sub.plan} (source: subscription)`);
    } else {
      console.log(`  No active override / sub.`);
      console.log(`  → EFFECTIVE PLAN             : free (source: default)`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) });
