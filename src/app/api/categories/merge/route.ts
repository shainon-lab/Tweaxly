// POST /api/categories/merge
//
// Merge one category into another. Same shape as /api/vendors/merge  - 
// used by the Categories & Vendors screen to collapse duplicates
// (e.g. "Software" + "Software & SaaS" → "Software").
//
// Steps inside one DB transaction:
//   1. Verify both categories belong to this workspace.
//   2. Re-point every Transaction.categoryId from FROM to TO.
//   3. Re-point every Vendor.categoryId pin from FROM to TO.
//   4. Re-point every CategorizationRule.categoryId from FROM to TO.
//   5. Delete the FROM category row.
//
// Body: { fromCategoryId: string; toCategoryId: string }
// Response: { ok: true; transactionsReassigned: number }

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Body {
  fromCategoryId: string;
  toCategoryId:   string;
}

export async function POST(req: NextRequest) {
  try {
    const { business } = await requireBusiness();
    const body = (await req.json()) as Body;
    if (!body.fromCategoryId || !body.toCategoryId) {
      return NextResponse.json({ error: "fromCategoryId + toCategoryId required" }, { status: 400 });
    }
    if (body.fromCategoryId === body.toCategoryId) {
      return NextResponse.json({ error: "Cannot merge a category into itself." }, { status: 400 });
    }
    const [from, to] = await Promise.all([
      prisma.category.findFirst({ where: { id: body.fromCategoryId, businessId: business.id } }),
      prisma.category.findFirst({ where: { id: body.toCategoryId,   businessId: business.id } }),
    ]);
    if (!from || !to) {
      return NextResponse.json({ error: "Category not found in this workspace." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const txns = await tx.transaction.updateMany({
        where: { businessId: business.id, categoryId: from.id },
        data:  { categoryId: to.id },
      });
      await tx.vendor.updateMany({
        where: { businessId: business.id, categoryId: from.id },
        data:  { categoryId: to.id },
      });
      await tx.categorizationRule.updateMany({
        where: { businessId: business.id, categoryId: from.id },
        data:  { categoryId: to.id },
      });
      await tx.category.delete({ where: { id: from.id } });
      return txns.count;
    });

    return NextResponse.json({ ok: true, transactionsReassigned: result });
  } catch (err) {
    console.error("[/api/categories/merge]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "merge failed" }, { status: 500 });
  }
}
