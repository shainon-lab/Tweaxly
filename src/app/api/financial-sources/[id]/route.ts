// Per-source PATCH (edit) and DELETE (archive - never hard-delete since
// historical uploads reference the source).

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const YM_RE = /^\d{4}-\d{2}$/;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { business } = await requireBusiness();
    const { id } = await params;
    const owned = await prisma.financialSource.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Source not found in this workspace." }, { status: 404 });
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.last4 === "string" || body.last4 === null) patch.last4 = body.last4 || null;
    if (typeof body.startMonth === "string") {
      if (!YM_RE.test(body.startMonth)) return NextResponse.json({ error: "startMonth must be YYYY-MM." }, { status: 400 });
      patch.startMonth = body.startMonth;
    }
    if (body.status === "active" || body.status === "archived") patch.status = body.status;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const updated = await prisma.financialSource.update({
      where: { id }, data: patch,
    });
    return NextResponse.json({ id: updated.id, name: updated.name, status: updated.status });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A source with this name already exists." }, { status: 409 });
    }
    console.error("[/api/financial-sources PATCH]", err);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Soft archive - preserves the audit chain. To truly remove, the user
  // must first delete all UploadBatches via the Data Log.
  try {
    const { business } = await requireBusiness();
    const { id } = await params;
    const owned = await prisma.financialSource.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Source not found in this workspace." }, { status: 404 });
    await prisma.financialSource.update({
      where: { id }, data: { status: "archived" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/financial-sources DELETE]", err);
    return NextResponse.json({ error: "archive failed" }, { status: 500 });
  }
}
