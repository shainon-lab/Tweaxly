// POST /api/billing/checkout/pack
//   body: { sku: "pack_30" | "pack_50" | "pack_100" }                  // fixed
//      OR { sku: "pack_custom", credits: number /* >= 30 */ }          // custom
//
// Open a Polar checkout for a one-time credit pack on the active
// workspace. Free workspaces cannot buy packs - the subscription is
// the monetization layer; packs are an upsell ON TOP of Pro.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import {
  CREDIT_PACKS, CUSTOM_PACK_SKU, CUSTOM_PACK_MIN_CREDITS,
  calculateCustomPackPriceCents, getPlanFor,
} from "@/lib/billing";
import { createPackCheckout } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { business, user } = await requireBusiness();

  let body: { sku?: unknown; credits?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  // Gate: only Pro workspaces can buy packs (matches pricing copy +
  // the in-product "no AI Credit packs on Free" rule). If we let
  // Free workspaces through, refunds + revert logic would also need
  // to consider Free-purchased packs which we explicitly don't allow.
  const plan = await getPlanFor(business.id);
  if (plan === "free") {
    return NextResponse.json({
      error:   "upgrade_required",
      message: "Upgrade to Pro to buy add-on AI Credit packs.",
    }, { status: 403 });
  }

  const sku = typeof body.sku === "string" ? body.sku : "";

  // Custom pack: server computes the price from the credit count,
  // then locks it into the Polar checkout via the `amount` override.
  if (sku === CUSTOM_PACK_SKU) {
    const credits = typeof body.credits === "number" && Number.isFinite(body.credits)
      ? Math.floor(body.credits) : NaN;
    if (!Number.isFinite(credits) || credits < CUSTOM_PACK_MIN_CREDITS) {
      return NextResponse.json({
        error:   "invalid_credits",
        message: `Minimum ${CUSTOM_PACK_MIN_CREDITS} credits.`,
      }, { status: 400 });
    }
    let priceCents: number;
    try { priceCents = calculateCustomPackPriceCents(credits) }
    catch (err) {
      return NextResponse.json({
        error: "invalid_credits", message: err instanceof Error ? err.message : "invalid",
      }, { status: 400 });
    }
    try {
      const { url } = await createPackCheckout({
        businessId:    business.id,
        customerEmail: user.email,
        packSku:       CUSTOM_PACK_SKU,
        credits,
        priceCents,
      });
      return NextResponse.json({ url, credits, priceCents });
    } catch (err) {
      const message = err instanceof Error ? err.message : "checkout_failed";
      return NextResponse.json({ error: "checkout_failed", message }, { status: 500 });
    }
  }

  // Fixed pack flow.
  const pack = CREDIT_PACKS.find((p) => p.sku === sku);
  if (!pack) {
    return NextResponse.json({ error: "invalid_sku" }, { status: 400 });
  }
  try {
    const { url } = await createPackCheckout({
      businessId:    business.id,
      customerEmail: user.email,
      packSku:       pack.sku,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    return NextResponse.json({ error: "checkout_failed", message }, { status: 500 });
  }
}
