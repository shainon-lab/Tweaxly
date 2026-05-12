/* End-to-end smoke for: monthly-summary parser, monthly upload commit,
 * data-flow aggregation (carry-forward-0 rule), and upload-batch deletion cascade. */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/db";
import { parseMonthlyWorkbook, kindFromName } from "../src/lib/parsers";
import { buildDataFlow } from "../src/lib/dataflow";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB. Run npm run db:seed first.");
  console.log(`Business: ${business.name} (${business.currency})`);

  // ── 1) Round-trip the parser with a synthetic CSV-like buffer ───────────────
  console.log("\n— Parser test —");
  const ws = XLSX.utils.aoa_to_sheet([
    ["Revenue", "Marketing", "Rent", "Payroll", "Surprise New Cat"],
    [42000, -3000, -3500, -18000, -1200],
    [1000, -200, 0, 0, 0], // sub-row that adds to totals
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const wb_parsed = parseMonthlyWorkbook("test.xlsx", buf);
  console.log("sheets →", wb_parsed.sheets.length);
  const sheet0 = wb_parsed.sheets[0];
  if (!sheet0) throw new Error("No sheets parsed");
  console.log("first sheet name →", sheet0.sheetName, "detectedMonth →", sheet0.detectedMonth);
  console.log("totals →", sheet0.totals);
  for (const [name, amt] of Object.entries(sheet0.totals)) {
    const kind = kindFromName(name);
    console.log(`  ${name} → ${amt}   (heuristic kind=${kind.kind}, isOneTime=${kind.isOneTime})`);
  }

  // ── 2) Commit two synthetic monthly-summary batches representing different months
  console.log("\n— Synthetic commit (2 batches: 2026-01 and 2026-02) —");
  // 2026-01: includes "Special One-Off"
  const monthA = "2026-01";
  const dateA = new Date("2026-01-15T00:00:00Z");
  const itemsA = [
    { category: "Revenue", amount: 28000 },
    { category: "Marketing", amount: -2400 },
    { category: "Rent", amount: -3500 },
    { category: "Special One-Off", amount: -2000 },
  ];
  // 2026-02: drops "Special One-Off" → carry-forward should add it as 0 in 02
  const dateB = new Date("2026-02-15T00:00:00Z");
  const itemsB = [
    { category: "Revenue", amount: 31000 },
    { category: "Marketing", amount: -1800 },
    { category: "Rent", amount: -3500 },
  ];

  // Create the batches by replicating the API's logic inline (simpler than HTTPing)
  async function commitMonthly(date: Date, items: typeof itemsA, label: string) {
    const ym = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const batch = await prisma.uploadBatch.create({
      data: {
        businessId: business!.id,
        source: "monthly_summary",
        mode: "monthly_summary",
        filename: `smoke-${label}.xlsx`,
        rowCount: items.length,
        representsMonth: ym,
      },
    });
    let made = 0;
    for (const it of items) {
      let cat = await prisma.category.findFirst({
        where: { businessId: business!.id, name: it.category },
      });
      if (!cat) {
        const guessed = kindFromName(it.category);
        cat = await prisma.category.create({
          data: {
            businessId: business!.id,
            name: it.category,
            kind: guessed.kind,
            isOneTime: guessed.isOneTime,
          },
        });
      }
      const amt = it.amount;
      if (amt === 0) continue;
      await prisma.transaction.create({
        data: {
          businessId: business!.id,
          uploadBatchId: batch.id,
          source: "monthly_summary",
          originalSourceFile: batch.filename,
          transactionDate: date,
          accountingMonth: ym,
          amount: amt,
          currency: business!.currency,
          type: amt > 0 ? "income" : "expense",
          categoryId: cat.id,
          description: it.category,
          isOneTime: cat.isOneTime,
        },
      });
      made++;
    }
    console.log(`  Created batch ${batch.id} (${ym}, ${made} transactions)`);
    return batch.id;
  }

  const batchAId = await commitMonthly(dateA, itemsA, "monthA");
  const batchBId = await commitMonthly(dateB, itemsB, "monthB");

  // ── 3) Build the data-flow grid for "all time" and verify carry-forward-0 ────
  console.log("\n— Data flow grid (all time) —");
  const grid = await buildDataFlow(business.id, "all", null);
  console.log(`Window: ${grid.fromYM} → ${grid.toYM} (${grid.months.length} months)`);
  console.log("Categories (firstYM):");
  for (const c of grid.categories) console.log(`  ${c.name.padEnd(25)} → first ${c.firstYM} (${c.kind})`);
  console.log("\nGrid (rows = months across categories):");
  console.log(["YM      ", ...grid.categories.map((c) => c.name.padStart(20))].join(" | "));
  for (const ym of grid.months) {
    const row = grid.categories.map((c) => {
      const v = grid.cells[ym]?.[c.name];
      if (v == null) return "—".padStart(20);
      return String(v).padStart(20);
    });
    console.log([ym, ...row].join(" | "));
  }

  // Specifically: "Special One-Off" appeared 2026-01, must be 0 (not null) in 2026-02
  const carryCheck = grid.cells["2026-02"]?.["Special One-Off"];
  console.log(`\nCarry-forward check: Special One-Off in 2026-02 = ${carryCheck} (expect 0, not null)`);
  if (carryCheck !== 0) {
    throw new Error(`Carry-forward rule failed — got ${carryCheck}`);
  }

  // ── 4) Filter by single category ─────────────────────────────────────────────
  console.log("\n— Filter by 'Revenue' —");
  const grid2 = await buildDataFlow(business.id, "all", "Revenue");
  console.log("Categories:", grid2.categories.map((c) => c.name));
  for (const ym of grid2.months) console.log(`  ${ym}: ${grid2.cells[ym]?.["Revenue"]}`);

  // ── 5) Time-window filters ───────────────────────────────────────────────────
  console.log("\n— Time-window filters —");
  for (const r of ["this_month", "this_quarter", "this_year", "last_year"] as const) {
    const g = await buildDataFlow(business.id, r, null);
    console.log(`  ${r}: ${g.fromYM} → ${g.toYM}, ${g.months.length} month(s), ${g.categories.length} category(ies)`);
  }

  // ── 6) Delete cascade ────────────────────────────────────────────────────────
  console.log("\n— Delete cascade —");
  const beforeA = await prisma.transaction.count({
    where: { businessId: business.id, uploadBatchId: batchAId },
  });
  console.log(`  Before delete: batch A has ${beforeA} transactions`);
  await prisma.transaction.deleteMany({
    where: { uploadBatchId: batchAId, businessId: business.id },
  });
  await prisma.uploadBatch.delete({ where: { id: batchAId } });
  const afterA = await prisma.transaction.count({
    where: { businessId: business.id, uploadBatchId: batchAId },
  });
  console.log(`  After delete: batch A has ${afterA} transactions, batch row exists? ${
    !!(await prisma.uploadBatch.findUnique({ where: { id: batchAId } }))
  }`);
  if (afterA !== 0) throw new Error("Delete cascade failed");

  // Cleanup batch B too so the smoke is idempotent
  await prisma.transaction.deleteMany({
    where: { uploadBatchId: batchBId, businessId: business.id },
  });
  await prisma.uploadBatch.delete({ where: { id: batchBId } });

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
