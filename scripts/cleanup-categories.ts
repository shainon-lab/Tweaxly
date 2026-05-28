// One-off cleanup: drop every Category for the named workspaces so
// the user can start fresh after the legacy "vendor name = category"
// auto-creation bug. Runs in dry mode by default; pass `--apply` to
// actually delete.
//
//   npx tsx scripts/cleanup-categories.ts              # dry run
//   npx tsx scripts/cleanup-categories.ts --apply      # delete
//
// Workspaces are matched by case-insensitive name contains, so
// "Feedback Studio" matches "feedback" and "Shai Life" matches
// "shai life".

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_NAMES = ["shai life"];

async function main() {
  const apply = process.argv.includes("--apply");

  const businesses = await prisma.business.findMany({
    where: {
      OR: TARGET_NAMES.map((n) => ({ name: { contains: n, mode: "insensitive" as const } })),
    },
    select: { id: true, name: true },
  });

  if (businesses.length === 0) {
    console.log("No workspaces matched. Names tried:", TARGET_NAMES.join(", "));
    return;
  }

  console.log(`Matched ${businesses.length} workspace(s):`);
  for (const b of businesses) console.log(`  · ${b.name}  [${b.id}]`);
  console.log();

  for (const b of businesses) {
    const [categoryCount, rules, manualEntries, vendorsPinned, txnsPinned] = await Promise.all([
      prisma.category.count({ where: { businessId: b.id } }),
      prisma.categorizationRule.count({ where: { businessId: b.id } }),
      prisma.manualEntry.count({ where: { businessId: b.id } }),
      prisma.vendor.count({ where: { businessId: b.id, categoryId: { not: null } } }),
      prisma.transaction.count({ where: { businessId: b.id, categoryId: { not: null } } }),
    ]);
    console.log(`Workspace: ${b.name}`);
    console.log(`  Categories to delete:           ${categoryCount}`);
    console.log(`  CategorizationRules to delete:  ${rules}  (FK is required, must drop first)`);
    console.log(`  ManualEntries to cascade-delete: ${manualEntries}  (onDelete: Cascade)`);
    console.log(`  Vendor.categoryId pins to clear: ${vendorsPinned}  (SetNull)`);
    console.log(`  Transaction.categoryId pins to clear: ${txnsPinned}  (SetNull)`);
    console.log();
  }

  if (!apply) {
    console.log("─── DRY RUN ─── nothing was deleted.");
    console.log("Re-run with `--apply` to actually delete.");
    return;
  }

  console.log("═══ APPLYING DELETES ═══");
  for (const b of businesses) {
    console.log(`\nProcessing: ${b.name} [${b.id}]`);
    // Order matters:
    //   1. CategorizationRule (required FK on categoryId — would
    //      otherwise block the category delete)
    //   2. Category (cascades ManualEntry away; sets Vendor/Tx
    //      categoryId → null)
    const rulesDel = await prisma.categorizationRule.deleteMany({ where: { businessId: b.id } });
    console.log(`  Deleted ${rulesDel.count} CategorizationRule(s)`);
    const catDel = await prisma.category.deleteMany({ where: { businessId: b.id } });
    console.log(`  Deleted ${catDel.count} Category row(s)`);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
