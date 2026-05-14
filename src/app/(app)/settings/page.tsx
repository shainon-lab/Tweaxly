import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncVendorsFromTransactions } from "@/lib/vendorSync";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import SettingsClient from "./SettingsClient";

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
  // Revenue (income) categories first, then outcome categories — applied
  // everywhere a category list is rendered.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Business profile and branding, plus categories, vendors, and the rules that auto-classify your transactions."
      />
      <SettingsClient
        business={{
          id: business.id, name: business.name, currency: business.currency,
          fiscalStartMonth: business.fiscalStartMonth,
          vatEnabled: business.vatEnabled, vatRate: business.vatRate ?? 0,
          logoData: business.logoData ?? null,
          faviconData: business.faviconData ?? null,
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
      />
    </>
  );
}
