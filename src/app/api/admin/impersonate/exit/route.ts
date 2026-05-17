// POST /api/admin/impersonate/exit — clears impersonation state, logs.
import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) return auth.response;

  const session = await getSession();
  const wasImpersonating = session.impersonatingBusinessId;
  session.impersonatingBusinessId = undefined;
  session.impersonationAllowWrites = undefined;
  await session.save();

  if (wasImpersonating) {
    await recordAudit({
      actorUserId: auth.user.id,
      action: "impersonation.exit",
      targetBusinessId: wasImpersonating,
      request: req,
    });
  }

  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}

// Allow GET so a plain link in the banner can exit (no JS required).
export async function GET(req: Request) {
  return POST(req);
}
