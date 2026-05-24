import PageHeader from "@/components/PageHeader";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareCategoriesIncomeFirst } from "@/lib/categories";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; source?: string; ym?: string; uncategorized?: string; vendor?: string }> }) {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  const sp = await searchParams;
  const where: Record<string, unknown> = { businessId: business.id };
  if (sp.q) where.OR = [
    { description: { contains: sp.q } },
    { vendor: { contains: sp.q } },
  ];
  if (sp.source) where.source = sp.source;
  if (sp.ym) where.accountingMonth = sp.ym;
  // ?vendor=X — exact (case-insensitive) match on the Transaction.vendor
  // string. Powers the "drill into transactions for this vendor" link
  // from Settings → Categories & Vendors → Vendors table.
  if (sp.vendor) where.vendor = { equals: sp.vendor, mode: "insensitive" };
  // Uncategorized = no category OR catch-all bucket. Matches both the
  // new "Undefined Category" name (assigned by the upload commit when
  // no Category column was mapped) and the legacy "Uncategorized"
  // name from older data.
  if (sp.uncategorized === "1") where.OR = [
    { categoryId: null },
    { category: { name: "Uncategorized" } },
    { category: { name: "Undefined Category" } },
  ];

  const [txns, categoriesRaw, months, sources] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: 500,
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
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
  // has anything in the recycle bin — owners might forget about
  // batches they trashed last week.
  const trashCount = await prisma.trashBatch.count({ where: { businessId: business.id } });

  return (
    <>
      <PageHeader
        title={t("page.transactions.title")}
        subtitle={`Transactions - ${txns.length} shown. Categorize, mark one-time, exclude from P&L, override accounting month.`}
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
        months={months.map((m) => m.accountingMonth)}
        sources={sources.map((s) => s.source)}
        currency={business.currency}
        filters={{ q: sp.q ?? "", source: sp.source ?? "", ym: sp.ym ?? "", uncategorized: sp.uncategorized === "1" }}
      />
    </>
  );
}
