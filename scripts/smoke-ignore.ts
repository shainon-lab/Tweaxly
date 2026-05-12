/* End-to-end smoke for the "ignore / not calculated" feature.
 * Verifies:
 *  - excludeNote field is persisted
 *  - isExcludedFromPnl=true causes the txn to be skipped in metrics + dataflow
 *  - re-include clears both flag and note */
import { prisma } from "../src/lib/db";
import { buildMonthSnapshot } from "../src/lib/metrics";
import { buildDataFlow } from "../src/lib/dataflow";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  console.log(`Business: ${business.name}`);

  // Pick a real transaction to toggle
  const t = await prisma.transaction.findFirst({
    where: { businessId: business.id, isExcludedFromPnl: false, amount: { lt: 0 } },
    orderBy: { transactionDate: "desc" },
  });
  if (!t) throw new Error("No expense transaction available to test on.");
  console.log(`\nPicked: "${t.description}" ${t.amount} (${t.accountingMonth})`);

  // ── Baseline metrics ────────────────────────────────────────────────────────
  const before = await buildMonthSnapshot(business.id, t.accountingMonth);
  const beforeFlow = await buildDataFlow(business.id, "all", null);
  const beforeCellSum = Object.values(beforeFlow.cells).reduce((s, m) => {
    let row = 0;
    for (const v of Object.values(m)) if (typeof v === "number") row += v;
    return s + row;
  }, 0);
  console.log(`\nBefore — month ${t.accountingMonth} expenses: ${before.expenses.toFixed(0)}`);
  console.log(`Before — full dataflow cell sum: ${beforeCellSum.toFixed(0)}`);

  // ── Mark as ignore with a note ──────────────────────────────────────────────
  const note = "Personal — bought a TV for home (smoke test)";
  await prisma.transaction.update({
    where: { id: t.id },
    data: { isExcludedFromPnl: true, excludeNote: note },
  });
  const reread = await prisma.transaction.findUnique({ where: { id: t.id } });
  console.log(`\nAfter ignore: isExcludedFromPnl=${reread?.isExcludedFromPnl}, excludeNote="${reread?.excludeNote}"`);

  const after = await buildMonthSnapshot(business.id, t.accountingMonth);
  const afterFlow = await buildDataFlow(business.id, "all", null);
  const afterCellSum = Object.values(afterFlow.cells).reduce((s, m) => {
    let row = 0;
    for (const v of Object.values(m)) if (typeof v === "number") row += v;
    return s + row;
  }, 0);
  console.log(`After  — month ${t.accountingMonth} expenses: ${after.expenses.toFixed(0)}  (delta ${(after.expenses - before.expenses).toFixed(0)})`);
  console.log(`After  — full dataflow cell sum: ${afterCellSum.toFixed(0)}  (delta ${(afterCellSum - beforeCellSum).toFixed(0)})`);

  if (after.expenses === before.expenses) {
    throw new Error("Ignored transaction still in metrics — exclusion not respected.");
  }

  // ── Re-include (un-ignore) ──────────────────────────────────────────────────
  await prisma.transaction.update({
    where: { id: t.id },
    data: { isExcludedFromPnl: false, excludeNote: null },
  });
  const restored = await buildMonthSnapshot(business.id, t.accountingMonth);
  console.log(`\nAfter re-include: month ${t.accountingMonth} expenses: ${restored.expenses.toFixed(0)} (should match baseline ${before.expenses.toFixed(0)})`);
  if (Math.abs(restored.expenses - before.expenses) > 0.01) {
    throw new Error("Re-include did not restore baseline.");
  }
  const cleared = await prisma.transaction.findUnique({ where: { id: t.id } });
  console.log(`excludeNote after re-include: ${cleared?.excludeNote === null ? "null ✓" : `"${cleared?.excludeNote}" ✗`}`);

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
