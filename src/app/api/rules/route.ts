import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json();
  if (!body.pattern || !body.categoryId) {
    return NextResponse.json({ error: "pattern + category required" }, { status: 400 });
  }
  const cat = await prisma.category.findFirst({ where: { id: body.categoryId, businessId: business.id } });
  if (!cat) return NextResponse.json({ error: "bad category" }, { status: 400 });
  const rule = await prisma.categorizationRule.create({
    data: {
      businessId: business.id,
      matchField: ["description", "vendor", "source"].includes(body.matchField) ? body.matchField : "description",
      matchType: ["contains", "equals", "startsWith", "regex"].includes(body.matchType) ? body.matchType : "contains",
      pattern: String(body.pattern),
      categoryId: body.categoryId,
      priority: Number(body.priority ?? 0) || 0,
      setRecurring: !!body.setRecurring,
      setOneTime: !!body.setOneTime,
    },
  });
  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.categorizationRule.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
