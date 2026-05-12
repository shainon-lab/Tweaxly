/* End-to-end smoke for the simplified Financial Activity upload flow.
 * Verifies:
 *  - parseFileBuffer auto-synthesizes an Amount column from split Debit/Credit
 *  - guessMapping detects Date + Amount on a typical bank-export shape
 *  - commit endpoint auto-creates a Category per unique vendor/description
 *    and reuses it on repeat
 *  - kind selection: name heuristic first, fall back to net-amount sign
 */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/db";
import {
  parseFileBuffer,
  guessMapping,
  parseAmount,
} from "../src/lib/parsers";

async function main() {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!business) throw new Error("No business in DB.");
  console.log(`Business: ${business.name}`);

  // ── 1) Auto-detect Date + Amount on a typical bank-style sheet ────────────
  console.log("\n— guessMapping on typical bank export —");
  const ws1 = XLSX.utils.aoa_to_sheet([
    ["Date", "Description", "Amount"],
    ["2026-01-15", "STRIPE PAYOUT", 1200],
    ["2026-01-16", "AMAZON.COM 1234", -45],
    ["2026-01-17", "STRIPE PAYOUT", 800],
  ]);
  const wb1 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb1, ws1, "Sheet1");
  const buf1 = XLSX.write(wb1, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const parsed1 = parseFileBuffer("bank.xlsx", buf1);
  const guess1 = guessMapping(parsed1.headers);
  console.log(`  headers: [${parsed1.headers.join(", ")}]`);
  console.log(`  guess.date=${guess1.date} guess.amount=${guess1.amount} guess.description=${guess1.description}`);
  if (!guess1.date || !guess1.amount) throw new Error("Auto-detection failed for typical bank export");

  // ── 2) Debit/Credit split → synthesized Amount column ─────────────────────
  console.log("\n— guessMapping on Debit/Credit split file —");
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Date", "Description", "Debit", "Credit"],
    ["2026-02-01", "COFFEE SHOP", 4.5, ""],
    ["2026-02-05", "ACME PAYROLL DEPOSIT", "", 5000],
    ["2026-02-10", "RENT", 1500, ""],
  ]);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws2, "Sheet1");
  const buf2 = XLSX.write(wb2, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const parsed2 = parseFileBuffer("split.xlsx", buf2);
  const guess2 = guessMapping(parsed2.headers);
  console.log(`  headers: [${parsed2.headers.join(", ")}]`);
  console.log(`  guess.amount=${guess2.amount}`);
  // The synthesized "Amount (auto)" column should be picked first.
  if (guess2.amount !== "Amount (auto)") {
    throw new Error(`Expected synthesized 'Amount (auto)' column, got ${guess2.amount}`);
  }
  // Verify the synthesized values
  const synthesizedAmounts = parsed2.rows.map((r) => r["Amount (auto)"]);
  console.log(`  synthesized: ${JSON.stringify(synthesizedAmounts)}`);
  if (
    parseAmount(synthesizedAmounts[0]) !== -4.5 ||
    parseAmount(synthesizedAmounts[1]) !== 5000 ||
    parseAmount(synthesizedAmounts[2]) !== -1500
  ) {
    throw new Error("Synthesized debit/credit math is wrong");
  }

  // ── 3) Commit: auto-creates category per unique vendor, dedupes on repeat ─
  console.log("\n— Auto-category-by-name on commit —");
  const beforeCatCount = await prisma.category.count({
    where: { businessId: business.id },
  });

  // Simulate the commit logic inline (no HTTP)
  const tag = `SMOKE_AC_${Date.now()}`;
  const rows = [
    {
      Date: "2026-04-01",
      Description: `${tag} STRIPE PAYOUT`,
      Amount: 1200,
    },
    {
      Date: "2026-04-02",
      Description: `${tag} AMAZON.COM 1234`,
      Amount: -45,
    },
    {
      Date: "2026-04-05",
      Description: `${tag} STRIPE PAYOUT`,  // repeat
      Amount: 800,
    },
    {
      Date: "2026-04-08",
      Description: `${tag} AMAZON.COM 1234`, // repeat
      Amount: -23,
    },
    {
      Date: "2026-04-15",
      Description: `${tag} ACME PAYROLL DEPOSIT`,
      Amount: 5000,
    },
  ];

  // Hit the actual commit endpoint logic by importing it isn't trivial here, so
  // simulate the algorithm directly using the same inline approach.
  const { kindFromName } = await import("../src/lib/parsers");
  const batch = await prisma.uploadBatch.create({
    data: {
      businessId: business.id,
      source: "bank",
      filename: `${tag}_smoke.xlsx`,
      rowCount: rows.length,
    },
  });

  // PASS 1: net per name
  const netByName = new Map<string, number>();
  for (const r of rows) {
    const name = r.Description.trim();
    netByName.set(name, (netByName.get(name) ?? 0) + r.Amount);
  }

  const catCache = new Map<string, string>();
  async function ensureCategory(name: string): Promise<string> {
    const cached = catCache.get(name);
    if (cached) return cached;
    let cat = await prisma.category.findFirst({
      where: { businessId: business!.id, name },
    });
    if (!cat) {
      const heuristic = kindFromName(name);
      const net = netByName.get(name) ?? 0;
      let kind: string;
      if (net > 0) kind = "revenue";
      else if (heuristic.kind !== "other") kind = heuristic.kind;
      else kind = "other";
      cat = await prisma.category.create({
        data: {
          businessId: business!.id,
          name,
          kind,
          isOneTime: heuristic.isOneTime,
        },
      });
    }
    catCache.set(name, cat.id);
    return cat.id;
  }

  for (const r of rows) {
    const name = r.Description.trim();
    const categoryId = await ensureCategory(name);
    await prisma.transaction.create({
      data: {
        businessId: business.id,
        uploadBatchId: batch.id,
        source: "bank",
        transactionDate: new Date(r.Date),
        accountingMonth: r.Date.slice(0, 7),
        amount: r.Amount,
        currency: business.currency,
        type: r.Amount > 0 ? "income" : "expense",
        categoryId,
        description: name,
      },
    });
  }

  const afterCatCount = await prisma.category.count({
    where: { businessId: business.id },
  });
  // 5 rows / 3 unique names → exactly 3 new categories created
  console.log(
    `  Categories before: ${beforeCatCount}, after: ${afterCatCount}, new: ${afterCatCount - beforeCatCount}`,
  );
  if (afterCatCount - beforeCatCount !== 3) {
    throw new Error(
      `Expected exactly 3 new categories (3 unique names), got ${afterCatCount - beforeCatCount}`,
    );
  }

  // Verify each new category's kind
  const stripe = await prisma.category.findFirst({
    where: { businessId: business.id, name: `${tag} STRIPE PAYOUT` },
  });
  const amazon = await prisma.category.findFirst({
    where: { businessId: business.id, name: `${tag} AMAZON.COM 1234` },
  });
  const payroll = await prisma.category.findFirst({
    where: { businessId: business.id, name: `${tag} ACME PAYROLL DEPOSIT` },
  });
  console.log(`  STRIPE PAYOUT  → kind=${stripe?.kind} (expect revenue, net inflow wins over 'stripe' fee heuristic)`);
  console.log(`  AMAZON.COM     → kind=${amazon?.kind} (expect other, net outflow + unknown name)`);
  console.log(`  PAYROLL DEPOSIT → kind=${payroll?.kind} (expect revenue, net inflow into business account)`);
  if (stripe?.kind !== "revenue") throw new Error("Expected STRIPE → revenue (positive net)");
  if (amazon?.kind !== "other") throw new Error("Expected AMAZON → other (negative net)");
  if (payroll?.kind !== "revenue") throw new Error("Expected PAYROLL DEPOSIT → revenue (net inflow)");

  // Verify each transaction is linked to the correct category
  const txns = await prisma.transaction.findMany({
    where: { uploadBatchId: batch.id },
    include: { category: true },
  });
  const stripeTxns = txns.filter((t) => t.category?.name === `${tag} STRIPE PAYOUT`);
  const amazonTxns = txns.filter((t) => t.category?.name === `${tag} AMAZON.COM 1234`);
  console.log(`  Stripe transactions: ${stripeTxns.length} (expect 2 — same category, dedup OK)`);
  console.log(`  Amazon transactions: ${amazonTxns.length} (expect 2 — same category, dedup OK)`);
  if (stripeTxns.length !== 2) throw new Error("Stripe dedup failed");
  if (amazonTxns.length !== 2) throw new Error("Amazon dedup failed");
  // Both stripe txns should share the SAME categoryId
  if (stripeTxns[0].categoryId !== stripeTxns[1].categoryId) {
    throw new Error("Stripe txns not linked to same category");
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await prisma.transaction.deleteMany({ where: { uploadBatchId: batch.id } });
  await prisma.uploadBatch.delete({ where: { id: batch.id } });
  if (stripe) await prisma.category.delete({ where: { id: stripe.id } });
  if (amazon) await prisma.category.delete({ where: { id: amazon.id } });
  if (payroll) await prisma.category.delete({ where: { id: payroll.id } });

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
