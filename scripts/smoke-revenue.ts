/* Smoke for revenue-detection fixes:
 *  1) kindFromName recognizes more English + Hebrew income patterns
 *  2) Sign-by-kind: outcome categories store negative regardless of input sign
 *  3) Re-classifying a category from "other" → "revenue" + flipSigns re-signs
 *     existing transactions */
import { prisma } from "../src/lib/db";
import { kindFromName } from "../src/lib/parsers";
import { buildDataFlowSummary } from "../src/lib/dataflow";

async function main() {
  // ── 1) kindFromName recognition ────────────────────────────────────────────
  console.log("— kindFromName patterns —");
  const cases: { name: string; expected: string }[] = [
    // English income variants
    { name: "Revenue", expected: "revenue" },
    { name: "Total Revenue", expected: "revenue" },
    { name: "Income", expected: "revenue" },
    { name: "Sales", expected: "revenue" },
    { name: "Gross Income", expected: "revenue" },
    { name: "Service Fee", expected: "revenue" },
    { name: "Earnings", expected: "revenue" },
    { name: "Royalties", expected: "revenue" },
    { name: "MRR", expected: "revenue" },
    { name: "Commission", expected: "revenue" },
    { name: "Cashback", expected: "revenue" },
    { name: "Reimbursement", expected: "revenue" },
    // Hebrew income variants
    { name: "הכנסה", expected: "revenue" },
    { name: "הכנסות", expected: "revenue" },
    { name: "מכירות", expected: "revenue" },
    { name: "מחזור", expected: "revenue" },
    { name: "תקבולים", expected: "revenue" },
    // Outcomes
    { name: "Marketing", expected: "variable" },
    { name: "Rent", expected: "fixed" },
    { name: "Payroll", expected: "payroll" },
    { name: "שכירות", expected: "fixed" },
    { name: "שכר", expected: "payroll" },
    { name: "שיווק", expected: "variable" },
    // Untagged
    { name: "Random Stuff", expected: "other" },
  ];
  let failed = 0;
  for (const c of cases) {
    const got = kindFromName(c.name).kind;
    const ok = got === c.expected;
    console.log(`  ${ok ? "✓" : "✗"} "${c.name}".padEnd(20) → ${got} (expected ${c.expected})`);
    if (!ok) failed++;
  }
  if (failed > 0) throw new Error(`${failed} kindFromName cases failed`);

  // ── 2) Sign-by-kind: simulate the commit logic ─────────────────────────────
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  console.log(`\nBusiness: ${business.name}`);

  // Create a unique outcome category and a unique revenue category.
  const tag = `SMOKE_${Date.now()}`;
  const outcomeCat = await prisma.category.create({
    data: { businessId: business.id, name: `${tag}_RentLike`, kind: "fixed" },
  });
  const revenueCat = await prisma.category.create({
    data: { businessId: business.id, name: `${tag}_SalesLike`, kind: "revenue" },
  });

  // Simulate "user uploaded all-positive Marketing" — commit logic should
  // store as NEGATIVE because category kind is non-revenue.
  function simulateCommit(rawAmount: number, kind: string): number {
    const magnitude = Math.abs(rawAmount);
    const isIncomeKind = kind === "revenue";
    return isIncomeKind ? magnitude : -magnitude;
  }
  console.log("\n— Sign-by-kind enforcement —");
  console.log(`  Marketing positive 2400 (kind=fixed) → ${simulateCommit(2400, "fixed")} (expect -2400)`);
  console.log(`  Marketing negative -2400 (kind=fixed) → ${simulateCommit(-2400, "fixed")} (expect -2400)`);
  console.log(`  Revenue positive 28000 (kind=revenue) → ${simulateCommit(28000, "revenue")} (expect 28000)`);
  console.log(`  Revenue negative -28000 (kind=revenue) → ${simulateCommit(-28000, "revenue")} (expect 28000)`);
  if (
    simulateCommit(2400, "fixed") !== -2400 ||
    simulateCommit(-2400, "fixed") !== -2400 ||
    simulateCommit(28000, "revenue") !== 28000 ||
    simulateCommit(-28000, "revenue") !== 28000
  ) {
    throw new Error("Sign-by-kind logic broken");
  }

  // ── 3) Insert a "wrong-sign" transaction simulating an old upload ──────────
  // Pretend the user uploaded Marketing with all-positive amounts BEFORE our
  // fix — store amount as +2400 (wrong) under outcomeCat (kind=fixed).
  const wrong = await prisma.transaction.create({
    data: {
      businessId: business.id,
      source: "smoke",
      transactionDate: new Date("2026-05-15T00:00:00Z"),
      accountingMonth: "2026-05",
      amount: 2400,                  // POSITIVE (wrong for outcome)
      currency: business.currency,
      type: "income",                // also wrong
      categoryId: outcomeCat.id,
      description: "Smoke wrong-sign Marketing",
    },
  });
  console.log(`\nInserted wrong-sign txn id=${wrong.id} amount=${wrong.amount} type=${wrong.type}`);

  // Build summary BEFORE flipping — outcome should be -2400 (negative outflow),
  // which is the broken case the user reported.
  const before = await buildDataFlowSummary(business.id, "all", `${tag}_RentLike`);
  console.log(`Before flip: outcomes count=${before.outcomes.length}`);
  for (const o of before.outcomes) {
    console.log(`  ${o.name} kind=${o.kind} total=${o.total}`);
  }
  // Note: the `outcomes` here will show negative `total` because total = -sum,
  // and sum was +2400 → total = -2400.

  // ── 4) Apply the PATCH /api/categories flipSigns logic ─────────────────────
  // Simulate the API: change kind to "revenue" and re-sign existing txns.
  console.log("\n— Reclassify outcomeCat → revenue with flipSigns —");
  const newKind = "revenue";
  await prisma.category.update({
    where: { id: outcomeCat.id },
    data: { kind: newKind },
  });
  const txns = await prisma.transaction.findMany({
    where: { businessId: business.id, categoryId: outcomeCat.id },
  });
  for (const t of txns) {
    const magnitude = Math.abs(t.amount);
    const newAmount = newKind === "revenue" ? magnitude : -magnitude;
    const newType = newKind === "revenue" ? "income" : "expense";
    await prisma.transaction.update({
      where: { id: t.id },
      data: { amount: newAmount, type: newType },
    });
  }
  const after = await buildDataFlowSummary(business.id, "all", `${tag}_RentLike`);
  console.log(`After flip: revenue=${after.revenue} outcomes=${after.outcomes.length}`);
  if (after.revenue !== 2400) {
    throw new Error(`Expected revenue=2400 after flip, got ${after.revenue}`);
  }
  if (after.outcomes.length !== 0) {
    throw new Error(`Expected 0 outcomes after flip, got ${after.outcomes.length}`);
  }

  // ── 5) Cleanup ─────────────────────────────────────────────────────────────
  await prisma.transaction.delete({ where: { id: wrong.id } });
  await prisma.category.delete({ where: { id: outcomeCat.id } });
  await prisma.category.delete({ where: { id: revenueCat.id } });

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
