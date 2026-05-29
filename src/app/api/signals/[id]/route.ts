// PATCH /api/signals/[id]
//   body: { action: "mark_read" | "mark_resolved" }
//
// Workspace-scoped action on a persisted BusinessSignal.
//
//   "mark_read"     - user has seen the signal but the condition still
//                     applies. Moves status active -> acknowledged.
//                     The card stays visible but visually de-emphasised.
//                     Zero AI credits.
//
//   "mark_resolved" - user is closing the signal out. Drops it from
//                     the active list (the signals page filters
//                     resolved rows out by default). Zero AI credits.
//                     resolvedBy is stamped "user" so a later sweep
//                     does not "re-create" the same signal - we only
//                     re-open if the system itself sees the condition
//                     re-emerge from a future evaluation.
//
// Both actions are free (no Claude / no AI credit deduction).

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;

  let body: { action?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }
  const action = typeof body.action === "string" ? body.action : "";

  const signal = await prisma.businessSignal.findUnique({ where: { id } });
  if (!signal || signal.businessId !== business.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "mark_read") {
    if (signal.status === "resolved" || signal.status === "archived") {
      return NextResponse.json({ error: "invalid_state" }, { status: 409 });
    }
    const updated = await prisma.businessSignal.update({
      where: { id },
      data:  {
        status:         "acknowledged",
        acknowledgedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  if (action === "mark_resolved") {
    if (signal.status === "resolved" || signal.status === "archived") {
      return NextResponse.json({ error: "invalid_state" }, { status: 409 });
    }
    const updated = await prisma.businessSignal.update({
      where: { id },
      data:  {
        status:     "resolved",
        resolvedAt: new Date(),
        resolvedBy: "user",
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
