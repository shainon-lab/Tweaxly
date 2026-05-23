import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncVendorsFromTransactions } from "@/lib/vendorSync";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import { getServerT } from "@/lib/i18n/server";
import {
  ensureMonthlyAllowance, getEffectivePlan, getPlanLimits,
  PLANS, CREDIT_COSTS, CREDIT_PACKS,
} from "@/lib/billing";
import SettingsClient from "./SettingsClient";
import { getBusinessProfile } from "@/lib/businessProfile";

export default async function SettingsPage() {
  const { business } = await requireBusiness();
  // Backfill / catch up the Vendor registry from the actual transactions
  // before we render. Existing assignments are preserved; only brand-new
  // vendors get inserted.
  await syncVendorsFromTransactions(business.id);

  const [categoriesRaw, rules, vendors] = await Promise.all([
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
    prisma.categorizationRule.findMany({
      where: { businessId: business.id },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.vendor.findMany({
      where: { businessId: business.id },
      orderBy: { name: "asc" },
    }),
  ]);
  // Revenue (income) categories first, then outcome categories - applied
  // everywhere a category list is rendered.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);
  const { t } = await getServerT();

  // ── Per-workspace billing data for the Business Profile tab ───
  // Plan + AI Credits live alongside the rest of the workspace's
  // settings now. Account-level surfaces only see a cross-workspace
  // overview; individual subscription state stays per workspace.
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
  const planLimits = getPlanLimits(effective.plan);
  const billing = {
    plan:              effective.plan,
    planSource:        effective.source,
    readOnly:          effective.readOnly,
    currentPeriodEnd:  effective.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: effective.cancelAtPeriodEnd ?? false,
    walletBalance:     wallet?.balance ?? 0,
    monthlyAllowance:  wallet?.monthlyAllowance ?? planLimits.monthlyAICredits,
    periodStart:       wallet?.periodStart?.toISOString() ?? null,
    lifetimeGranted:   wallet?.lifetimeGranted ?? 0,
    lifetimeConsumed:  wallet?.lifetimeConsumed ?? 0,
    creditCosts:       CREDIT_COSTS,
    creditPacks:       CREDIT_PACKS,
    availablePlans:    PLANS.map((p) => ({
      key:            p.key,
      label:          p.label,
      priceCents:     p.priceCents,
      monthlyCredits: p.limits.monthlyAICredits,
    })),
    transactions: recentTxns.map((tx) => ({
      id:           tx.id,
      delta:        tx.delta,
      kind:         tx.kind,
      reason:       tx.reason,
      balanceAfter: tx.balanceAfter,
      expiresAt:    tx.expiresAt?.toISOString() ?? null,
      createdAt:    tx.createdAt.toISOString(),
    })),
  };

  // Business DNA - the new strategic profile section. Renders empty
  // (with a fill-me-in CTA) when the workspace hasn't completed it.
  const profile = await getBusinessProfile(business.id);
  const businessDna = profile ? {
    industry:           profile.industry,
    businessCategory:   profile.businessCategory,
    businessModels:     profile.businessModels,
    mainGoal:           profile.mainGoal,
    customerType:       profile.customerType,
    revenueStage:       profile.revenueStage,
    biggestChallenge:   profile.biggestChallenge,
    importantKpis:      profile.importantKpis,
    aiSummary:          profile.aiSummary,
    aiSummaryUpdatedAt: profile.aiSummaryUpdatedAt?.toISOString() ?? null,
    aiContextPreferences: profile.aiContextPreferences as { toggles?: string[]; freeformNote?: string } | null,
    derivedSignals:     profile.derivedSignals,
    lastDerivedAt:      profile.lastDerivedAt?.toISOString() ?? null,
  } : null;

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />
      <SettingsClient
        business={{
          id: business.id, name: business.name, currency: business.currency,
          fiscalStartMonth: business.fiscalStartMonth,
          vatEnabled: business.vatEnabled, vatRate: business.vatRate ?? 0,
          logoData: business.logoData ?? null,
          faviconData: business.faviconData ?? null,
          country: business.country ?? null,
          timezone: business.timezone ?? null,
          industry: business.industry ?? null,
        }}
        categories={categories.map((c) => ({
          id: c.id, name: c.name, kind: c.kind, isOneTime: c.isOneTime,
          primaryVendorId: c.primaryVendorId,
        }))}
        vendors={vendors.map((v) => ({
          id: v.id, name: v.name, categoryId: v.categoryId, isOneTime: v.isOneTime,
        }))}
        rules={rules.map((r) => ({
          id: r.id, matchField: r.matchField, matchType: r.matchType, pattern: r.pattern,
          categoryId: r.categoryId, priority: r.priority,
          setRecurring: r.setRecurring, setOneTime: r.setOneTime,
        }))}
        billing={billing}
        businessDna={businessDna}
      />
    </>
  );
}
