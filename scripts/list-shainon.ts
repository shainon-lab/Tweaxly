// Dry-run: list every user whose email is shainon@gmail.com (case-
// insensitive), with their businesses and data counts. No mutations.
import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { mode: "insensitive", equals: "shainon@gmail.com" } },
    include: {
      businesses: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { transactions: true, uploads: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${users.length} user(s) with email = shainon@gmail.com:`);
  for (const u of users) {
    console.log(`\n  • ${u.id}`);
    console.log(`    email:       ${u.email}`);
    console.log(`    name:        ${u.name ?? "—"}`);
    console.log(`    systemRole:  ${u.systemRole}`);
    console.log(`    createdAt:   ${u.createdAt.toISOString()}`);
    console.log(`    businesses:  ${u.businesses.length}`);
    for (const b of u.businesses) {
      console.log(`      - "${b.name}" (${b.id}) created ${b.createdAt.toISOString()} · ${b._count.transactions} txns, ${b._count.uploads} uploads`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
