// Polar.sh integration.
//
// Polar is the chosen billing provider. The schema already exposes
// generic external* columns so this layer just maps Polar concepts:
//
//   Polar order  (one-time)         → AiCreditTransaction kind="purchase"
//   Polar subscription              → Subscription row (externalProvider="polar")
//   Polar customer                  → workspace (Business). Each
//                                     workspace gets its own Polar
//                                     customer so plans + portals
//                                     are per-workspace, matching the
//                                     in-product mental model.
//
// Required env vars:
//   POLAR_ACCESS_TOKEN          - server-side org access token
//   POLAR_WEBHOOK_SECRET        - shared secret for webhook signature verification
//   POLAR_ENV                   - "sandbox" | "production" (defaults to sandbox)
//   POLAR_PRODUCT_PRO_ID        - product id for the $49/mo Pro subscription
//   POLAR_PRODUCT_PACK_100_ID   - product id for the +100 AI Credits pack
//   POLAR_PRODUCT_PACK_500_ID   - product id for the +500 AI Credits pack
//   APP_URL                     - public app origin used for redirect URLs

import { Polar } from "@polar-sh/sdk";
import { HTTPClient } from "@polar-sh/sdk";
// Use undici's fetch directly so we bypass Next.js's instrumented
// global fetch. Next 14 wraps `globalThis.fetch` for its ISR/data
// cache layer, and on POST requests with a Request body the
// instrumented wrapper consumes the body stream before undici can
// read it, surfacing as `Error: expected non-null body source`.
// Going to undici directly sidesteps the instrumentation entirely.
import { fetch as undiciFetch } from "undici";
import { CREDIT_PACKS, CUSTOM_PACK_SKU } from "./plans";

export const POLAR_PROVIDER = "polar" as const;

// One shared client. Throws fast if the env isn't configured so a
// stray UI button doesn't silently 500 in production.
function getEnv(): { token: string; server: "sandbox" | "production"; appUrl: string } {
  const token  = process.env.POLAR_ACCESS_TOKEN;
  const server = process.env.POLAR_ENV === "production" ? "production" : "sandbox";
  const appUrl = process.env.APP_URL ?? "https://app.tweaxly.com";
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not set");
  return { token, server, appUrl };
}

let _client: Polar | null = null;
export function getPolar(): Polar {
  if (_client) return _client;
  const { token, server } = getEnv();
  // Custom fetcher = undici directly (skip Next's patched global
  // fetch entirely). When the SDK calls us with a Request, we read
  // out method/headers/body and reissue through undici. The return
  // type cast is necessary because undici's Response and the WHATWG
  // Response don't share a runtime identity, but they're structurally
  // compatible enough for the SDK's needs (status, headers, json()).
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (input instanceof Request) {
      // Materialise the body up front so we own a fresh string and
      // never hand a locked stream to undici.
      const body = input.body ? await input.text() : undefined;
      return undiciFetch(input.url, {
        method:      input.method,
        headers:     Object.fromEntries(input.headers.entries()),
        body,
      }) as unknown as Response;
    }
    return undiciFetch(input as Parameters<typeof undiciFetch>[0], init as Parameters<typeof undiciFetch>[1]) as unknown as Response;
  };
  _client = new Polar({
    accessToken: token,
    server,
    httpClient: new HTTPClient({ fetcher }),
  });
  return _client;
}

// Map a credit-pack SKU (pack_30 / pack_50 / pack_100 / pack_custom)
// to the Polar product id configured in env. Data-driven from
// CREDIT_PACKS so adding a pack in plans.ts only needs the matching
// POLAR_PRODUCT_PACK_<n>_ID env var alongside.
export function getPackProductId(sku: string): string | null {
  if (sku === CUSTOM_PACK_SKU) {
    return process.env.POLAR_PRODUCT_PACK_CUSTOM_ID ?? null;
  }
  const pack = CREDIT_PACKS.find((p) => p.sku === sku);
  if (!pack) return null;
  // pack_100 -> POLAR_PRODUCT_PACK_100_ID
  const envKey = `POLAR_PRODUCT_PACK_${pack.sku.replace(/^pack_/, "")}_ID`;
  return process.env[envKey] ?? null;
}

