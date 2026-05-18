// PATCH  /api/admin/accounts/[id]/members/[memberId]
//   body: { status?: "active" | "disabled"; role?: string }
// Update member status or role within an account. super_admin only.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const ALLOWED_STATUS = new Set(["active", "invited", "disabled"]);
const ALLOWED_ROLES  = new Set(["account_admin", "user", "viewer", "accountant"]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: { status?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const member = await prisma.businessMembership.findUnique({
    where: { id: params.memberId },
    include: { user: { select: { email: true } } },
  });
  if (!member || member.businessId !== params.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: { status?: string; role?: string } = {};
  if (body.status && ALLOWED_STATUS.has(body.status)) data.status = body.status;
  if (body.role   && ALLOWED_ROLES.has(body.role))    data.role   = body.role;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  await prisma.businessMembership.update({
    where: { id: params.memberId },
    data,
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "account.member_updated",
    targetBusinessId: params.id,
    metadata: {
      memberId: params.memberId,
      memberEmail: member.user.email,
      before: { status: member.status, role: member.role },
      after:  { status: data.status ?? member.status, role: data.role ?? member.role },
    },
    request: req,
  });

  return NextResponse.json({ ok: true });
}
