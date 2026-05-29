import PageHeader from "@/components/PageHeader";
import DataHelp from "@/components/DataHelp";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; source?: string; ym?: string; uncategorized?: string; unvendorized?: string; vendor?: string; category?: string }> }) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const where: Record<string, unknown> = { businessId: business.id };
  if (sp.q) where.OR = [
    { description: { contains: sp.q } },
    { vendor: { contains: sp.q } },
  ];
  if (sp.source) where.source = sp.source;
  if (sp.ym) where.accountingMonth = sp.ym;
  // ?vendor=X - exact (case-insensitive) match on the Transaction.vendor
  // string. Powers the "drill into transactions for this vendor" link
  // from Settings → Categories & Vendors → Vendors table.
  if (sp.vendor) where.vendor = { equals: sp.vendor, mode: "insensitive" };
  // ?category=<id> - exact match on Transaction.categoryId. Powers the
  // drill-down link from Settings → Categories & Vendors → Categories
  // table (the mirror of the vendor drill-down).
  if (sp.category) where.categoryId = sp.category;
  // Uncategorized = no category OR catch-all bucket. Matches both the
  // new "Undefined Category" name (assigned by the upload commit when
  // no Category column was mapped) and the legacy "Uncategorized"
  // name from older data.
  if (sp.uncategorized === "1") where.OR = [
    { categoryId: null },
    { category: { name: "Uncategorized" } },
    { category: { name: "Undefined Category" } },
  ];
  // ?unvendorized=1 - matches rows where Transaction.vendor is null
  // OR empty string. Used by the "Unvendorized only" filter chip so
  // the owner can focus on rows that still need a vendor assigned.
  if (sp.unvendorized === "1") {
    const vendorClause = { OR: [{ vendor: null }, { vendor: "" }] };
    // If both uncategorized + unvendorized are set, AND them together
    // via the existing `where.OR` (becomes `AND` on the where root).
    if (where.OR) {
      where.AND = [{ OR: where.OR }, vendorClause];
      delete where.OR;
    } else {
      where.OR = vendorClause.OR;
    }
  }
  // Hide ignored rows from the focus filters - once a user has
  // explicitly marked a row as "not calculated", it's handled and
  // shouldn't keep showing up in the uncategorized / unvendorized
  // worklists. The default (neither chip checked) still shows
  // everything so the user can find an ignored row by other filters.
  if (sp.uncategorized === "1" || sp.unvendorized === "1") {
    where.isExcludedFromPnl = false;
  }

  const [txns, categoriesRaw, vendorsRaw, months, sources] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: 500,
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
    }),
    prisma.vendor.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { businessId: business.id },
      distinct: ["accountingMonth"],
      select: { accountingMonth: true },
      orderBy: { accountingMonth: "desc" },
    }),
    prisma.transaction.findMany({
      where: { businessId: business.id },
      distinct: ["source"],
      select: { source: true },
    }),
  ]);
  // Revenue (income) categories first, then outcome categories.
  const categories = categoriesRaw.slice().sort(compareCategoriesIncomeFirst);

  // Surface a quick "Trash" link in the header when the workspace
  // has anything in the recycle bin - owners might forget about
  // batches they trashed last week.
  const trashCount = await prisma.trashBatch.count({ where: { businessId: business.id } });

  return (
    <>
      <PageHeader
        title="Data - Transactions"
        subtitle={`${txns.length} shown. Categorize, mark one-time, exclude from P&L, override accounting month.`}
        help={<DataHelp />}
        right={
          trashCount > 0 ? (
            <a
              href="/transactions/trash"
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-warn/40 text-warn hover:bg-warn/10 transition inline-flex items-center gap-1.5"
              title="Restore or permanently delete recently-trashed transactions"
            >
              Trash ({trashCount})
            </a>
          ) : null
        }
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="transactions" />
      <TransactionsClient
        txns={txns.map((t) => ({
          id: t.id,
          transactionDate: t.transactionDate.toISOString(),
          accountingMonth: t.accountingMonth,
          amount: t.amount,
          currency: t.currency,
          type: t.type,
          source: t.source,
          vendor: t.vendor,
          description: t.description,
          notes: t.notes,
          isRecurring: t.isRecurring,
          isOneTime: t.isOneTime,
          isExcludedFromPnl: t.isExcludedFromPnl,
          excludeNote: t.excludeNote,
          isDuplicateCandidate: t.isDuplicateCandidate,
          categoryId: t.categoryId,
          categoryName: t.category?.name ?? "Uncategorized",
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        vendors={vendorsRaw}
        months={months.map((m) => m.accountingMonth)}
        sources={sources.map((s) => s.source)}
        currency={business.currency}
        filters={{ q: sp.q ?? "", source: sp.source ?? "", ym: sp.ym ?? "", uncategorized: sp.uncategorized === "1", unvendorized: sp.unvendorized === "1" }}
      />
    </>
  );
}
