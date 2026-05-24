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

  // ── Aggregates for the Categories & Vendors screen ──────────────
  // Counts + sums + last-seen-date per vendor (matched by the
  // case-sensitive `Transaction.vendor` string) and per category.
  // These power the spec's "# transactions / total amount / last
  // seen" columns. All run in parallel, all scoped to non-excluded
  // rows so excluded-from-P&L txns don't inflate the numbers.
  const [vendorAggs, categoryAggs, vendorsByCategory] = await Promise.all([
    prisma.transaction.groupBy({
      by:    ["vendor"],
      where: { businessId: business.id, vendor: { not: null }, isExcludedFromPnl: false },
      _count: { _all: true },
      _sum:   { amount: true },
      _max:   { transactionDate: true },
    }),
    prisma.transaction.groupBy({
      by:    ["categoryId"],
      where: { businessId: business.id, categoryId: { not: null }, isExcludedFromPnl: false },
      _count: { _all: true },
      _sum:   { amount: true },
    }),
    prisma.vendor.groupBy({
      by:    ["categoryId"],
      where: { businessId: business.id, categoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  // Lowercase index so the vendor.name lookup is case-insensitive.
  const vendorAggByName = new Map(
    vendorAggs
      .filter((v): v is typeof v & { vendor: string } => v.vendor != null)
      .map((v) => [v.vendor.toLowerCase(), { count: v._count._all, sum: v._sum.amount ?? 0, lastSeen: v._max.transactionDate?.toISOString() ?? null }]),
  );
  const categoryAggById = new Map(
    categoryAggs
      .filter((c): c is typeof c & { categoryId: string } => c.categoryId != null)
      .map((c) => [c.categoryId, { count: c._count._all, sum: c._sum.amount ?? 0 }]),
  );
  const vendorCountByCategoryId = new Map(
    vendorsByCategory
      .filter((v): v is typeof v & { categoryId: string } => v.categoryId != null)
      .map((v) => [v.categoryId, v._count._all]),
  );
  // Build a names-per-category map sourced from the Transaction.vendor
  // strings actually present on rows in each category (NOT from the
  // Vendor.categoryId pins, which only cover vendors the user has
  // explicitly pinned). This way the column reflects every vendor that
  // currently has activity in the category, including ones still
  // awaiting a pin.
  const txnVendorPairs = await prisma.transaction.groupBy({
    by: ["categoryId", "vendor"],
    where: {
      businessId: business.id,
      categoryId: { not: null },
      vendor:     { not: null },
      isExcludedFromPnl: false,
    },
    _count: { _all: true },
  });
  const vendorNamesByCategoryId = new Map<string, string[]>();
  for (const row of txnVendorPairs) {
    if (!row.categoryId || !row.vendor) continue;
    const list = vendorNamesByCategoryId.get(row.categoryId) ?? [];
    list.push(row.vendor);
    vendorNamesByCategoryId.set(row.categoryId, list);
  }
  for (const list of vendorNamesByCategoryId.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }

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
          transactionCount: categoryAggById.get(c.id)?.count ?? 0,
          totalAmount:      categoryAggById.get(c.id)?.sum ?? 0,
          vendorCount:      vendorCountByCategoryId.get(c.id) ?? 0,
          vendorNames:      vendorNamesByCategoryId.get(c.id) ?? [],
        }))}
        vendors={vendors.map((v) => {
          const agg = vendorAggByName.get(v.name.toLowerCase());
          return {
            id: v.id, name: v.name, categoryId: v.categoryId, isOneTime: v.isOneTime,
            transactionCount: agg?.count ?? 0,
            totalAmount:      agg?.sum ?? 0,
            lastSeenAt:       agg?.lastSeen ?? null,
          };
        })}
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
