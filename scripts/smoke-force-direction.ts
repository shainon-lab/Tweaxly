/* Smoke for forceDirection behavior in /api/upload/commit logic.
 * Simulates the commit body applying forceDirection to each row, regardless of
 * input sign. */
import { normalizeRow, type ColumnMapping } from "../src/lib/normalize";

function simulateForce(rawAmount: number, direction: "income" | "outcome") {
  // Mimic the commit logic
  const norm = normalizeRow(
    { Date: "2026-05-15", Amount: rawAmount, Description: "Test vendor" },
    {
      date: "Date",
      amount: "Amount",
      description: "Description",
      vendor: null,
      currency: null,
      txnId: null,
      source: null,
      category: null,
      notes: null,
    } as ColumnMapping,
    "manual_bulk",
    "USD",
    1,
  );
  if (!norm) return null;
  const magnitude = Math.abs(norm.amount);
  norm.amount = direction === "income" ? magnitude : -magnitude;
  norm.type = direction === "income" ? "income" : "expense";
  return norm;
}

console.log("— forceDirection enforcement —");
const cases: { raw: number; dir: "income" | "outcome"; expectAmount: number; expectType: string }[] = [
  // Outcome force on positive raw → still negative
  { raw: 100, dir: "outcome", expectAmount: -100, expectType: "expense" },
  // Outcome force on negative raw → still negative
  { raw: -100, dir: "outcome", expectAmount: -100, expectType: "expense" },
  // Income force on positive raw → still positive
  { raw: 100, dir: "income", expectAmount: 100, expectType: "income" },
  // Income force on negative raw → still positive
  { raw: -100, dir: "income", expectAmount: 100, expectType: "income" },
];
let failed = 0;
for (const c of cases) {
  const got = simulateForce(c.raw, c.dir);
  const ok = got?.amount === c.expectAmount && got?.type === c.expectType;
  console.log(
    `  ${ok ? "✓" : "✗"} raw=${c.raw.toString().padStart(5)} dir=${c.dir.padEnd(8)} → amount=${got?.amount} type=${got?.type}  (expected ${c.expectAmount} / ${c.expectType})`,
  );
  if (!ok) failed++;
}
if (failed > 0) throw new Error(`${failed} cases failed`);
console.log("\nAll good.");
