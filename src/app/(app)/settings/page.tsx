import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncVendorsFromTransactions } from "@/lib/vendorSync";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import SettingsClient from "./SettingsClient";
import RulesClient from "../rules/RulesClient";

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
      <PageHeader title="Settings" subtitle="Business profile, categories, vendors, and categorization rules." />
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
      />

      <div className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Categorization rules</h2>
          <p className="text-xs text-slate-400">If a description or vendor matches your pattern, the system auto-assigns the category. Higher priority wins.</p>
        </div>
        <RulesClient
          rules={rules.map((r) => ({
            id: r.id, matchField: r.matchField, matchType: r.matchType, pattern: r.pattern,
            categoryId: r.categoryId, priority: r.priority,
            setRecurring: r.setRecurring, setOneTime: r.setOneTime,
          }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </>
  );
}
