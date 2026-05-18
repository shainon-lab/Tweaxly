// POST /api/admin/impersonate/allow-writes
//   body: { allow: boolean }
// Toggles whether writes are permitted during the current impersonation
// session. Logged.

import { NextResponse } from "next/server";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const session = await getSession();
  if (!session.impersonatingBusinessId) {
    return NextResponse.json({ error: "not_impersonating" }, { status: 400 });
  }

  let body: { allow?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const allow = !!body.allow;
  session.impersonationAllowWrites = allow;
  await session.save();

  await recordAudit({
    actorUserId: auth.user.id,
    action: allow ? "impersonation.allow_writes" : "impersonation.deny_writes",
    targetBusinessId: session.impersonatingBusinessId,
    request: req,
  });

  return NextResponse.json({ ok: true, allowWrites: allow });
}
