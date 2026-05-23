// AI Credits ledger.
// AiCreditTransaction is the source of truth; AiCreditWallet is a
// denormalised running balance so reads are O(1). Every mutation goes
// through a Prisma transaction so the wallet can never drift from the
// ledger.
//
// Lifecycle:
//   • applyMonthlyAllowance(businessId)  - called once per period
//     (monthly cron) to grant the plan's monthly allowance and reset
//     periodStart.
//   • consumeCredits(businessId, n, ..)  - called by AI surfaces
//     (consultation, deep analysis, forecast). Returns ok=false when
//     the wallet is short - caller renders the upgrade CTA.
//   • grantCredits(businessId, n, kind)  - admin grants, coupon
//     redemptions, purchased credit packs.
//   • expireOldPackCredits()             - monthly cron sweep that
//     emits negative "expiry" transactions for any purchase-grant
//     past its expiresAt.

import { prisma } from "@/lib/db";
import { getPlanLimits } from "./plans";
import { getPlanFor } from "./entitlements";

export type CreditKind =
  | "monthly_grant"   // recurring monthly grant on Pro+ plans
  | "starter_grant"   // one-time onboarding grant on Free (first wallet bootstrap)
  | "consume"
  | "purchase"
  | "admin_grant"
  | "coupon"
  | "expiry"
  | "adjustment"
  // Offsetting negative entry written when the source of an earlier
  // grant is invalidated:
  //   • Override revoked       → revert admin_grant credits
  //   • Pack purchase refunded → revert purchase credits
  //   • Subscription lapsed    → revert monthly_grant credits
  // The reverted source + reference id are stamped in meta so the
  // ledger stays auditable and revert is idempotent.
  | "revert";

export interface CreditOptions {
  reason?:    string;
  expiresAt?: Date;
  meta?:      Record<string, unknown>;
}

export async function getBalance(businessId: string): Promise<number> {
  const wallet = await prisma.aiCreditWallet.findUnique({
    where: { businessId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

export async function getWallet(businessId: string) {
  return prisma.aiCreditWallet.findUnique({ where: { businessId } });
}

// Spend credits. Atomic: balance check + decrement + ledger entry all
// happen inside a single Prisma transaction. Returns ok=false when
// insufficient - never throws for the "not enough credits" case.
export async function consumeCredits(
  businessId: string,
  amount: number,
  reason: string,
  meta?: Record<string, unknown>,
): Promise<
  | { ok: true; balance: number }
  | { ok: false; reason: "insufficient" | "invalid_amount" | "no_wallet"; balance: number }
> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "invalid_amount", balance: 0 };
  }
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.aiCreditWallet.findUnique({ where: { businessId } });
    if (!wallet) {
      return { ok: false as const, reason: "no_wallet" as const, balance: 0 };
    }
    if (wallet.balance < amount) {
      return { ok: false as const, reason: "insufficient" as const, balance: wallet.balance };
    }
    const newBalance = wallet.balance - amount;
    await tx.aiCreditWallet.update({
      where: { businessId },
      data: {
        balance:          newBalance,
        lifetimeConsumed: { increment: amount },
      },
    });
    await tx.aiCreditTransaction.create({
      data: {
        businessId,
        delta:        -amount,
        kind:         "consume",
        reason,
        balanceAfter: newBalance,
        meta:         meta as object | undefined,
      },
    });
    return { ok: true as const, balance: newBalance };
  });
}

