import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "shainon@gmail.com";
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) { console.log("NO USER"); return; }

  // Try every workspace as the "active" one and see what unread-count returns.
  const memberships = await prisma.businessMembership.findMany({
    where:   { userId: user.id, status: "active" },
    include: { business: { select: { name: true } } },
  });

  for (const m of memberships) {
    const count = await prisma.alertNotification.count({
      where: {
        userId: user.id,
        readAt: null,
        OR: [
          { businessId: m.businessId },
          { category:   "workspace_invitation" },
        ],
      },
    });
    console.log(`Active workspace "${m.business.name}" (${m.businessId}) → unread count = ${count}`);
  }

  // Also try inbox query (no OR scope = legacy behavior)
  for (const m of memberships) {
    const legacy = await prisma.alertNotification.count({
      where: { userId: user.id, readAt: null, businessId: m.businessId },
    });
    console.log(`  LEGACY (scoped only) on "${m.business.name}" → ${legacy}`);
  }

  // Without any scope - just userId+readAt:null
  const totalUnread = await prisma.alertNotification.count({
    where: { userId: user.id, readAt: null },
  });
  console.log(`\nTotal unread across all workspaces: ${totalUnread}`);

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
