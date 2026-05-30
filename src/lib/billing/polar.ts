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
// Required env vars (each has a `_PROD` twin used when POLAR_ENV=production
// so the sandbox + production credentials can coexist on the same
// deployment - sandbox values stay under the unsuffixed names for
// local dev / preview, prod values live under the _PROD names so
// Vercel doesn't ask you to overwrite the existing sandbox vars):
//   POLAR_ENV                   - "sandbox" | "production" (defaults to sandbox)
//   POLAR_ACCESS_TOKEN[_PROD]   - server-side org access token
//   POLAR_WEBHOOK_SECRET[_PROD] - shared secret for webhook signature verification
//   POLAR_PRODUCT_PRO_ID[_PROD] - product id for the $49/mo Pro subscription
//   POLAR_PRODUCT_PACK_<n>_ID[_PROD] - product id per AI-credit pack SKU
//   POLAR_PRODUCT_PACK_CUSTOM_ID[_PROD] - product id for the custom-amount pack
//   APP_URL                     - public app origin used for redirect URLs
//                                 (one value; same for sandbox + prod)

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

// Returns true when the deployment is configured for the live Polar org.
// Drives which set of credentials / product ids is read out of process.env.
export function isPolarProduction(): boolean {
  return process.env.POLAR_ENV === "production";
}

// Pick the right env var for the current Polar environment:
//   sandbox    → process.env[base]
//   production → process.env[base + "_PROD"] (with fallback to base)
// The fallback exists so a deployment that hasn't migrated to the
// _PROD-suffixed names yet still works after flipping POLAR_ENV - no
// silent breakage on the migration window.
export function polarEnv(baseName: string): string | undefined {
  if (isPolarProduction()) {
    return process.env[baseName + "_PROD"] ?? process.env[baseName];
  }
  return process.env[baseName];
}

// One shared client. Throws fast if the env isn't configured so a
// stray UI button doesn't silently 500 in production.
function getEnv(): { token: string; server: "sandbox" | "production"; appUrl: string } {
  const token  = polarEnv("POLAR_ACCESS_TOKEN");
  const server = isPolarProduction() ? "production" : "sandbox";
  const appUrl = process.env.APP_URL ?? "https://app.tweaxly.com";
  if (!token) throw new Error(`POLAR_ACCESS_TOKEN${isPolarProduction() ? "_PROD" : ""} is not set`);
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
    return polarEnv("POLAR_PRODUCT_PACK_CUSTOM_ID") ?? null;
  }
  const pack = CREDIT_PACKS.find((p) => p.sku === sku);
  if (!pack) return null;
  // pack_100 -> POLAR_PRODUCT_PACK_100_ID (or _PROD variant in prod)
  const envKey = `POLAR_PRODUCT_PACK_${pack.sku.replace(/^pack_/, "")}_ID`;
  return polarEnv(envKey) ?? null;
}

export function getProProductId(): string | null {
  return polarEnv("POLAR_PRODUCT_PRO_ID") ?? null;
}

export function getBusinessProductId(): string | null {
  return polarEnv("POLAR_PRODUCT_BUSINESS_ID") ?? null;
}

