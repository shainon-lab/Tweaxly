import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "categoryId",
  "accountingMonth",
  "isRecurring",
  "isOneTime",
  "isExcludedFromPnl",
  "excludeNote",
  "vendor",
  "notes",
]);

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json() as { id: string; patch: Record<string, unknown> };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.patch ?? {})) {
    if (!ALLOWED.has(k)) continue;
    data[k] = v;
  }
  if (data.accountingMonth && typeof data.accountingMonth === "string" && !/^\d{4}-\d{2}$/.test(data.accountingMonth)) {
    return NextResponse.json({ error: "accountingMonth must be YYYY-MM" }, { status: 400 });
  }
  if (data.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: String(data.categoryId), businessId: business.id } });
    if (!cat) return NextResponse.json({ error: "bad category" }, { status: 400 });
  }
  await prisma.transaction.updateMany({
    where: { id: body.id, businessId: business.id },
    data,
  });
  return NextResponse.json({ ok: true });
}
