// POST /api/integrations/plaid/exchange-token
//   body: { publicToken: string, institution?: { id: string, name: string } }
//
// Plaid Link returns a short-lived public_token client-side after a
// successful link. We exchange it for the long-lived access_token
// server-side, encrypt it, store the PlaidConnection row, then kick
// off the initial sync as a fire-and-forget so the response returns
// fast - the frontend polls connection.status to know when the first
// load completes.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { getPlaid } from "@/lib/plaid/client";
import { encryptAccessToken } from "@/lib/plaid/encryption";
import { syncPlaidConnection } from "@/lib/plaid/sync";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { business } = await requireBusiness();

  let body: { publicToken?: unknown; institution?: { id?: unknown; name?: unknown } };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const publicToken = typeof body.publicToken === "string" ? body.publicToken : "";
  if (!publicToken) {
    return NextResponse.json({ error: "missing_public_token" }, { status: 400 });
  }
  const institutionId   = typeof body.institution?.id   === "string" ? body.institution.id   : null;
  const institutionName = typeof body.institution?.name === "string" ? body.institution.name : null;

  try {
    const plaid = getPlaid();

    // Exchange the public_token for the long-lived access_token + item_id.
    const exchRes = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchRes.data.access_token;
    const itemId      = exchRes.data.item_id;

    // If this workspace has already linked this Item (e.g. via a
    // re-auth flow), update the existing row instead of inserting a
    // duplicate. Item IDs are stable across re-links.
    const existing = await prisma.plaidConnection.findUnique({ where: { itemId } });
    const accessTokenEnc = encryptAccessToken(accessToken);

    const conn = existing
      ? await prisma.plaidConnection.update({
          where: { id: existing.id },
          data:  {
            businessId:      business.id,
            accessTokenEnc,
            institutionId,
            institutionName,
            status:          "syncing",
            lastError:       null,
          },
        })
      : await prisma.plaidConnection.create({
          data: {
            businessId:      business.id,
            itemId,
            accessTokenEnc,
            institutionId,
            institutionName,
            status:          "syncing",
          },
        });

    // Fire-and-forget initial sync. The route returns immediately;
    // the frontend polls /api/integrations/plaid/connections to see
    // when status flips to "connected".
    void syncPlaidConnection(conn.id).catch((err) => {
      console.error(`[plaid:exchange-token] initial sync failed conn=${conn.id}`, err);
    });

    return NextResponse.json({
      ok: true,
      connection: {
        id:               conn.id,
        institutionName:  conn.institutionName,
        status:           conn.status,
      },
    });
  } catch (err) {
    console.error(`[plaid:exchange-token] business=${business.id}`, err);
    const msg = err instanceof Error ? err.message : "exchange_failed";
    return NextResponse.json({ error: "exchange_failed", detail: msg }, { status: 500 });
  }
}