// Grant credits. Used for monthly allowances, admin grants, coupon
// redemptions and purchased packs. expiresAt is only meaningful for
// purchase grants (packs expire 12 months by default).
export async function grantCredits(
  businessId: string,
  amount: number,
  kind: CreditKind,
  opts?: CreditOptions,
): Promise<{ balance: number }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`grantCredits: invalid amount ${amount}`);
  }
  return prisma.$transaction(async (tx) => {
    // Wallet may not exist yet for brand-new businesses.
    const existing = await tx.aiCreditWallet.findUnique({ where: { businessId } });
    const wallet = existing
      ? await tx.aiCreditWallet.update({
          where: { businessId },
          data: {
            balance:         existing.balance + amount,
            lifetimeGranted: { increment: amount },
          },
        })
      : await tx.aiCreditWallet.create({
          data: {
            businessId,
            balance:         amount,
            monthlyAllowance: 0,
            periodStart:     new Date(),
            lifetimeGranted: amount,
            lifetimeConsumed: 0,
          },
        });
    await tx.aiCreditTransaction.create({
      data: {
        businessId,
        delta:        amount,
        kind,
        reason:       opts?.reason ?? null,
        expiresAt:    opts?.expiresAt ?? null,
        balanceAfter: wallet.balance,
        meta:         opts?.meta as object | undefined,
      },
    });
    return { balance: wallet.balance };
  });
}

// Called by the monthly cron (or at first signup) to credit the
// plan's monthly allowance. Resets monthlyAllowance + periodStart on
// the wallet so the UI can show "Plan credits reset in X days".
export async function applyMonthlyAllowance(businessId: string): Promise<{ balance: number; granted: number }> {
  const plan = await getPlanFor(businessId);
  const allowance = getPlanLimits(plan).monthlyAICredits;
  if (allowance <= 0) {
    // Touch the wallet so periodStart is fresh even on Free tier
    // where allowance is 0.
    await prisma.aiCreditWallet.upsert({
      where:  { businessId },
      create: { businessId, balance: 0, monthlyAllowance: 0, periodStart: new Date() },
      update: { monthlyAllowance: 0, periodStart: new Date() },
    });
    return { balance: await getBalance(businessId), granted: 0 };
  }
  const { balance } = await grantCredits(businessId, allowance, "monthly_grant", {
    reason: `Monthly ${plan} allowance`,
  });
  await prisma.aiCreditWallet.update({
    where: { businessId },
    data:  { monthlyAllowance: allowance, periodStart: new Date() },
  });
  return { balance, granted: allowance };
}

// Lazy bootstrap + plan-aware grant. Idempotent - safe to call on
// every request that's about to consume credits.
//
//   • Wallet doesn't exist yet
//     ─ Free plan: create wallet + grant starter credits ONCE (kind:
//       "starter_grant"). Never re-granted.
//     ─ Pro plan: create wallet + grant the monthly allowance.
//   • Wallet exists, plan has a recurring monthly allowance
//     ─ If periodStart is in a prior calendar month: re-grant the
//       monthly allowance and stamp periodStart.
//     ─ Same month: no-op.
//   • Wallet exists, plan does NOT have a recurring allowance (Free)
//     ─ No-op. Starter credits were already granted at bootstrap; we
//       never refresh them. When they run out the user is asked to
//       upgrade.
//
// Calendar-month rollover is used rather than a fixed 30-day window
// so the UI can show "Plan credits reset on the 1st" cleanly.
export async function ensureMonthlyAllowance(
  businessId: string,
  now: Date = new Date(),
): Promise<{ balance: number; granted: number; reset: boolean }> {
  const wallet = await prisma.aiCreditWallet.findUnique({ where: { businessId } });
  const plan   = await getPlanFor(businessId);
  const limits = getPlanLimits(plan);

  if (!wallet) {
    // Brand-new wallet. Pick the right first-grant flavour for the plan.
    if (limits.starterAICredits > 0 && limits.monthlyAICredits <= 0) {
      // Free flow: one-time starter grant.
      const { balance } = await grantCredits(
        businessId, limits.starterAICredits, "starter_grant",
        { reason: `Starter AI Credits (${plan})` },
      );
      await prisma.aiCreditWallet.update({
        where: { businessId },
        data:  { monthlyAllowance: 0, periodStart: now },
      });
      return { balance, granted: limits.starterAICredits, reset: true };
    }
    if (limits.monthlyAICredits > 0) {
      // Pro flow: monthly allowance.
      const { granted, balance } = await applyMonthlyAllowance(businessId);
      return { balance, granted, reset: true };
    }
    // No grants on this plan - still need to materialise the wallet so
    // subsequent consumeCredits() calls have a row to read.
    await prisma.aiCreditWallet.upsert({
      where:  { businessId },
      create: { businessId, balance: 0, monthlyAllowance: 0, periodStart: now },
      update: { },
    });
    return { balance: 0, granted: 0, reset: true };
  }

  // Wallet exists.
  if (limits.monthlyAICredits <= 0) {
    // Free (or any plan without recurring monthly credits) - never
    // refresh. The starter grant happened on bootstrap; users get a
    // one-time experience.
    // BUT: this is also the lazy hook for sub-lapse / downgrade.
    // If the workspace still has monthly_grant credits sitting in
    // the wallet from a prior Pro period, revert them now so the
    // user doesn't keep consuming AI on a sub they no longer have.
    await reconcileEntitledCredits(businessId);
    const after = await prisma.aiCreditWallet.findUnique({ where: { businessId } });
    return { balance: after?.balance ?? wallet.balance, granted: 0, reset: false };
  }
  const prev = wallet.periodStart;
  const sameMonth =
    prev.getUTCFullYear() === now.getUTCFullYear() &&
    prev.getUTCMonth()    === now.getUTCMonth();
  if (sameMonth) return { balance: wallet.balance, granted: 0, reset: false };
  // Period rolled - grant the allowance again.
  const { granted, balance } = await applyMonthlyAllowance(businessId);
  return { balance, granted, reset: true };
}

