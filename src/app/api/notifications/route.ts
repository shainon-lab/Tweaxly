import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const METRICS = new Set(["revenue", "expenses", "net", "category"]);
const DIRECTIONS = new Set(["increase", "decrease"]);
const THRESHOLD_TYPES = new Set(["percent", "amount"]);
const PERIODS = new Set(["month", "quarter", "year"]);

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json() as {
    metric?: string;
    categoryId?: string | null;
    direction?: string;
    thresholdType?: string;
    thresholdValue?: number;
    period?: string;
    label?: string | null;
    enabled?: boolean;
  };

  if (!body.metric || !METRICS.has(body.metric)) return bad("Invalid metric");
  if (!body.direction || !DIRECTIONS.has(body.direction)) return bad("Invalid direction");
  if (!body.thresholdType || !THRESHOLD_TYPES.has(body.thresholdType)) return bad("Invalid thresholdType");
  if (!body.period || !PERIODS.has(body.period)) return bad("Invalid period");
  if (body.thresholdValue == null || !isFinite(Number(body.thresholdValue)) || Number(body.thresholdValue) <= 0) {
    return bad("thresholdValue must be a positive number");
  }

  let categoryId: string | null = null;
  if (body.metric === "category") {
    if (!body.categoryId) return bad("categoryId is required when metric is 'category'");
    const cat = await prisma.category.findFirst({
      where: { id: body.categoryId, businessId: business.id },
    });
    if (!cat) return bad("Unknown category");
    categoryId = cat.id;
  }

  const rule = await prisma.notificationRule.create({
    data: {
      businessId: business.id,
      metric: body.metric,
      categoryId,
      direction: body.direction,
      thresholdType: body.thresholdType,
      thresholdValue: Number(body.thresholdValue),
      period: body.period,
      label: body.label?.trim() || null,
      enabled: body.enabled !== false,
    },
  });
  return NextResponse.json(rule);
}

export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json() as { id?: string; enabled?: boolean; label?: string | null };
  if (!body.id) return bad("id required");
  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if ("label" in body) data.label = body.label?.toString().trim() || null;
  await prisma.notificationRule.updateMany({
    where: { id: body.id, businessId: business.id },
    data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id required");
  await prisma.notificationRule.deleteMany({
    where: { id, businessId: business.id },
  });
  return NextResponse.json({ ok: true });
}
