// PATCH /api/admin/accounts/[id]/plan
//   body: { plan?: string; trialEndsAt?: string | null }
// Update plan + trial-end on an account. super_admin only. Logged.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) return auth.response;

  let body: { plan?: string; trialEndsAt?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const before = await prisma.business.findUnique({
    where: { id: params.id },
    select: { plan: true, trialEndsAt: true, name: true },
  });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const data: { plan?: string; trialEndsAt?: Date | null } = {};
  if (typeof body.plan === "string" && body.plan.trim()) {
    data.plan = body.plan.trim();
  }
  if ("trialEndsAt" in body) {
    if (body.trialEndsAt === null || body.trialEndsAt === "") {
      data.trialEndsAt = null;
    } else if (typeof body.trialEndsAt === "string") {
      const d = new Date(body.trialEndsAt);
      if (!isNaN(d.getTime())) data.trialEndsAt = d;
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  await prisma.business.update({ where: { id: params.id }, data });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "account.plan_change",
    targetBusinessId: params.id,
    metadata: {
      businessName: before.name,
      from: { plan: before.plan, trialEndsAt: before.trialEndsAt?.toISOString() ?? null },
      to:   { plan: data.plan ?? before.plan, trialEndsAt: data.trialEndsAt instanceof Date ? data.trialEndsAt.toISOString() : (data.trialEndsAt === null ? null : (before.trialEndsAt?.toISOString() ?? null)) },
    },
    request: req,
  });

  return NextResponse.json({ ok: true });
}
