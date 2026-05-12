/* Smoke for buildDataFlowSummary — verifies revenue + outcomes + P&L + margin. */
import { prisma } from "../src/lib/db";
import { buildDataFlowSummary } from "../src/lib/dataflow";
import { fmtMoney, fmtPct } from "../src/lib/format";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  const ccy = business.currency;
  console.log(`Business: ${business.name}`);

  for (const range of ["all", "this_year", "this_month"] as const) {
    const s = await buildDataFlowSummary(business.id, range, null);
    console.log(`\n=== ${range} (${s.fromYM} → ${s.toYM}, ${s.monthCount} mo) ===`);
    console.log(`Revenue:        +${fmtMoney(s.revenue, ccy)}`);
    console.log(`Outcomes:`);
    for (const o of s.outcomes) {
      const pct = s.revenue > 0 ? `(${((o.total / s.revenue) * 100).toFixed(1)}% of rev)` : "";
      console.log(`  ${o.name.padEnd(28)} ${o.kind.padEnd(10)} −${fmtMoney(o.total, ccy).padStart(10)}  ${pct}`);
    }
    console.log(`Total outcome:  −${fmtMoney(s.totalOutcome, ccy)}`);
    console.log(`P&L:            ${fmtMoney(s.pnl, ccy)}  (${s.marginPct == null ? "no revenue" : fmtPct(s.marginPct)} margin)`);
    // Sanity: revenue − totalOutcome should equal pnl
    const recomputed = s.revenue - s.totalOutcome;
    if (Math.abs(recomputed - s.pnl) > 0.01) {
      throw new Error(`P&L invariant broken: recomputed ${recomputed} vs reported ${s.pnl}`);
    }
  }

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