// Sweep expired purchase grants. Intended to run as a daily cron.
// Emits a single negative "expiry" transaction per expired pack so
// the ledger stays auditable.
export async function expireOldPackCredits(now: Date = new Date()): Promise<{ expired: number; businesses: number }> {
  // Find purchase grants past their expiresAt that haven't already
  // been offset by an "expiry" with matching meta.purchaseTxnId.
  const expired = await prisma.aiCreditTransaction.findMany({
    where: {
      kind:      "purchase",
      expiresAt: { lte: now },
    },
    select: {
      id:           true,
      businessId:   true,
      delta:        true,
    },
  });
  if (expired.length === 0) return { expired: 0, businesses: 0 };

  let totalExpired = 0;
  const seenBusinesses = new Set<string>();
  for (const txn of expired) {
    // Has an expiry already been recorded for this purchase?
    const already = await prisma.aiCreditTransaction.findFirst({
      where: { businessId: txn.businessId, kind: "expiry", meta: { path: ["purchaseTxnId"], equals: txn.id } },
      select: { id: true },
    });
    if (already) continue;
    const wallet = await prisma.aiCreditWallet.findUnique({ where: { businessId: txn.businessId } });
    if (!wallet) continue;
    const amount = Math.min(txn.delta, wallet.balance);
    if (amount <= 0) continue;
    await prisma.$transaction(async (tx) => {
      const newBalance = wallet.balance - amount;
      await tx.aiCreditWallet.update({
        where: { businessId: txn.businessId },
        data:  { balance: newBalance },
      });
      await tx.aiCreditTransaction.create({
        data: {
          businessId:   txn.businessId,
          delta:        -amount,
          kind:         "expiry",
          reason:       "Purchased credit pack expired",
          balanceAfter: newBalance,
          meta:         { purchaseTxnId: txn.id },
        },
      });
    });
    totalExpired += amount;
    seenBusinesses.add(txn.businessId);
  }
  return { expired: totalExpired, businesses: seenBusinesses.size };
}

