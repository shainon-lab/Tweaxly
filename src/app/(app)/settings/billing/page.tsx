// Settings → Billing & Credits.
// Self-service view of the user's effective plan, AI credit wallet,
// transaction history and a redeem-promo-code box. The same data the
// admin can see in /admin/accounts/[id], rendered for the owner.
//
// All numbers come from the same billing library the rest of the
// product uses - effective plan composes AdminPlanOverride >
// Subscription > "free" default; the wallet is the denormalised
// running balance whose source of truth is the AiCreditTransaction
// ledger.

import PageHeader from "@/components/PageHeader";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getEffectivePlan, ensureMonthlyAllowance, getPlanLimits,
  PLANS, CREDIT_COSTS, CREDIT_PACKS,
} from "@/lib/billing";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingSettingsPage() {
  const { business } = await requireBusiness();

  // Lazy-bootstrap so legacy businesses get a wallet on first visit.
  await ensureMonthlyAllowance(business.id);

  const [effective, wallet, recentTxns] = await Promise.all([
    getEffectivePlan(business.id),
    prisma.aiCreditWallet.findUnique({ where: { businessId: business.id } }),
    prisma.aiCreditTransaction.findMany({
      where:   { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take:    25,
    }),
  ]);

  const limits = getPlanLimits(effective.plan);

  return (
    <div className="container-wide py-8">
      <PageHeader
        title="Billing & Credits"
        subtitle="Your plan, AI Credit balance, and recent activity."
      />
      <BusinessSettingsTabs />

      <BillingClient
        plan={effective.plan}
        planSource={effective.source}
        readOnly={effective.readOnly}
        currentPeriodEnd={effective.currentPeriodEnd?.toISOString() ?? null}
        cancelAtPeriodEnd={effective.cancelAtPeriodEnd ?? false}
        walletBalance={wallet?.balance ?? 0}
        monthlyAllowance={wallet?.monthlyAllowance ?? limits.monthlyAICredits}
        periodStart={wallet?.periodStart?.toISOString() ?? null}
        lifetimeGranted={wallet?.lifetimeGranted ?? 0}
        lifetimeConsumed={wallet?.lifetimeConsumed ?? 0}
        creditCosts={CREDIT_COSTS}
        creditPacks={CREDIT_PACKS}
        availablePlans={PLANS.map((p) => ({
          key:        p.key,
          label:      p.label,
          priceCents: p.priceCents,
          monthlyCredits: p.limits.monthlyAICredits,
        }))}
        transactions={recentTxns.map((t) => ({
          id:           t.id,
          delta:        t.delta,
          kind:         t.kind,
          reason:       t.reason,
          balanceAfter: t.balanceAfter,
          expiresAt:    t.expiresAt?.toISOString() ?? null,
          createdAt:    t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
