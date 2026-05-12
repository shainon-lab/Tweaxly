/* End-to-end smoke test for the new advisor engine.
 * Bypasses HTTP/auth — exercises the same code paths the API routes use. */
import { prisma } from "../src/lib/db";
import {
  buildBusinessContext,
  recommendProactive,
  answerQuestionMock,
  parseTargetAmount,
  parseHorizons,
  deriveTitle,
} from "../src/lib/advisor";

async function main() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) throw new Error("No business in DB. Run npm run db:seed first.");
  console.log(`Business: ${business.name} (${business.currency})`);

  console.log("\n— Building business context —");
  const ctx = await buildBusinessContext(business.id);
  console.log({
    ym: ctx.ym,
    avgRevenue: Math.round(ctx.avgRevenue),
    avgExpenses: Math.round(ctx.avgExpenses),
    avgMarketing: Math.round(ctx.avgMarketing),
    marketingRatio: ctx.marketingRatio.toFixed(3),
    employees: ctx.employees.length,
    employeeCostMonthly: Math.round(ctx.employeeCostMonthly),
    topVendors: ctx.topVendors.slice(0, 3),
    topCategories: ctx.topCategories.slice(0, 3),
    forecastNext: ctx.forecast[0]
      ? { ym: ctx.forecast[0].ym, expectedNet: Math.round(ctx.forecast[0].expectedNet) }
      : null,
    uncategorized: `${ctx.uncategorizedCount}/${ctx.totalThisMonth}`,
  });

  console.log("\n— Proactive recommendations —");
  const recs = await recommendProactive(business.id, ctx);
  for (const r of recs) {
    console.log(`[${r.level.toUpperCase()}] (${r.category}) ${r.title}`);
    console.log(`        impact ≈ $${Math.round(r.impact)}/mo`);
    console.log(`        ${r.detail}`);
  }

  console.log("\n— Persisting recommendations —");
  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { businessId: business.id, status: "active" } }),
    prisma.recommendation.createMany({
      data: recs.map((r) => ({
        businessId: business.id,
        level: r.level,
        title: r.title,
        detail: r.detail,
        impact: r.impact,
        category: r.category,
        payload: r.payload ? JSON.stringify(r.payload) : null,
        status: "active",
      })),
    }),
  ]);
  const stored = await prisma.recommendation.count({
    where: { businessId: business.id, status: "active" },
  });
  console.log(`Stored ${stored} active recommendations.`);

  const questions = [
    "I need to save $20K this quarter what would be the best way to do it?",
    "I need to save $20K over a year — what's the best way?",
    "I need to save $20K — compare quarter, year, and 5 years",
    "How should I think about growing revenue over 2 years?",
    "What is our cash runway over the next 3 years?",
    "Random general question with no signal but a 5-year outlook please",
  ];
  console.log("\n— Horizon parsing sanity —");
  for (const q of questions) {
    const hs = parseHorizons(q);
    console.log(`   "${q.slice(0, 60)}…" → ${JSON.stringify(hs)}`);
  }
  console.log("\n— Consultation answers —");
  for (const q of questions) {
    console.log(`\nQ: ${q}`);
    console.log(`   parsed target = ${parseTargetAmount(q)}`);
    console.log(`   parsed horizons = ${JSON.stringify(parseHorizons(q))}`);
    console.log(`   derived title = "${deriveTitle(q)}"`);
    const a = answerQuestionMock(ctx, q);
    console.log("   ─── content (first 500 chars) ───");
    console.log(a.content.slice(0, 500).split("\n").map((l) => "   " + l).join("\n"));
    if (a.payload?.horizons) {
      console.log("   ─── horizon-keyed options ───");
      for (const h of a.payload.horizons) {
        console.log(`   ${h.label} (${h.months}mo, target ~$${h.monthlyTarget}/mo):`);
        for (const o of h.options) {
          console.log(`     - ${o.title}: $${o.monthlySavings}/mo`);
        }
      }
    }
  }

  console.log("\n— Persisting a consultation thread —");
  const thread = await prisma.consultation.create({
    data: { businessId: business.id, title: deriveTitle(questions[0]) },
  });
  await prisma.consultationMessage.create({
    data: { consultationId: thread.id, role: "user", content: questions[0] },
  });
  const a = answerQuestionMock(ctx, questions[0]);
  await prisma.consultationMessage.create({
    data: {
      consultationId: thread.id,
      role: "assistant",
      content: a.content,
      payload: a.payload ? JSON.stringify(a.payload) : null,
    },
  });
  const reload = await prisma.consultation.findUnique({
    where: { id: thread.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  console.log(
    `Thread "${reload?.title}" stored with ${reload?.messages.length} messages.`,
  );

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
