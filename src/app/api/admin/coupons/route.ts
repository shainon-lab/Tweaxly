// POST /api/admin/coupons
//   Creates a new coupon. super_admin only. Audit-logged.
//   body matches the Coupon model surface area; code is required +
//   normalised to upper-case for readability (but stored as-typed
//   to preserve admin intent - the redemption path matches case-
//   insensitively in the billing library).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const VALID_KINDS = ["percentage", "fixed_amount", "credits", "trial_extension"] as const;
const VALID_PLANS = ["free", "pro", "business"] as const;
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

export async function POST(req: Request) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });
  if (code.length > 64) return NextResponse.json({ error: "code_too_long" }, { status: 400 });

  const kind = typeof body.kind === "string" && (VALID_KINDS as readonly string[]).includes(body.kind)
    ? body.kind
    : null;
  if (!kind) return NextResponse.json({ error: "invalid_kind" }, { status: 400 });

  const value = typeof body.value === "number" && Number.isFinite(body.value) && body.value > 0
    ? Math.floor(body.value)
    : NaN;
  if (!Number.isFinite(value)) return NextResponse.json({ error: "invalid_value" }, { status: 400 });
  if (kind === "percentage" && value > 100) {
    return NextResponse.json({ error: "percentage_out_of_range" }, { status: 400 });
  }

  // Conflict check - code is unique.
  const existing = await prisma.coupon.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "code_taken" }, { status: 409 });

  const maxRedemptions = typeof body.maxRedemptions === "number" && body.maxRedemptions > 0
    ? Math.floor(body.maxRedemptions) : null;
  const maxPerUser = typeof body.maxPerUser === "number" && body.maxPerUser > 0
    ? Math.floor(body.maxPerUser) : null;

  const billingCycle = (kind === "percentage" || kind === "fixed_amount")
    && typeof body.billingCycle === "string"
    && (VALID_CYCLES as readonly string[]).includes(body.billingCycle)
    ? body.billingCycle : null;
  const cycleCount = billingCycle === "limited_cycles"
    && typeof body.cycleCount === "number" && body.cycleCount > 0
    ? Math.floor(body.cycleCount) : null;

  const coupon = await prisma.coupon.create({
    data: {
      code,
      kind,
      value,
      maxRedemptions,
      maxPerUser,
      startsAt:        asDateOrNull(body.startsAt),
      expiresAt:       asDateOrNull(body.expiresAt),
      applicablePlans: asPlanArray(body.applicablePlans),
      excludedPlans:   asPlanArray(body.excludedPlans),
      billingCycle,
      cycleCount,
      targetEmail:     typeof body.targetEmail === "string" && body.targetEmail.trim()
                         ? body.targetEmail.trim().toLowerCase()
                         : null,
      internalNote:    typeof body.internalNote === "string" && body.internalNote.trim()
                         ? body.internalNote.trim().slice(0, 1000)
                         : null,
      disabled:        Boolean(body.disabled),
      createdById:     auth.user.id,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "coupon.created",
    metadata:    { couponId: coupon.id, code: coupon.code, kind, value },
    request:     req,
  });

  return NextResponse.json({ ok: true, coupon });
}
