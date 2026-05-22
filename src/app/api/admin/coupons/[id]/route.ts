// PATCH /api/admin/coupons/[id]
//   Update mutable fields on a coupon. code + kind are immutable
//   (the form locks them in edit mode) - changing those means
//   making a new coupon and disabling the old.
//
// DELETE /api/admin/coupons/[id]
//   Hard-delete a coupon. Refuses if redemption history exists -
//   in that case admins should disable instead, so the audit
//   trail survives.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const VALID_PLANS = ["free", "pro"] as const;
const VALID_CYCLES = ["first_payment", "recurring_forever", "limited_cycles"] as const;

function asPlanArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && (VALID_PLANS as readonly string[]).includes(x));
}
function asDateOrNull(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const data: Record<string, unknown> = {};

  if ("value" in body) {
    if (typeof body.value === "number" && body.value > 0) {
      if (existing.kind === "percentage" && body.value > 100) {
        return NextResponse.json({ error: "percentage_out_of_range" }, { status: 400 });
      }
      data.value = Math.floor(body.value);
    } else {
      return NextResponse.json({ error: "invalid_value" }, { status: 400 });
    }
  }
  if ("maxRedemptions" in body) data.maxRedemptions = typeof body.maxRedemptions === "number" && body.maxRedemptions > 0 ? Math.floor(body.maxRedemptions) : null;
  if ("maxPerUser"     in body) data.maxPerUser     = typeof body.maxPerUser     === "number" && body.maxPerUser     > 0 ? Math.floor(body.maxPerUser)     : null;
  if ("startsAt"       in body) data.startsAt       = asDateOrNull(body.startsAt);
  if ("expiresAt"      in body) data.expiresAt      = asDateOrNull(body.expiresAt);
  if ("applicablePlans" in body) data.applicablePlans = asPlanArray(body.applicablePlans);
  if ("excludedPlans"   in body) data.excludedPlans   = asPlanArray(body.excludedPlans);
  if ("billingCycle"    in body) {
    data.billingCycle = (existing.kind === "percentage" || existing.kind === "fixed_amount")
      && typeof body.billingCycle === "string"
      && (VALID_CYCLES as readonly string[]).includes(body.billingCycle)
      ? body.billingCycle : null;
  }
  if ("cycleCount" in body) {
    data.cycleCount = typeof body.cycleCount === "number" && body.cycleCount > 0
      ? Math.floor(body.cycleCount) : null;
  }
  if ("targetEmail"  in body) {
    data.targetEmail = typeof body.targetEmail === "string" && body.targetEmail.trim()
      ? body.targetEmail.trim().toLowerCase() : null;
  }
  if ("internalNote" in body) {
    data.internalNote = typeof body.internalNote === "string" && body.internalNote.trim()
      ? body.internalNote.trim().slice(0, 1000) : null;
  }
  if ("disabled" in body) data.disabled = Boolean(body.disabled);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const updated = await prisma.coupon.update({ where: { id: existing.id }, data });

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "coupon.updated",
    metadata:    { couponId: updated.id, code: updated.code, changes: Object.keys(data) },
    request:     req,
  });

  return NextResponse.json({ ok: true, coupon: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const coupon = await prisma.coupon.findUnique({
    where: { id: params.id },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!coupon) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (coupon._count.redemptions > 0) {
    return NextResponse.json({
      error:   "has_redemptions",
      message: "Coupon has redemption history. Disable it instead.",
    }, { status: 409 });
  }

  await prisma.coupon.delete({ where: { id: coupon.id } });

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "coupon.deleted",
    metadata:    { couponId: coupon.id, code: coupon.code },
    request:     req,
  });

  return NextResponse.json({ ok: true });
}
