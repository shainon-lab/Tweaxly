/* End-to-end smoke for the Manual Data feature.
 * Verifies:
 *  - occurrenceDates() math for each frequency
 *  - createManualEntryAndMaterialize() generates the right number of txns
 *  - Materialized transactions correctly affect metrics + dataflow
 *  - Cascade delete removes entry AND its transactions */
import { prisma } from "../src/lib/db";
import {
  createManualEntryAndMaterialize,
  occurrenceDates,
} from "../src/lib/manualEntries";
import { buildMonthSnapshot } from "../src/lib/metrics";
import { dateToYM, todayYM } from "../src/lib/format";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  console.log(`Business: ${business.name}`);

  // ── Occurrence-date math ───────────────────────────────────────────────────
  console.log("\n— Occurrence-date math —");
  const start = new Date("2026-01-15T00:00:00Z");
  const upper = new Date("2026-05-31T00:00:00Z");
  const monthly = occurrenceDates(start, "monthly", upper);
  const quarterly = occurrenceDates(start, "quarterly", upper);
  const yearly = occurrenceDates(start, "yearly", upper);
  const oneTime = occurrenceDates(start, "one_time", upper);
  console.log(`  monthly Jan→May: ${monthly.length} dates (expect 5)`);
  console.log(`  quarterly Jan→May: ${quarterly.length} dates (expect 2)`);
  console.log(`  yearly Jan→May: ${yearly.length} dates (expect 1)`);
  console.log(`  one_time: ${oneTime.length} dates (expect 1)`);
  if (monthly.length !== 5 || quarterly.length !== 2 || yearly.length !== 1 || oneTime.length !== 1) {
    throw new Error("Occurrence math wrong");
  }

  // ── Use a unique category to avoid polluting existing data ─────────────────
  const catName = `SMOKE_OFFICE_RENT_${Date.now()}`;
  const cat = await prisma.category.create({
    data: { businessId: business.id, name: catName, kind: "fixed" },
  });
  console.log(`\nCreated test category "${catName}"`);

  // Baseline: current month's expenses
  const ym = todayYM();
  const before = await buildMonthSnapshot(business.id, ym);
  console.log(`Before — ${ym} expenses: ${before.expenses}`);

  // ── Create a monthly outcome starting 3 months ago ─────────────────────────
  const startDate = new Date();
  startDate.setUTCMonth(startDate.getUTCMonth() - 3);
  startDate.setUTCDate(15);
  const result = await createManualEntryAndMaterialize({
    businessId: business.id,
    type: "outcome",
    categoryId: cat.id,
    amount: 1500,
    frequency: "monthly",
    startDate,
    notes: "smoke test — monthly office rent",
  });
  console.log(`\nCreated entry, materialized ${result.materialized} transactions`);
  if (result.materialized < 4) {
    throw new Error(`Expected ≥4 materialized txns (3 months ago + this month), got ${result.materialized}`);
  }

  // Verify those transactions show up in metrics for current month
  const after = await buildMonthSnapshot(business.id, ym);
  console.log(`After — ${ym} expenses: ${after.expenses}  (delta ${after.expenses - before.expenses})`);
  if (after.expenses - before.expenses < 1500 - 0.01) {
    throw new Error("Materialized monthly outcome not reflected in current-month metrics");
  }

  // Verify accountingMonth was set correctly for each transaction
  const txns = await prisma.transaction.findMany({
    where: { businessId: business.id, manualEntryId: result.entry.id },
    orderBy: { transactionDate: "asc" },
  });
  console.log("Materialized transactions:");
  for (const t of txns) {
    console.log(
      `  ${t.transactionDate.toISOString().slice(0, 10)} ${t.accountingMonth} ${t.amount} ${t.type} cat=${cat.id}`,
    );
    if (t.amount !== -1500) throw new Error(`Expected amount -1500 (outcome), got ${t.amount}`);
    if (t.accountingMonth !== dateToYM(t.transactionDate))
      throw new Error("accountingMonth doesn't match transactionDate");
  }

  // ── Cascade delete ─────────────────────────────────────────────────────────
  console.log("\n— Cascade delete —");
  await prisma.manualEntry.delete({ where: { id: result.entry.id } });
  const remaining = await prisma.transaction.count({
    where: { manualEntryId: result.entry.id },
  });
  console.log(`After delete: ${remaining} transactions remain (expect 0)`);
  if (remaining !== 0) throw new Error("Cascade delete failed");

  // Verify metrics returned to baseline
  const restored = await buildMonthSnapshot(business.id, ym);
  console.log(`Restored ${ym} expenses: ${restored.expenses}  (baseline ${before.expenses})`);
  if (Math.abs(restored.expenses - before.expenses) > 0.01) {
    throw new Error("Delete did not restore baseline");
  }

  // Cleanup the test category
  await prisma.category.delete({ where: { id: cat.id } });

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
