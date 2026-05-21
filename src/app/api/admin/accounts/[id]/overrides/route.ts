// POST /api/admin/accounts/[id]/overrides
//   body: {
//     plan:           "free" | "pro" | "business";
//     kind?:          "full_paid" | "trial_extension" | "unlimited_credits" | "custom";
//     effectiveUntil?: string | null;   // ISO date; null/missing = indefinite
//     creditsGranted?: number;          // optional one-time AI Credit grant
//     note?:           string;
//   }
//
// Creates a new AdminPlanOverride for the given business. The override
// wins over the (currently unused) Subscription row while active; the
// effective plan is resolved by getEffectivePlan() in @/lib/billing.
// Audit-logged. super_admin only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { grantCredits, isPlanKey } from "@/lib/billing";

const VALID_KINDS = ["full_paid", "trial_extension", "unlimited_credits", "custom"] as const;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: {
    plan?: unknown;
    kind?: unknown;
    effectiveUntil?: unknown;
    creditsGranted?: unknown;
    note?: unknown;
  };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  if (typeof body.plan !== "string" || !isPlanKey(body.plan)) {
    return NextResponse.json({ error: "invalid_plan", message: "plan must be 'free' | 'pro' | 'business'" }, { status: 400 });
  }
  const kind = typeof body.kind === "string" && (VALID_KINDS as readonly string[]).includes(body.kind)
    ? body.kind
    : "full_paid";

  let effectiveUntil: Date | null = null;
  if (body.effectiveUntil != null && body.effectiveUntil !== "") {
    const d = new Date(String(body.effectiveUntil));
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    effectiveUntil = d;
  }

  const creditsGranted = typeof body.creditsGranted === "number" && Number.isFinite(body.creditsGranted) && body.creditsGranted > 0
    ? Math.floor(body.creditsGranted)
    : null;
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;

  // Confirm business exists; pull the name for the audit log.
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const override = await prisma.adminPlanOverride.create({
    data: {
      businessId:     business.id,
      assignedById:   auth.user.id,
      plan:           body.plan,
      kind,
      effectiveUntil,
      creditsGranted,
      note,
    },
  });

  // If the admin attached an initial credit grant, apply it through the
  // ledger so the wallet + transaction history reflect the gift.
  if (creditsGranted) {
    await grantCredits(business.id, creditsGranted, "admin_grant", {
      reason: `Override grant by admin (${kind})`,
      meta:   { overrideId: override.id, adminUserId: auth.user.id },
    });
  }

  await recordAudit({
    actorUserId: auth.user.id,
    action:      "account.plan_override_created",
    targetBusinessId: business.id,
    metadata: {
      businessName: business.name,
      plan:         body.plan,
      kind,
      effectiveUntil: effectiveUntil?.toISOString() ?? null,
      creditsGranted,
      note,
      overrideId:   override.id,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, override });
}
