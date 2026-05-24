// POST /api/vendors/apply-category
//
// Pin a category to a vendor so future uploads with matching vendor
// rows auto-categorize. Optionally backfill ALL past uncategorized
// transactions for that vendor with the same category in one shot.
//
// The spec calls this "vendor learning": when a user manually
// categorizes an uncategorized transaction, the system asks "apply
// to all future and/or past transactions from this vendor?" This
// endpoint is the bulk-action side of that flow.
//
// Body:
//   {
//     vendorName: string;       // case-insensitive lookup
//     categoryId: string;       // category to pin
//     applyToPast: boolean;     // also update past uncategorized rows
//   }
//
// Response:
//   { ok: true, vendorId: string, updatedPast: number }

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Body {
  vendorName:  string;
  categoryId:  string;
  applyToPast: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { business } = await requireBusiness();
    const body = (await req.json()) as Body;
    const name = (body.vendorName ?? "").trim();
    if (!name) return NextResponse.json({ error: "vendorName required" }, { status: 400 });
    if (!body.categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });

    // Verify category belongs to this workspace.
    const cat = await prisma.category.findFirst({
      where: { id: body.categoryId, businessId: business.id },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ error: "Category not found in this workspace." }, { status: 404 });

    // Upsert the Vendor row so the next upload's lookup hits the
    // pinned category. unique on (businessId, name) makes this safe.
    const vendor = await prisma.vendor.upsert({
      where:  { businessId_name: { businessId: business.id, name } },
      update: { categoryId: body.categoryId },
      create: { businessId: business.id, name, categoryId: body.categoryId },
    });

    let updatedPast = 0;
    if (body.applyToPast) {
      // Backfill: every past transaction whose vendor matches AND
      // whose current category is null OR the catch-all bucket gets
      // re-pointed at the user's chosen category. Already-categorized
      // rows are left alone — the user might have manually corrected
      // them and we shouldn't undo that.
      const res = await prisma.transaction.updateMany({
        where: {
          businessId: business.id,
          vendor: { equals: name, mode: "insensitive" },
          OR: [
            { categoryId: null },
            { category: { name: "Uncategorized" } },
            { category: { name: "Undefined Category" } },
          ],
        },
        data: { categoryId: body.categoryId },
      });
      updatedPast = res.count;
    }

    return NextResponse.json({ ok: true, vendorId: vendor.id, updatedPast });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "apply-category failed";
    console.error("[/api/vendors/apply-category]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
