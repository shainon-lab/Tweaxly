import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const KINDS = new Set([
  "revenue",
  "fixed",
  "variable",
  "payroll",
  "fee",
  "tax",
  "transfer",
  "other",
]);

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.name || !KINDS.has(b.kind)) {
    return NextResponse.json(
      { error: "name + valid kind required" },
      { status: 400 },
    );
  }
  const exists = await prisma.category.findFirst({
    where: { businessId: business.id, name: b.name },
  });
  if (exists) {
    return NextResponse.json({ error: "category exists" }, { status: 409 });
  }
  const cat = await prisma.category.create({
    data: {
      businessId: business.id,
      name: String(b.name),
      kind: b.kind,
      isOneTime: !!b.isOneTime,
    },
  });
  return NextResponse.json(cat);
}

// PATCH - update a category. Supports:
//   - kind change (with optional `flipSigns: true` to re-sign all materialized
//     transactions in this category to match the new kind)
//   - isOneTime flag
//   - rename
export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cat = await prisma.category.findFirst({
    where: { id: String(b.id), businessId: business.id },
  });
  if (!cat) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim().length > 0) {
    data.name = b.name.trim();
  }
  if (typeof b.kind === "string") {
    if (!KINDS.has(b.kind)) {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }
    data.kind = b.kind;
  }
  if (typeof b.isOneTime === "boolean") {
    data.isOneTime = b.isOneTime;
  }
  // Primary vendor - pass null to clear, or a vendor id (must belong to the
  // same business). The Settings categories table uses this for the "GENERAL
  // / pick vendor" cell.
  if ("primaryVendorId" in b) {
    if (b.primaryVendorId === null || b.primaryVendorId === "") {
      data.primaryVendorId = null;
    } else if (typeof b.primaryVendorId === "string") {
      const vendor = await prisma.vendor.findFirst({
        where: { id: b.primaryVendorId, businessId: business.id },
      });
      if (!vendor) {
        return NextResponse.json({ error: "invalid primaryVendorId" }, { status: 400 });
      }
      data.primaryVendorId = vendor.id;
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const updated = await prisma.category.update({
    where: { id: cat.id },
    data,
  });

  // If the kind changed and `flipSigns` is true, re-sign every transaction in
  // this category so the dashboard / data flow numbers immediately match the
  // new classification. Specifically:
  //   revenue       → all amounts forced to positive, type "income"
  //   anything else → all amounts forced to negative, type "expense"
  let resignedCount = 0;
  if (b.flipSigns === true && typeof b.kind === "string" && b.kind !== cat.kind) {
    const txns = await prisma.transaction.findMany({
      where: { businessId: business.id, categoryId: cat.id },
      select: { id: true, amount: true },
    });
    const isIncomeKind = b.kind === "revenue";
    for (const t of txns) {
      const magnitude = Math.abs(t.amount);
      const newAmount = isIncomeKind ? magnitude : -magnitude;
      const newType = isIncomeKind ? "income" : "expense";
      if (newAmount !== t.amount) {
        await prisma.transaction.update({
          where: { id: t.id },
          data: { amount: newAmount, type: newType },
        });
        resignedCount++;
      } else {
        // sign already matches; just update type to be consistent
        await prisma.transaction.update({
          where: { id: t.id },
          data: { type: newType },
        });
      }
    }
  }

  return NextResponse.json({
    category: updated,
    resignedTransactions: resignedCount,
  });
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.category.deleteMany({
    where: { id, businessId: business.id },
  });
  return NextResponse.json({ ok: true });
}
