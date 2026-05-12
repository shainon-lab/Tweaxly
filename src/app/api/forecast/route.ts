import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.label || !b.amount) return NextResponse.json({ error: "label + amount required" }, { status: 400 });
  const item = await prisma.forecastItem.create({
    data: {
      businessId: business.id,
      label: String(b.label),
      kind: b.kind === "income" ? "income" : "expense",
      amount: Math.abs(Number(b.amount)),
      monthsAhead: Math.max(1, Math.min(60, Number(b.monthsAhead) || 1)),
      notes: b.notes || null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.forecastItem.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
