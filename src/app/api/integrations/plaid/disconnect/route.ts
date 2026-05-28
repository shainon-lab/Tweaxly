// POST /api/integrations/plaid/disconnect
//   body: { connectionId: string }
//
// Revokes the access_token at Plaid (item/remove) then flips the
// PlaidConnection row to "disconnected". Historical transactions
// stay - they're still real financial events, we just won't pull
// new ones until the user re-links. The linked FinancialSource rows
// are flipped to "archived" so they drop out of the picker but
// keep their batch history.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlaid } from "@/lib/plaid/client";
import { decryptAccessToken } from "@/lib/plaid/encryption";

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

  const conn = await prisma.plaidConnection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.businessId !== business.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Best-effort revoke at Plaid. Even if the API call fails (e.g.
  // already disconnected, network glitch) we still proceed with the
  // local cleanup so the user's disconnect intent is honored.
  try {
    const plaid = getPlaid();
    await plaid.itemRemove({ access_token: decryptAccessToken(conn.accessTokenEnc) });
  } catch (err) {
    console.error(`[plaid:disconnect] item/remove failed conn=${connectionId}`, err);
  }

  await prisma.$transaction([
    prisma.plaidConnection.update({
      where: { id: connectionId },
      data:  { status: "disconnected" },
    }),
    prisma.financialSource.updateMany({
      where: { plaidConnectionId: connectionId },
      data:  { status: "archived" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
