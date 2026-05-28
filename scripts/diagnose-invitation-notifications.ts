// Diagnostic: inspect every piece of the invitation-notification
// pipeline for a given email. Reports which step (if any) silently
// dropped the bell write.
//
// Usage: npx tsx scripts/diagnose-invitation-notifications.ts shainon@gmail.com

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/diagnose-invitation-notifications.ts <email>");
    process.exit(1);
  }

  console.log(`\n=== Diagnosing bell notifications for ${email} ===\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  console.log("USER ROW:");
  console.log(user ? `  ✓ id=${user.id} name=${user.name ?? "(none)"}` : "  ✗ NO USER ROW - notifications would never fire");
  if (!user) return;

  const owned = await prisma.business.findMany({
    where:   { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select:  { id: true, name: true, createdAt: true },
  });
  console.log(`\nOWNED WORKSPACES (${owned.length}):`);
  for (const b of owned) console.log(`  - ${b.name}  (${b.id})`);

  const memberships = await prisma.businessMembership.findMany({
    where:   { userId: user.id },
    include: { business: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nMEMBERSHIPS (${memberships.length}):`);
  for (const m of memberships) console.log(`  - ${m.business.name}  status=${m.status}  role=${m.role}  (${m.businessId})`);

  const pending = await prisma.businessInvitation.findMany({
    where:   { email, status: "pending" },
    include: { business: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\nPENDING INVITATIONS (${pending.length}):`);
  for (const p of pending) {
    const expired = p.expiresAt.getTime() < Date.now();
    console.log(`  - ${p.business.name} → ${p.role}  id=${p.id}  expires=${p.expiresAt.toISOString()}  ${expired ? "[EXPIRED]" : ""}`);
  }

  const notifs = await prisma.alertNotification.findMany({
    where: {
      userId: user.id,
      category: "workspace_invitation",
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\nWORKSPACE_INVITATION ALERT NOTIFICATIONS (${notifs.length}):`);
  for (const n of notifs) {
    console.log(`  - sourceKey=${n.sourceKey}  readAt=${n.readAt ? n.readAt.toISOString() : "UNREAD"}  businessId=${n.businessId}  title="${n.title}"`);
  }

  // Cross-reference: pending invitations missing a notification.
  const notifKeys = new Set(notifs.map((n) => n.sourceKey));
  const missing = pending.filter((p) => !notifKeys.has(p.id));
  console.log(`\nMISSING NOTIFICATIONS (pending invitations with no AlertNotification row): ${missing.length}`);
  for (const m of missing) console.log(`  - ${m.business.name}  invitationId=${m.id}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1) });
