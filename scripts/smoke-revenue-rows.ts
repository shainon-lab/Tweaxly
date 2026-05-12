import { prisma } from "../src/lib/db";
import { buildDataFlowSummary, buildMonthLineItems } from "../src/lib/dataflow";
import { listAccountingMonths } from "../src/lib/metrics";

async function main() {
  const biz = await prisma.business.findFirst();
  if (!biz) throw new Error("no business");

  console.log("— Data Flow summary (all time) —");
  const s = await buildDataFlowSummary(biz.id, "all", null);
  console.log("  revenues:");
  for (const r of s.revenues) {
    const pct = s.revenue > 0 ? ((r.total / s.revenue) * 100).toFixed(1) : "—";
    console.log("   ", r.name.padEnd(28), "+$" + r.total, "(", pct, "%)");
  }
  console.log("  total revenue: $" + s.revenue);
  console.log("  outcomes:", s.outcomes.length);

  console.log("\n— Monthly report (latest month) —");
  const months = await listAccountingMonths(biz.id);
  const r = await buildMonthLineItems(biz.id, months[0]);
  console.log("  revenue rows:");
  for (const row of r.rows.filter((x) => x.type === "income")) {
    console.log(
      "   ",
      row.name.padEnd(28),
      "cur=$" + row.cur,
      "prev=$" + row.prev,
    );
  }
  console.log("  total revenue: cur=$" + r.revenue.cur, "prev=$" + r.revenue.prev);
  console.log("  outcome rows:", r.rows.filter((x) => x.type === "outcome").length);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
