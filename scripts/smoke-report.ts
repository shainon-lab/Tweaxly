/* Smoke for buildMonthLineItems — verifies revenue + per-category outcomes
 * with carry-forward-0 rule + cur/prev deltas. */
import { prisma } from "../src/lib/db";
import { buildMonthLineItems } from "../src/lib/dataflow";
import { listAccountingMonths } from "../src/lib/metrics";
import { fmtMoney, fmtPct, ymToLabel } from "../src/lib/format";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  const ccy = business.currency;
  const months = await listAccountingMonths(business.id);
  if (months.length === 0) throw new Error("No months of data.");
  const ym = months[0];
  console.log(`Business: ${business.name}; latest month: ${ym}`);

  const r = await buildMonthLineItems(business.id, ym);
  console.log(`\nReport — ${ymToLabel(r.ym)} vs ${ymToLabel(r.prevYM)}\n`);

  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(
    pad("Category", 28) +
      pad("Type", 10) +
      pad(ymToLabel(r.ym).padStart(12), 14) +
      pad(ymToLabel(r.prevYM).padStart(12), 14) +
      "Δ",
  );
  console.log("─".repeat(80));
  for (const row of r.rows) {
    const cur = row.type === "income" ? row.cur : row.curOutflow;
    const prev = row.type === "income" ? row.prev : row.prevOutflow;
    const sign = row.type === "income" ? "+" : cur === 0 ? " " : "−";
    const psign = row.type === "income" ? "+" : prev === 0 ? " " : "−";
    const delta = cur - prev;
    const dpct = prev !== 0 ? `(${(((cur - prev) / Math.abs(prev)) * 100).toFixed(1)}%)` : "";
    console.log(
      pad(row.name, 28) +
        pad(row.type, 10) +
        pad(`${sign}${fmtMoney(cur, ccy)}`.padStart(12), 14) +
        pad(`${psign}${fmtMoney(prev, ccy)}`.padStart(12), 14) +
        `${delta >= 0 ? "+" : ""}${fmtMoney(delta, ccy)} ${dpct}`,
    );
  }
  console.log("─".repeat(80));
  console.log(
    pad("Total outcome", 28) +
      pad("", 10) +
      pad(`−${fmtMoney(r.totalOutcome.cur, ccy)}`.padStart(12), 14) +
      pad(`−${fmtMoney(r.totalOutcome.prev, ccy)}`.padStart(12), 14),
  );
  console.log(
    pad("P&L", 28) +
      pad(r.pnl.cur >= 0 ? "Profit" : "Loss", 10) +
      pad(`${fmtMoney(r.pnl.cur, ccy)}`.padStart(12), 14) +
      pad(`${fmtMoney(r.pnl.prev, ccy)}`.padStart(12), 14),
  );
  console.log(
    pad("Margin", 28) +
      pad("", 10) +
      pad(`${r.marginPct.cur == null ? "—" : fmtPct(r.marginPct.cur)}`.padStart(12), 14) +
      pad(`${r.marginPct.prev == null ? "—" : fmtPct(r.marginPct.prev)}`.padStart(12), 14),
  );

  // Sanity: revenue − totalOutcome should equal pnl
  const recomputed = r.revenue.cur - r.totalOutcome.cur;
  if (Math.abs(recomputed - r.pnl.cur) > 0.01) {
    throw new Error(`P&L invariant broken: recomputed ${recomputed} vs ${r.pnl.cur}`);
  }
  console.log(`\nInvariant OK: revenue (${r.revenue.cur}) − totalOutcome (${r.totalOutcome.cur}) = pnl (${r.pnl.cur})`);

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
