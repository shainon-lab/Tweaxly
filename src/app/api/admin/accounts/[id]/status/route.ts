// PATCH /api/admin/accounts/[id]/status
//   body: { status: "active" | "suspended" | "demo" | "test" }
// super_admin only. Updates Business.status and logs.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const ALLOWED = new Set(["active", "suspended", "demo", "test"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const next = body.status;
  if (!next || !ALLOWED.has(next)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const before = await prisma.business.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, name: true },
  });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.business.update({
    where: { id: params.id },
    data: { status: next },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "account.status_change",
    targetBusinessId: params.id,
    metadata: {
      businessName: before.name,
      from: before.status,
      to: next,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, status: next });
}
