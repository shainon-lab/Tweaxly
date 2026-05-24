// POST /api/vendors/merge
//
// Merge one vendor into another. Used by the Categories & Vendors
// screen to deduplicate vendors that came in spelled differently
// across uploads ("AMAZON.COM" vs "Amazon.com" vs "AMAZON").
//
// Steps inside one DB transaction:
//   1. Verify both vendors belong to this workspace.
//   2. Re-point every Transaction.vendor matching the FROM name (case-
//      insensitive) to the TO name.
//   3. If the TO vendor has no categoryId but the FROM did, copy it
//      across so the merged vendor inherits the pinned category.
//   4. If any Category had primaryVendorId = from, repoint to to.
//   5. Delete the FROM vendor row.
//
// Body: { fromVendorId: string; toVendorId: string }
// Response: { ok: true; transactionsReassigned: number }

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Body {
  fromVendorId: string;
  toVendorId:   string;
}

export async function POST(req: NextRequest) {
  try {
    const { business } = await requireBusiness();
    const body = (await req.json()) as Body;
    if (!body.fromVendorId || !body.toVendorId) {
      return NextResponse.json({ error: "fromVendorId + toVendorId required" }, { status: 400 });
    }
    if (body.fromVendorId === body.toVendorId) {
      return NextResponse.json({ error: "Cannot merge a vendor into itself." }, { status: 400 });
    }
    const [from, to] = await Promise.all([
      prisma.vendor.findFirst({ where: { id: body.fromVendorId, businessId: business.id } }),
      prisma.vendor.findFirst({ where: { id: body.toVendorId,   businessId: business.id } }),
    ]);
    if (!from || !to) {
      return NextResponse.json({ error: "Vendor not found in this workspace." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reassign transactions by vendor string (case-insensitive).
      const txns = await tx.transaction.updateMany({
        where: {
          businessId: business.id,
          vendor:     { equals: from.name, mode: "insensitive" },
        },
        data: { vendor: to.name },
      });
      // Inherit categoryId / isOneTime if the TO row was blank but FROM had it.
      const patch: { categoryId?: string; isOneTime?: boolean } = {};
      if (!to.categoryId && from.categoryId) patch.categoryId = from.categoryId;
      if (!to.isOneTime  && from.isOneTime)  patch.isOneTime  = true;
      if (Object.keys(patch).length > 0) {
        await tx.vendor.update({ where: { id: to.id }, data: patch });
      }
      // Move any Category.primaryVendor pointers off the source.
      await tx.category.updateMany({
        where: { businessId: business.id, primaryVendorId: from.id },
        data:  { primaryVendorId: to.id },
      });
      // Finally drop the source row.
      await tx.vendor.delete({ where: { id: from.id } });
      return txns.count;
    });

    return NextResponse.json({ ok: true, transactionsReassigned: result });
  } catch (err) {
    console.error("[/api/vendors/merge]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "merge failed" }, { status: 500 });
  }
}