export async function getRecentTransactions(businessId: string, limit = 50) {
  return prisma.aiCreditTransaction.findMany({
    where:   { businessId },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}

// ────────────────────────────────────────────────────────────────────
// Reversion
// ────────────────────────────────────────────────────────────────────
//
// Rules (from spec):
//   1. Credits granted by an admin override revert when that override
//      is revoked or expires.
//   2. Credits granted by a subscription's monthly allowance revert
//      when the subscription is no longer active (canceled, past_due,
//      not-renewed, or downgraded to Free).
//   3. Credits granted by a one-time pack purchase ONLY revert when
//      that specific pack is refunded.
//   4. Starter grants (one-time Free onboarding credits) and coupon
//      redemptions are never auto-reverted.
//
// All reverts are clamped so the wallet can never go negative AND so
// they never eat into protected sources (unrefunded packs). Each
// revert writes a single `kind:"revert"` ledger row with
// `meta.revertedSource` and a reference id, so subsequent calls
// detect they've already reverted and become no-ops.

// Sum the unrefunded pack credits still attributable to active
// purchases. Used as the floor when computing how much of a monthly
// or override revert we're allowed to write - pack credits must
// survive a subscription lapse per the spec.
async function getProtectedPackCredits(businessId: string): Promise<number> {
  const purchases = await prisma.aiCreditTransaction.findMany({
    where: { businessId, kind: "purchase" },
    select: { id: true, delta: true },
  });
  if (purchases.length === 0) return 0;

  let protectedTotal = 0;
  for (const p of purchases) {
    // Sum any prior writedowns of this specific purchase. Both the
    // monthly "expiry" sweep and the refund flow tag their entries
    // with the originating purchase txn id.
    const writedowns = await prisma.aiCreditTransaction.findMany({
      where: {
        businessId,
        OR: [
          { kind: "expiry", meta: { path: ["purchaseTxnId"], equals: p.id } },
          { kind: "revert", meta: { path: ["revertedSource"], equals: "purchase" }, AND: [{ meta: { path: ["purchaseTxnId"], equals: p.id } }] },
        ],
      },
      select: { delta: true },
    });
    const written = writedowns.reduce((s, w) => s + Math.abs(w.delta), 0);
    protectedTotal += Math.max(0, p.delta - written);
  }
  return protectedTotal;
}

// Write a single offsetting revert transaction inside an existing
// Prisma interactive-tx. Returns the actual amount written (0 when
// nothing left to revert).
async function writeRevert(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  businessId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown>,
): Promise<number> {
  if (amount <= 0) return 0;
  const wallet = await tx.aiCreditWallet.findUnique({ where: { businessId } });
  if (!wallet) return 0;
  const clamped = Math.min(amount, wallet.balance);
  if (clamped <= 0) return 0;
  const newBalance = wallet.balance - clamped;
  await tx.aiCreditWallet.update({
    where: { businessId },
    data:  { balance: newBalance },
  });
  await tx.aiCreditTransaction.create({
    data: {
      businessId,
      delta:        -clamped,
      kind:         "revert",
      reason,
      balanceAfter: newBalance,
      meta:         meta as object,
    },
  });
  return clamped;
}

// Revert every credit granted by a single admin override. Idempotent:
// the second call notices the prior revert(s) and returns 0.
export async function revertOverrideCredits(
  overrideId: string,
  reason: string = "Admin override revoked",
): Promise<{ reverted: number }> {
  const grants = await prisma.aiCreditTransaction.findMany({
    where: {
      kind: "admin_grant",
      meta: { path: ["overrideId"], equals: overrideId },
    },
    select: { id: true, businessId: true, delta: true },
  });
  if (grants.length === 0) return { reverted: 0 };

  // All grants for one override belong to the same business.
  const businessId = grants[0].businessId;
  const grantedTotal = grants.reduce((s, g) => s + g.delta, 0);

  const prior = await prisma.aiCreditTransaction.findMany({
    where: {
      businessId,
      kind: "revert",
      meta: { path: ["revertedSource"], equals: "admin_grant" },
      AND:  [{ meta: { path: ["overrideId"], equals: overrideId } }],
    },
    select: { delta: true },
  });
  const priorReverted = prior.reduce((s, p) => s + Math.abs(p.delta), 0);
  const owed = Math.max(0, grantedTotal - priorReverted);
  if (owed <= 0) return { reverted: 0 };

  const reverted = await prisma.$transaction((tx) =>
    writeRevert(tx, businessId, owed, reason, {
      revertedSource: "admin_grant",
      overrideId,
    }),
  );
  return { reverted };
}

// Refund a specific credit pack. Reverts whatever portion of that
// pack's grant is still in the wallet (accounting for prior expiries
// and refunds). Idempotent.
export async function refundPurchase(
  purchaseTxnId: string,
  reason: string = "Credit pack refunded",
): Promise<{ reverted: number }> {
  const purchase = await prisma.aiCreditTransaction.findFirst({
    where: { id: purchaseTxnId, kind: "purchase" },
    select: { id: true, businessId: true, delta: true },
  });
  if (!purchase) return { reverted: 0 };

  const writedowns = await prisma.aiCreditTransaction.findMany({
    where: {
      businessId: purchase.businessId,
      OR: [
        { kind: "expiry", meta: { path: ["purchaseTxnId"], equals: purchase.id } },
        { kind: "revert", meta: { path: ["revertedSource"], equals: "purchase" }, AND: [{ meta: { path: ["purchaseTxnId"], equals: purchase.id } }] },
      ],
    },
    select: { delta: true },
  });
  const written = writedowns.reduce((s, w) => s + Math.abs(w.delta), 0);
  const owed = Math.max(0, purchase.delta - written);
  if (owed <= 0) return { reverted: 0 };

  const reverted = await prisma.$transaction((tx) =>
    writeRevert(tx, purchase.businessId, owed, reason, {
      revertedSource: "purchase",
      purchaseTxnId:  purchase.id,
    }),
  );
  return { reverted };
}

// Revert recurring monthly_grant credits. Called when the workspace
// transitions off a recurring plan (subscription lapsed, override
// expired with no underlying sub). Protected: pack credits that are
// still active are kept whole.
export async function revertMonthlyGrants(
  businessId: string,
  reason: string = "Plan no longer active",
): Promise<{ reverted: number }> {
  const grants = await prisma.aiCreditTransaction.findMany({
    where: { businessId, kind: "monthly_grant" },
    select: { delta: true },
  });
  if (grants.length === 0) return { reverted: 0 };
  const grantedTotal = grants.reduce((s, g) => s + g.delta, 0);

  const prior = await prisma.aiCreditTransaction.findMany({
    where: {
      businessId,
      kind: "revert",
      meta: { path: ["revertedSource"], equals: "monthly_grant" },
    },
    select: { delta: true },
  });
  const priorReverted = prior.reduce((s, p) => s + Math.abs(p.delta), 0);
  const owed = Math.max(0, grantedTotal - priorReverted);
  if (owed <= 0) return { reverted: 0 };

  const wallet = await prisma.aiCreditWallet.findUnique({ where: { businessId } });
  if (!wallet) return { reverted: 0 };
  const protectedPacks = await getProtectedPackCredits(businessId);
  const revertCap = Math.max(0, wallet.balance - protectedPacks);
  const amount = Math.min(owed, revertCap);
  if (amount <= 0) return { reverted: 0 };

  const reverted = await prisma.$transaction((tx) =>
    writeRevert(tx, businessId, amount, reason, {
      revertedSource: "monthly_grant",
    }),
  );
  return { reverted };
}

// Top-level reconciler. Run after any entitlement change (override
// revoke, sub lapse, plan downgrade, daily sweep) to bring the wallet
// back in line with the current plan. Safe + cheap to call on every
// read - all helpers are idempotent.
//
// Right now this covers the subscription-lapsed case. Override
// reversions and pack refunds are invoked at their respective
// endpoints because they have a specific reference id we need.
export async function reconcileEntitledCredits(
  businessId: string,
): Promise<{ reverted: number }> {
  const plan = await getPlanFor(businessId);
  const limits = getPlanLimits(plan);
  // Recurring allowance gone → any remaining monthly_grant credits
  // belong to a stopped subscription. Revert them.
  if (limits.monthlyAICredits <= 0) {
    return revertMonthlyGrants(businessId);
  }
  return { reverted: 0 };
}
