import { prisma } from "../src/lib/db";

async function main() {
  const u = await prisma.user.findUnique({ where: { email: "shainon@gmail.com" } });
  if (!u) throw new Error("no user");
  const b = await prisma.business.findFirst({ where: { ownerId: u.id, name: "MAIN BUSINESS" } });
  if (!b) throw new Error("no biz");

  // Monthly P&L summary
  const rows = await prisma.$queryRawUnsafe<Array<{ ym: string; income: number; expense: number; net: number; count: number }>>(`
    SELECT
      "accountingMonth" AS ym,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)::float AS income,
      SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)::float AS expense,
      SUM(amount)::float AS net,
      COUNT(*)::int AS count
    FROM "Transaction"
    WHERE "businessId" = $1
    GROUP BY "accountingMonth"
    ORDER BY ym ASC
  `, b.id);

  console.log(`Monthly P&L for ${b.name}\n`);
  console.log("Month     Income       Expense      Net          Txns");
  console.log("-".repeat(58));
  for (const r of rows) {
    const inc = `$${Math.round(r.income).toLocaleString()}`.padStart(10);
    const exp = `$${Math.round(r.expense).toLocaleString()}`.padStart(12);
    const net = `$${Math.round(r.net).toLocaleString()}`.padStart(12);
    console.log(`${r.ym}   ${inc}   ${exp}   ${net}   ${String(r.count).padStart(4)}`);
  }
  console.log(`\nTotal months: ${rows.length}`);
  console.log(`Total income:  $${Math.round(rows.reduce((a, x) => a + x.income, 0)).toLocaleString()}`);
  console.log(`Total expense: $${Math.round(rows.reduce((a, x) => a + x.expense, 0)).toLocaleString()}`);
  console.log(`Net P&L:       $${Math.round(rows.reduce((a, x) => a + x.net, 0)).toLocaleString()}`);
}
main().finally(() => prisma.$disconnect());
