// FinancialSource CRUD — workspace-scoped financial accounts (bank,
// credit card, PayPal, etc.) the guided import wizard uploads into.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

const SOURCE_TYPES = ["bank", "credit_card", "paypal", "payment_provider", "cash", "other"] as const;
const YM_RE = /^\d{4}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { business } = await requireBusiness();
  const sp = new URL(req.url).searchParams;
  const includeArchived = sp.get("includeArchived") === "1";
  const rows = await prisma.financialSource.findMany({
    where: {
      businessId: business.id,
      ...(includeArchived ? {} : { status: "active" }),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { uploadBatches: { where: { status: "active" } } } },
      uploadBatches: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, periodStart: true, periodEnd: true },
      },
    },
  });
  return NextResponse.json({
    sources: rows.map((s) => ({
      id:           s.id,
      name:         s.name,
      type:         s.type,
      currency:     s.currency,
      last4:        s.last4,
      startMonth:   s.startMonth,
      status:       s.status,
      batchCount:   s._count.uploadBatches,
      lastImportAt: s.uploadBatches[0]?.createdAt?.toISOString() ?? null,
      lastImportPeriod:
        s.uploadBatches[0]?.periodStart
          ? `${s.uploadBatches[0].periodStart}${s.uploadBatches[0].periodEnd && s.uploadBatches[0].periodEnd !== s.uploadBatches[0].periodStart ? `..${s.uploadBatches[0].periodEnd}` : ""}`
          : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { business, user } = await requireBusiness();
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "").trim();
    const currency = String(body.currency ?? "").trim().toUpperCase();
    const last4 = body.last4 ? String(body.last4).trim() : null;
    const startMonth = String(body.startMonth ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!(SOURCE_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: `type must be one of ${SOURCE_TYPES.join(", ")}` }, { status: 400 });
    }
    if (currency.length !== 3) return NextResponse.json({ error: "Currency must be a 3-letter code." }, { status: 400 });
    if (!YM_RE.test(startMonth)) return NextResponse.json({ error: "startMonth must be YYYY-MM." }, { status: 400 });
    if (last4 && !/^\d{2,4}$/.test(last4)) return NextResponse.json({ error: "last4 must be 2-4 digits." }, { status: 400 });
    const existing = await prisma.financialSource.findUnique({
      where: { businessId_name: { businessId: business.id, name } },
    });
    if (existing) {
      return NextResponse.json({ error: "A source with this name already exists." }, { status: 409 });
    }
    const created = await prisma.financialSource.create({
      data: { businessId: business.id, name, type, currency, last4, startMonth },
    });
    await recordAudit({
      actorUserId: user.id,
      action: "source.created",
      targetBusinessId: business.id,
      metadata: { sourceId: created.id, name, type, currency, last4, startMonth },
      request: req,
    });
    return NextResponse.json({ id: created.id, name: created.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create failed";
    console.error("[/api/financial-sources POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
