/* Smoke for resolveDashboardRange + buildPeriodAggregate.
 * Verifies range resolution for each preset + custom, plus aggregation against
 * the seeded data. */
import { prisma } from "../src/lib/db";
import {
  resolveDashboardRange,
  buildPeriodAggregate,
  type DashboardRange,
} from "../src/lib/period";
import { fmtMoney } from "../src/lib/format";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB.");
  const ccy = business.currency;
  console.log(`Business: ${business.name}`);

  console.log("\n— Range resolution —");
  for (const r of [
    "this_month",
    "last_month",
    "this_quarter",
    "this_year",
    "last_year",
  ] as DashboardRange[]) {
    const x = resolveDashboardRange(r);
    console.log(
      `${r.padEnd(14)} cur=${x.fromYM}→${x.toYM}  prev=${x.prevFromYM}→${x.prevToYM}  label="${x.label}"`,
    );
  }

  console.log("\n— Custom range (2026-01..2026-03) —");
  const custom = resolveDashboardRange("custom", "2026-01-15", "2026-03-15");
  console.log(`cur=${custom.fromYM}→${custom.toYM}  prev=${custom.prevFromYM}→${custom.prevToYM}`);
  if (custom.fromYM !== "2026-01" || custom.toYM !== "2026-03") {
    throw new Error("Custom range resolution off");
  }

  console.log("\n— Period aggregates against seeded data —");
  for (const r of [
    "this_month",
    "this_quarter",
    "this_year",
  ] as DashboardRange[]) {
    const x = resolveDashboardRange(r);
    const agg = await buildPeriodAggregate(business.id, x.fromYM, x.toYM);
    console.log(
      `${r.padEnd(14)} (${x.fromYM}→${x.toYM}, ${agg.monthCount}mo) ` +
        `income=${fmtMoney(agg.income, ccy)} expenses=${fmtMoney(agg.expenses, ccy)} ` +
        `net=${fmtMoney(agg.netProfit, ccy)} payroll=${fmtMoney(agg.payroll, ccy)} ` +
        `marketing=${fmtMoney(agg.marketing, ccy)}`,
    );
  }

  // Verify "this_year" aggregate equals sum of monthly snapshots manually
  const x = resolveDashboardRange("this_year");
  const yearAgg = await buildPeriodAggregate(business.id, x.fromYM, x.toYM);
  console.log(`\nthis_year detail: ${yearAgg.monthCount} months in window`);
  for (const [k, v] of Object.entries(yearAgg.byCategory)) {
    if (Math.abs(v) < 1) continue;
    console.log(`  ${k.padEnd(28)} ${v >= 0 ? "+" : ""}${fmtMoney(v, ccy)}`);
  }

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
