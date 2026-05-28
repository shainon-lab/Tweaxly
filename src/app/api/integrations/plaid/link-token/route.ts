// POST /api/integrations/plaid/link-token
//
// Mints a short-lived link_token that the frontend hands to Plaid Link
// (the modal SDK) to start an account-linking flow. Server-side only -
// the frontend never sees PLAID_CLIENT_ID / PLAID_SECRET.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { getPlaid, plaidCountryCodes, PLAID_PRODUCTS } from "@/lib/plaid/client";
import { CountryCode, Products } from "plaid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, business } = await requireBusiness();
  void req;

  try {
    const plaid = getPlaid();
    const res = await plaid.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Tweaxly",
      // Read-only product set - declared here AND enforced server-side
      // by Plaid against the product list on the Client ID.
      products: PLAID_PRODUCTS as unknown as Products[],
      country_codes: plaidCountryCodes() as CountryCode[],
      language: "en",
      // Optional OAuth redirect for institutions that require it. Set
      // PLAID_REDIRECT_URI in prod to the exact URL of the page hosting
      // Plaid Link; sandbox can leave it unset.
      ...(process.env.PLAID_REDIRECT_URI
        ? { redirect_uri: process.env.PLAID_REDIRECT_URI }
        : {}),
      // Webhook lets Plaid push SYNC_UPDATES_AVAILABLE when new
      // transactions arrive without polling.
      ...(process.env.PLAID_WEBHOOK_URL
        ? { webhook: process.env.PLAID_WEBHOOK_URL }
        : {}),
    });

    return NextResponse.json({
      ok:         true,
      linkToken:  res.data.link_token,
      expiration: res.data.expiration,
    });
  } catch (err) {
    console.error(`[plaid:link-token] business=${business.id}`, err);
    const msg = err instanceof Error ? err.message : "link_token_failed";
    return NextResponse.json({ error: "link_token_failed", detail: msg }, { status: 500 });
  }
}