export function getProProductId(): string | null {
  return process.env.POLAR_PRODUCT_PRO_ID ?? null;
}

// ────────────────────────────────────────────────────────────────────
// Checkout
// ────────────────────────────────────────────────────────────────────

// Checkout metadata travels from the checkout session into the
// resulting Order + Subscription, and lands back on us via webhook.
// This is how we know which workspace to credit / upgrade. For the
// custom pack we also stash the credit count so the webhook can
// grant the exact amount we priced (the order's amount alone isn't
// enough - the webhook needs credits, not cents).
export interface CheckoutMetadata {
  businessId: string;
  kind:       "subscription" | "pack";
  packSku?:   string;
  packCredits?: string;
}

export function buildSuccessUrl(appUrl: string): string {
  return `${appUrl}/settings?checkout=success`;
}

// Create a checkout session for the Pro monthly subscription.
export async function createSubscriptionCheckout(args: {
  businessId:    string;
  customerEmail: string;
}): Promise<{ url: string; checkoutId: string }> {
  const productId = getProProductId();
  if (!productId) throw new Error("POLAR_PRODUCT_PRO_ID is not set");
  const { appUrl } = getEnv();
  const polar = getPolar();

  const metadata: CheckoutMetadata = { businessId: args.businessId, kind: "subscription" };

  const checkout = await polar.checkouts.create({
    products:       [productId],
    customerEmail:  args.customerEmail,
    // Carry through the originating workspace so the webhook handler
    // can credit the right wallet / upsert the right Subscription row
    // without an extra lookup. Polar copies metadata onto Order +
    // Subscription objects automatically.
    metadata:       metadata as unknown as Record<string, string>,
    successUrl:     buildSuccessUrl(appUrl),
  });

  return { url: checkout.url, checkoutId: checkout.id };
}

// Create a checkout session for a one-time credit pack purchase.
// Fixed packs (pack_30 / pack_50 / pack_100) use the product's
// built-in price; the custom pack passes `amount` to override the
// pay-what-you-want price with our sliding-scale calculation.
export async function createPackCheckout(args: {
  businessId:    string;
  customerEmail: string;
  packSku:       string;
  // Only required when packSku is the custom sku - the server has
  // already validated min + computed priceCents from credits.
  credits?:      number;
  priceCents?:   number;
}): Promise<{ url: string; checkoutId: string }> {
  const productId = getPackProductId(args.packSku);
  if (!productId) throw new Error(`Polar product id for ${args.packSku} not set`);
  const { appUrl } = getEnv();
  const polar = getPolar();

  const isCustom = args.packSku === CUSTOM_PACK_SKU;
  const metadata: CheckoutMetadata = {
    businessId: args.businessId,
    kind:       "pack",
    packSku:    args.packSku,
    ...(isCustom && args.credits != null ? { packCredits: String(args.credits) } : {}),
  };

  const checkout = await polar.checkouts.create({
    products:      [productId],
    customerEmail: args.customerEmail,
    metadata:      metadata as unknown as Record<string, string>,
    successUrl:    buildSuccessUrl(appUrl),
    // For custom-priced products, Polar accepts `amount` to lock the
    // price for this specific checkout. We pre-compute it server-
    // side so the user doesn't get to edit the price on Polar's page.
    ...(isCustom && args.priceCents != null ? { amount: args.priceCents } : {}),
  });

  return { url: checkout.url, checkoutId: checkout.id };
}

// ────────────────────────────────────────────────────────────────────
// Customer portal
// ────────────────────────────────────────────────────────────────────

// Returns a portal session URL. We pass the Polar customer id we
// stored on the workspace's Subscription row at checkout time.
export async function createCustomerPortalSession(args: {
  customerId: string;
}): Promise<{ url: string }> {
  const polar = getPolar();
  const session = await polar.customerSessions.create({
    customerId: args.customerId,
  });
  return { url: session.customerPortalUrl };
}
