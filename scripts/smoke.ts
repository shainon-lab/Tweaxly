// Smoke test: load metrics + insights against the seeded business and print a summary.
import { prisma } from "../src/lib/db";
import { buildMonthSnapshot, trailingMonthsSummary } from "../src/lib/metrics";
import { buildForecast } from "../src/lib/forecast";
import { generateInsights } from "../src/lib/insights";
import { fmtMoney, ymToLabel } from "../src/lib/format";

async function main() {
  const biz = await prisma.business.findFirst({ where: { name: "Demo Co." } });
  if (!biz) throw new Error("Run npm run db:seed first.");
  const trend = await trailingMonthsSummary(biz.id, 6);
  const ym = trend[trend.length - 1].ym;
  const snap = await buildMonthSnapshot(biz.id, ym);
  const forecast = await buildForecast(biz.id, 3);
  const insights = await generateInsights(biz.id, ym);

  console.log(`Business: ${biz.name} (${biz.currency})`);
  console.log(`Latest month: ${ymToLabel(ym)}`);
  console.log(`  Revenue:           ${fmtMoney(snap.income, biz.currency)}`);
  console.log(`  Expenses:          ${fmtMoney(snap.expenses, biz.currency)}`);
  console.log(`  Net profit:        ${fmtMoney(snap.netProfit, biz.currency)}`);
  console.log(`  Normalized:        ${fmtMoney(snap.normalizedProfit, biz.currency)}`);
  console.log(`  One-time items:    ${fmtMoney(snap.oneTime, biz.currency)}`);
  console.log(`  Payroll:           ${fmtMoney(snap.payroll, biz.currency)}`);
  console.log(`  Marketing:         ${fmtMoney(snap.marketing, biz.currency)}`);
  console.log(`Trend (last 6 months):`);
  for (const m of trend) {
    console.log(`  ${m.ym}  income=${m.income.toFixed(0)}  expenses=${m.expenses.toFixed(0)}  net=${m.net.toFixed(0)}`);
  }
  console.log(`Forecast:`);
  for (const f of forecast) {
    console.log(`  ${f.ym}  income=${f.expectedIncome.toFixed(0)}  expenses=${f.expectedExpenses.toFixed(0)}  net=${f.expectedNet.toFixed(0)}  notes=${f.notes.join("; ")}`);
  }
  console.log(`Insights (${insights.length}):`);
  for (const i of insights) console.log(`  [${i.level}] ${i.title}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
