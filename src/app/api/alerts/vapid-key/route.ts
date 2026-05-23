// GET /api/alerts/vapid-key
//
// Returns the VAPID public key the browser needs to subscribe to
// Web Push. Public-safe (the public half of an asymmetric pair).
// Returns 503 with `{ ok: false }` when VAPID hasn't been configured
// on this deployment, so the client can show a "not yet enabled"
// state instead of crashing.

import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/alerts/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, publicKey: getVapidPublicKey() });
}
