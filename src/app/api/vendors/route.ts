import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// POST: create a new vendor.
// Body: { name, categoryId?, isOneTime? }
export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json() as { name?: string; categoryId?: string | null; isOneTime?: boolean };
  const name = (b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  let categoryId: string | null = null;
  if (b.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: b.categoryId, businessId: business.id },
    });
    if (!cat) return NextResponse.json({ error: "invalid category" }, { status: 400 });
    categoryId = cat.id;
  }

  // If a vendor with this name already exists, return it (idempotent create).
  const existing = await prisma.vendor.findFirst({
    where: { businessId: business.id, name },
  });
  if (existing) {
    const updated = await prisma.vendor.update({
      where: { id: existing.id },
      data: {
        categoryId,
        isOneTime: typeof b.isOneTime === "boolean" ? b.isOneTime : existing.isOneTime,
      },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.vendor.create({
    data: {
      businessId: business.id,
      name,
      categoryId,
      isOneTime: !!b.isOneTime,
    },
  });
  return NextResponse.json(created);
}

// PATCH: update a vendor — change category or toggle isOneTime.
// Body: { id, categoryId? | null, isOneTime? }
export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json() as { id?: string; categoryId?: string | null; isOneTime?: boolean };
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const vendor = await prisma.vendor.findFirst({
    where: { id: b.id, businessId: business.id },
  });
  if (!vendor) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if ("categoryId" in b) {
    if (b.categoryId === null || b.categoryId === "") {
      data.categoryId = null;
    } else if (typeof b.categoryId === "string") {
      const cat = await prisma.category.findFirst({
        where: { id: b.categoryId, businessId: business.id },
      });
      if (!cat) return NextResponse.json({ error: "invalid category" }, { status: 400 });
      data.categoryId = cat.id;
    }
  }
  if (typeof b.isOneTime === "boolean") {
    data.isOneTime = b.isOneTime;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data,
  });
  return NextResponse.json(updated);
}

// DELETE: remove a vendor.
// Query: ?id=...
export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.vendor.deleteMany({
    where: { id, businessId: business.id },
  });
  return NextResponse.json({ ok: true });
}
