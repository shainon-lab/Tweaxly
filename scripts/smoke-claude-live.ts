/* Live smoke test against the real Claude API.
 * Confirms: auth works, prompt caching is configured, two distinct question
 * shapes (data-grounded + general-knowledge) get sensible answers.
 *
 * Run with: ANTHROPIC_API_KEY=$(grep -E '^ANTHROPIC_API_KEY' .env | sed 's/^ANTHROPIC_API_KEY=//' | tr -d '"') npx tsx scripts/smoke-claude-live.ts */
import { prisma } from "../src/lib/db";
import { buildBusinessContext } from "../src/lib/advisor";
import { answerQuestionWithClaude } from "../src/lib/claudeAdvisor";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set in env");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log(
    `Using key: ${apiKey.slice(0, 12)}…${apiKey.slice(-6)} (${apiKey.length} chars)`,
  );

  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!business) throw new Error("No business in DB; run npm run db:seed first");
  console.log(`Business: ${business.name}`);

  console.log("\n— Building business context —");
  const ctx = await buildBusinessContext(business.id);
  console.log(
    `Context: ${ctx.dataFlow.months.length} months in dataflow, ${ctx.dataFlow.categories.length} categories, ${ctx.employees.length} employees, ${ctx.recentUploads.length} uploads, ${ctx.manualEntries.length} manual entries`,
  );

  // ── Q1: data-grounded ─────────────────────────────────────────────────────
  console.log("\n— Q1 (data-grounded): 'How is my business doing this year?' —");
  const t0 = Date.now();
  const a1 = await answerQuestionWithClaude(
    ctx,
    "How is my business doing this year? Give me a quick read on revenue, expenses, and profit margin.",
    [],
    apiKey,
  );
  const ms1 = Date.now() - t0;
  console.log(`Latency: ${ms1}ms`);
  console.log("─── response ───");
  console.log(a1.content);

  // ── Q2: general-knowledge ─────────────────────────────────────────────────
  console.log(
    "\n— Q2 (general-knowledge): 'Should I think about offering an annual plan?' —",
  );
  const t1 = Date.now();
  const a2 = await answerQuestionWithClaude(
    ctx,
    "Should I think about offering an annual plan to my customers? What are the tradeoffs?",
    [
      { role: "user", content: "How is my business doing this year?" },
      { role: "assistant", content: a1.content },
    ],
    apiKey,
  );
  const ms2 = Date.now() - t1;
  console.log(`Latency: ${ms2}ms (should be faster than Q1 due to prompt cache hit)`);
  console.log("─── response ───");
  console.log(a2.content);

  await prisma.$disconnect();
  console.log("\nAll good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
