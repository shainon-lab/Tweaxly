// One-off migration: the Pro plan's monthlyAICredits is being reduced
// from 500 to 100 going forward. Cap every Pro wallet's current
// balance at the new monthlyAICredits ceiling so existing users don't
// continue spending against the old 500 allowance.
//
// Behavior:
//   - For each AiCreditWallet, look up its workspace's effective plan.
//   - If the plan is Pro/Business AND balance > 100, reduce balance
//     to 100. Wallets at or below 100 are untouched (we never INCREASE
//     a balance - a user mid-month sitting at 40 keeps 40).
//   - Record a CreditTransaction with kind="migration_cap" so the
//     reduction is auditable from the billing transactions list.
//
// Usage:
//   node --env-file=.env.local --experimental-strip-types \
//     --no-warnings scripts/cap-pro-monthly-credits.ts [--apply]
//
// Defaults to dry-run; pass --apply to actually write. Idempotent: a
// second run with --apply does nothing because balances are already
// at the cap.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NEW_PRO_MONTHLY = 100;

async function main() {
  const apply = process.argv.includes("--apply");

  console.log(`\n=== Cap Pro wallets at ${NEW_PRO_MONTHLY} credits ===`);
  console.log(apply ? "[APPLY] writes enabled\n" : "[DRY-RUN] no writes - pass --apply to commit\n");

  // Active overrides take precedence over the base subscription; pull
  // both so we identify Pro workspaces correctly.
  const now = new Date();
  const overrides = await prisma.adminPlanOverride.findMany({
    where: {
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    select: { businessId: true, plan: true },
  });
  const overrideByBiz = new Map(overrides.map((o) => [o.businessId, o.plan]));

  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing", "past_due"] } },
    select: { businessId: true, plan: true },
  });
  const subByBiz = new Map(subs.map((s) => [s.businessId, s.plan]));

  const wallets = await prisma.aiCreditWallet.findMany();
  console.log(`Total wallets: ${wallets.length}`);

  let reduced = 0;
  let skipped = 0;
  let nonPro  = 0;

  for (const w of wallets) {
    const plan = overrideByBiz.get(w.businessId) ?? subByBiz.get(w.businessId) ?? "free";
    const isPro = plan === "pro" || plan === "business";

    if (!isPro) { nonPro++; continue; }
    if (w.balance <= NEW_PRO_MONTHLY) { skipped++; continue; }

    const delta = w.balance - NEW_PRO_MONTHLY;
    console.log(`  - ${w.businessId}  plan=${plan}  balance ${w.balance} -> ${NEW_PRO_MONTHLY}  (-${delta})`);

    if (apply) {
      await prisma.$transaction([
        prisma.aiCreditWallet.update({
          where: { businessId: w.businessId },
          data:  { balance: NEW_PRO_MONTHLY, monthlyAllowance: NEW_PRO_MONTHLY },
        }),
        prisma.aiCreditTransaction.create({
          data: {
            businessId:   w.businessId,
            kind:         "adjustment",
            delta:        -delta,
            balanceAfter: NEW_PRO_MONTHLY,
            reason:       `Pro monthly allowance reduced from 500 to ${NEW_PRO_MONTHLY}; balance capped to new ceiling.`,
          },
        }),
      ]);
    }
    reduced++;
  }

  console.log(`\nSummary:`);
  console.log(`  Reduced  : ${reduced}`);
  console.log(`  Skipped  : ${skipped}  (already at or below ${NEW_PRO_MONTHLY})`);
  console.log(`  Non-Pro  : ${nonPro}`);
  console.log(apply ? "\n[APPLIED]\n" : "\n[DRY-RUN] re-run with --apply to commit.\n");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
