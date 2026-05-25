// VendorizationRule CRUD. Pattern → vendor name rewriter applied
// during /api/upload/commit before any category logic, so the
// canonical vendor name flows into Vendor.categoryId lookup and the
// Vendor row auto-create.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_FIELDS = ["description", "vendor", "source"] as const;
const ALLOWED_TYPES  = ["contains", "equals", "startsWith", "regex"] as const;

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json();
  const vendorName = String(body.vendorName ?? "").trim();
  const pattern    = String(body.pattern ?? "").trim();
  if (!pattern || !vendorName) {
    return NextResponse.json({ error: "pattern + vendorName required" }, { status: 400 });
  }
  const rule = await prisma.vendorizationRule.create({
    data: {
      businessId: business.id,
      matchField: ALLOWED_FIELDS.includes(body.matchField) ? body.matchField : "description",
      matchType:  ALLOWED_TYPES.includes(body.matchType)   ? body.matchType  : "contains",
      pattern,
      vendorName,
      priority:   Number(body.priority ?? 0) || 0,
    },
  });
  // Upsert the canonical Vendor row so vendor.categoryId lookups
  // can pin a category to it later. Safe if it already exists.
  await prisma.vendor.upsert({
    where:  { businessId_name: { businessId: business.id, name: vendorName } },
    update: {},
    create: { businessId: business.id, name: vendorName },
  }).catch(() => null);
  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.vendorizationRule.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
