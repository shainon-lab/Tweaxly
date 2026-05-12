// Vendor registry sync.
//
// Vendors live in their own table now so the user can assign each vendor to a
// category and see vendor lists per category in Settings. The Transaction
// table still carries a free-text `vendor` field; this helper keeps the
// Vendor table in sync with whatever vendors actually appear in transactions.
//
// Backfill rules:
//   - For every distinct non-null/non-empty transaction.vendor value, ensure
//     a Vendor row exists (one per businessId+name).
//   - If we're creating the Vendor row for the first time, set its categoryId
//     to the *most-frequent* category for that vendor's transactions, so the
//     user doesn't have to manually re-assign every existing vendor.
//   - Existing Vendor rows are NEVER overwritten — the user's explicit
//     assignment wins over any heuristic.

import { prisma } from "./db";

export async function syncVendorsFromTransactions(businessId: string): Promise<{ created: number }> {
  // Distinct (vendor, categoryId) pairs from transactions. We aggregate counts
  // so we can pick the dominant category per vendor.
  const rows = await prisma.transaction.groupBy({
    by: ["vendor", "categoryId"],
    where: {
      businessId,
      vendor: { not: null },
    },
    _count: { _all: true },
  });

  // Build vendor → category vote counts.
  const votes = new Map<string, Map<string | null, number>>();
  for (const r of rows) {
    const name = (r.vendor ?? "").trim();
    if (!name) continue;
    if (!votes.has(name)) votes.set(name, new Map());
    const bucket = votes.get(name)!;
    bucket.set(r.categoryId, (bucket.get(r.categoryId) ?? 0) + r._count._all);
  }
  if (votes.size === 0) return { created: 0 };

  // Skip vendors that already have a row — never overwrite the user's choice.
  const existing = await prisma.vendor.findMany({
    where: { businessId },
    select: { name: true },
  });
  const known = new Set(existing.map((v) => v.name));

  let created = 0;
  for (const [name, bucket] of votes) {
    if (known.has(name)) continue;
    // Pick the category with the most transactions; tie-break by non-null over null.
    let bestCatId: string | null = null;
    let bestCount = -1;
    for (const [catId, count] of bucket) {
      if (count > bestCount || (count === bestCount && bestCatId === null && catId !== null)) {
        bestCount = count;
        bestCatId = catId;
      }
    }
    await prisma.vendor.create({
      data: { businessId, name, categoryId: bestCatId },
    });
    created++;
  }
  return { created };
}