// Map a plan key to the Polar product id configured in env. Used by
// the subscription checkout helper so a single createSubscriptionCheckout
// call can route to either Pro ($49) or Business ($89). Pack products
// are looked up separately via getPackProductId.
export function getSubscriptionProductId(plan: "pro" | "business"): string | null {
  if (plan === "business") return getBusinessProductId();
  return getProProductId();
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
//
// The "rich" fields (userId, businessName, productName, etc.) are
// snapshot context that lets the PolarOrder ledger render the right
// workspace / product label even after the underlying rows are
// renamed or deleted. Polar's metadata is scalar-only (string/number/
// boolean) so we store everything as strings and parse on the way
// back in.
export interface CheckoutMetadata {
  businessId: string;
  kind:       "subscription" | "pack";
  packSku?:   string;
  packCredits?: string;
  // ── Workspace-aware context (snapshot at checkout time) ───────────
  userId?:       string;
  businessName?: string;
  productId?:    string;
  productName?:  string;
  // "subscription" | "credits" | "addon" | "one_time"
  productType?:  string;
  // "new_subscription" | "renewal" | "upgrade" | "downgrade"
  //   | "credits_purchase" | "one_time_purchase"
  purchaseType?: string;
  planId?:       string;
  // Credits delivered by this purchase. Stringified because Polar
  // serialises metadata as scalars only.
  creditsAmount?: string;
}

export function buildSuccessUrl(appUrl: string): string {
  return `${appUrl}/settings?checkout=success`;
}

// Create a checkout session for the Pro monthly subscription.
export async function createSubscriptionCheckout(args: {
  businessId:    string;
  customerEmail: string;
  // Workspace-aware context. Optional so the existing call sites keep
  // compiling, but the checkout routes pass all of these so the
  // PolarOrder ledger has a full snapshot at write time.
  userId?:       string;
  businessName?: string;
  // "new_subscription" defaults; pass "upgrade" / "downgrade" when the
  // caller knows the workspace is moving between paid tiers.
  purchaseType?: "new_subscription" | "upgrade" | "downgrade";
  // Target plan key. Defaults to "pro" for back-compat with call
  // sites that haven't been migrated yet (everything pre-Business
  // assumed Pro was the only paid tier).
  planId?:       "pro" | "business";
}): Promise<{ url: string; checkoutId: string }> {
  const target  = args.planId ?? "pro";
  const productId = getSubscriptionProductId(target);
  if (!productId) {
    throw new Error(
      target === "business"
        ? "POLAR_PRODUCT_BUSINESS_ID is not set"
        : "POLAR_PRODUCT_PRO_ID is not set",
    );
  }
  const { appUrl } = getEnv();
  const polar = getPolar();

  const metadata: CheckoutMetadata = {
    businessId:   args.businessId,
    kind:         "subscription",
    userId:       args.userId,
    businessName: args.businessName,
    productId,
    productName:  target === "business" ? "Business subscription" : "Pro subscription",
    productType:  "subscription",
    purchaseType: args.purchaseType ?? "new_subscription",
    planId:       target,
  };

  const checkout = await polar.checkouts.create({
    products:       [productId],
    customerEmail:  args.customerEmail,
    // Carry through the originating workspace so the webhook handler
    // can credit the right wallet / upsert the right Subscription row
    // without an extra lookup. Polar copies metadata onto Order +
    // Subscription objects automatically.
    metadata:       metadata as unknown as Record<string, string>,
    successUrl:     buildSuccessUrl(appUrl),
    // embed_origin is the security boundary for the embedded iframe
    // flow. Polar's checkout JS uses postMessage to talk to the parent
    // window; without a matching embed_origin the iframe refuses to
    // mount. Set to the workspace's APP_URL so the same origin that
    // hosts the modal is the only origin that can receive the
    // success/close/confirmed events.
    embedOrigin:    appUrl,
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
  // Workspace-aware context for the PolarOrder ledger.
  userId?:       string;
  businessName?: string;
  productName?:  string;
}): Promise<{ url: string; checkoutId: string }> {
  const productId = getPackProductId(args.packSku);
  if (!productId) throw new Error(`Polar product id for ${args.packSku} not set`);
  const { appUrl } = getEnv();
  const polar = getPolar();

  const isCustom = args.packSku === CUSTOM_PACK_SKU;
  // Resolve credit count for the metadata snapshot. Custom packs
  // pass it in via args.credits; fixed packs look it up from the
  // pack catalog so the same metadata shape applies either way.
  const fixedPack = CREDIT_PACKS.find((p) => p.sku === args.packSku);
  const resolvedCredits = isCustom ? args.credits : fixedPack?.credits;
  const metadata: CheckoutMetadata = {
    businessId:   args.businessId,
    kind:         "pack",
    packSku:      args.packSku,
    userId:       args.userId,
    businessName: args.businessName,
    productId,
    productName:  args.productName ?? (isCustom ? "AI Credits (custom pack)" : `AI Credits · ${args.packSku}`),
    productType:  "credits",
    purchaseType: "credits_purchase",
    ...(resolvedCredits != null ? { creditsAmount: String(resolvedCredits) } : {}),
    ...(isCustom && args.credits != null ? { packCredits: String(args.credits) } : {}),
  };

  const checkout = await polar.checkouts.create({
    products:      [productId],
    customerEmail: args.customerEmail,
    metadata:      metadata as unknown as Record<string, string>,
    successUrl:    buildSuccessUrl(appUrl),
    embedOrigin:   appUrl,
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

// ────────────────────────────────────────────────────────────────────
// Subscription state transitions
// ────────────────────────────────────────────────────────────────────

// Cancel a subscription at the end of its current billing period.
// The subscription stays active (and the workspace keeps its
// entitlements) until currentPeriodEnd, then automatically
// transitions to canceled. Polar emits subscription.canceled at the
// boundary which our webhook picks up and flips the local
// Subscription.status to canceled - which the entitlements layer
// then resolves as the "free" default plan.
export async function cancelSubscriptionAtPeriodEnd(externalSubscriptionId: string): Promise<void> {
  const polar = getPolar();
  await polar.subscriptions.update({
    id: externalSubscriptionId,
    subscriptionUpdate: { cancelAtPeriodEnd: true },
  });
}

// Undo a previously-scheduled cancellation. Restores normal renewal
// behavior. No-op if the sub isn't currently scheduled to cancel.
export async function uncancelSubscription(externalSubscriptionId: string): Promise<void> {
  const polar = getPolar();
  await polar.subscriptions.update({
    id: externalSubscriptionId,
    subscriptionUpdate: { cancelAtPeriodEnd: false },
  });
}

// ────────────────────────────────────────────────────────────────────
// Invoices
// ────────────────────────────────────────────────────────────────────

// Resolve a fresh, short-lived signed URL for the invoice PDF of a
// given Polar order. If Polar hasn't generated the invoice yet, kick
// off generation and retry once. Returns null when generation hasn't
// caught up - the caller should surface that as "still generating".
//
// Why a single helper for both customer + admin: the only difference
// between the two surfaces is the authorization check; the actual
// Polar API call is identical, so collapsing it here means one place
// to handle the 404-before-generation race.
export async function fetchOrderInvoiceUrl(polarOrderId: string): Promise<
  | { ok: true; url: string }
  | { ok: false; reason: "generating" | "not_found" | "error"; message?: string }
> {
  const polar = getPolar();
  try {
    const invoice = await polar.orders.invoice({ id: polarOrderId });
    if (invoice?.url) return { ok: true, url: invoice.url };
    return { ok: false, reason: "not_found" };
  } catch (err) {
    // Polar returns 404 / NotGenerated when the invoice isn't built
    // yet. Trigger generation and surface a "generating" status so
    // the UI knows to poll.
    const message = err instanceof Error ? err.message : String(err);
    const is404 = /404|not[_ ]found|not[_ ]generated/i.test(message);
    if (is404) {
      try {
        await polar.orders.generateInvoice({ id: polarOrderId });
        // Best-effort second fetch. Polar's generation is usually
        // fast but can be slow on the first request after a sub
        // renewal - we don't block here, the customer-side route will
        // tell the UI to poll.
        const retry = await polar.orders.invoice({ id: polarOrderId }).catch(() => null);
        if (retry?.url) return { ok: true, url: retry.url };
        return { ok: false, reason: "generating" };
      } catch (genErr) {
        const genMessage = genErr instanceof Error ? genErr.message : String(genErr);
        return { ok: false, reason: "error", message: genMessage };
      }
    }
    return { ok: false, reason: "error", message };
  }
}
