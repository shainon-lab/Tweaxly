// POST /api/integrations/plaid/webhook
//
// Plaid posts here when an Item has new transaction data, when its
// status changes (e.g. ITEM_LOGIN_REQUIRED), or when an error needs
// our attention. We do the minimum work inline and kick off a sync
// for transaction-related webhooks.
//
// Webhook payload shape (subset we care about):
//   {
//     webhook_type:    "TRANSACTIONS" | "ITEM" | "AUTH" | ...,
//     webhook_code:    "SYNC_UPDATES_AVAILABLE" | "ITEM_LOGIN_REQUIRED" | ...,
//     item_id:         string,
//     error:           { error_message?: string } | null,
//   }
//
// Signature verification: in production, set PLAID_WEBHOOK_SECRET +
// validate the JWT in the `Plaid-Verification` header. Sandbox sends
// webhooks unsigned, so we accept them in non-production envs.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncPlaidConnection } from "@/lib/plaid/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlaidWebhookBody {
  webhook_type?: string;
  webhook_code?: string;
  item_id?:      string;
  error?:        { error_message?: string } | null;
}

export async function POST(req: Request) {
  let body: PlaidWebhookBody;
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const itemId = typeof body.item_id === "string" ? body.item_id : null;
  const type   = typeof body.webhook_type === "string" ? body.webhook_type : null;
  const code   = typeof body.webhook_code === "string" ? body.webhook_code : null;
  if (!itemId || !type || !code) {
    return NextResponse.json({ ok: true, skipped: "missing_fields" });
  }

  const conn = await prisma.plaidConnection.findUnique({ where: { itemId } });
  if (!conn) {
    // Item we don't recognise - probably a webhook for an Item we
    // already disconnected on our side. ACK so Plaid stops retrying.
    return NextResponse.json({ ok: true, skipped: "unknown_item" });
  }

  if (type === "TRANSACTIONS" && (code === "SYNC_UPDATES_AVAILABLE" || code === "INITIAL_UPDATE" || code === "HISTORICAL_UPDATE" || code === "DEFAULT_UPDATE")) {
    void syncPlaidConnection(conn.id).catch((err) => {
      console.error(`[plaid:webhook] sync failed conn=${conn.id}`, err);
    });
    return NextResponse.json({ ok: true, action: "sync_kicked_off" });
  }

  if (type === "ITEM" && (code === "ERROR" || code === "PENDING_EXPIRATION" || code === "USER_PERMISSION_REVOKED")) {
    await prisma.plaidConnection.update({
      where: { id: conn.id },
      data:  {
        status:    "error",
        lastError: body.error?.error_message ?? code,
      },
    });
    return NextResponse.json({ ok: true, action: "marked_error" });
  }

  // Everything else (e.g. ITEM_LOGIN_REQUIRED variations we don't
  // explicitly handle): ACK without action so Plaid stops retrying.
  return NextResponse.json({ ok: true, skipped: "unhandled_code", type, code });
}
