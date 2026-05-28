// POST /api/integrations/plaid/sync
//   body: { connectionId: string }
//
// Manual "Refresh data" button on each connected institution. Runs
// the same incremental sync the webhook + initial-link flows use.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncPlaidConnection } from "@/lib/plaid/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { business } = await requireBusiness();

  let body: { connectionId?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }
  const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
  if (!connectionId) {
    return NextResponse.json({ error: "missing_connection_id" }, { status: 400 });
  }

  // Scope check - never let one workspace sync another's Plaid item.
  const conn = await prisma.plaidConnection.findUnique({
    where:  { id: connectionId },
    select: { businessId: true },
  });
  if (!conn || conn.businessId !== business.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Fire-and-forget so the click doesn't block on Plaid. Frontend
  // polls connection status to show "syncing..." then refresh.
  void syncPlaidConnection(connectionId).catch((err) => {
    console.error(`[plaid:sync] manual refresh failed conn=${connectionId}`, err);
  });

  return NextResponse.json({ ok: true, status: "syncing" });
}
