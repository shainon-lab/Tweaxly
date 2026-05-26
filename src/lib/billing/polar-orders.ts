// PolarOrder upsert shared between the Polar webhook handler and the
// one-off admin backfill route. Keeping both code paths against the
// same helper means the ledger row shape stays consistent regardless
// of whether the data came in live (webhook) or via a catch-up sweep.
//
// The webhook always has our checkout metadata (for new orders) or
// at least billingReason/subscriptionId (for renewals). The backfill
// route may have NEITHER, since Polar's older orders won't carry our
// checkout metadata and may pre-date subscription tracking - so this
// helper accepts optional override fields to fill the gaps.

import { prisma } from "../db";
import type { CheckoutMetadata } from "./polar";

// Subset of the Polar Order shape we actually read. Both the webhook
// payload and orders.list responses match this shape - declaring it
// explicitly lets the helper type-check against either source.
export interface PolarOrderPayload {
  id:                  string;
  createdAt:           Date;
  totalAmount:         number;
  currency:            string;
  status:              string;
  billingReason?:      string | null;
  invoiceNumber?:      string | null;
  isInvoiceGenerated?: boolean;
  customerId:          string;
  productId?:          string | null;
  subscriptionId?:     string | null;
  checkoutId?:         string | null;
  customer?:           { email?: string | null; id?: string } | null;
  product?:            { name?: string | null; id?: string } | null;
  metadata?:           unknown;
}

// Override fields the backfill can pass when Polar's metadata is
// missing. The webhook passes nothing here.
export interface PolarOrderOverrides {
  businessId?:   string;
  businessName?: string;
  userId?:       string;
}

export function readPolarMetadata(meta: unknown): Partial<CheckoutMetadata> {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  const asStr = (v: unknown): string | undefined =>
    typeof v === "string" ? v : (typeof v === "number" ? String(v) : undefined);
  return {
    businessId:    asStr(m.businessId),
    kind:          m.kind === "subscription" || m.kind === "pack" ? m.kind : undefined,
    packSku:       asStr(m.packSku),
    packCredits:   asStr(m.packCredits),
    userId:        asStr(m.userId),
    businessName:  asStr(m.businessName),
    productId:     asStr(m.productId),
    productName:   asStr(m.productName),
    productType:   asStr(m.productType),
    purchaseType:  asStr(m.purchaseType),
    planId:        asStr(m.planId),
    creditsAmount: asStr(m.creditsAmount),
  };
}

// Determine purchaseType from the Polar billingReason when our own
// metadata is missing (e.g., subscription renewals fire as
// subscription_cycle, with no checkout metadata from us). Falls back
// to the metadata snapshot if the billingReason isn't useful.
export function resolvePurchaseType(opts: {
  billingReason:                string | null | undefined;
  metaPurchaseType:             string | undefined;
  metaKind:                     "subscription" | "pack" | undefined;
  hasPriorOrderForSubscription: boolean;
}): string {
  if (opts.billingReason === "subscription_cycle") return "renewal";
  if (opts.billingReason === "subscription_update") {
    return opts.metaPurchaseType === "upgrade" || opts.metaPurchaseType === "downgrade"
      ? opts.metaPurchaseType
      : "upgrade";
  }
  if (opts.billingReason === "subscription_create") {
    return opts.hasPriorOrderForSubscription
      ? "renewal"
      : (opts.metaPurchaseType ?? "new_subscription");
  }
  if (opts.billingReason === "purchase") {
    return opts.metaPurchaseType
      ?? (opts.metaKind === "pack" ? "credits_purchase" : "one_time_purchase");
  }
  return opts.metaPurchaseType ?? "one_time_purchase";
}

// Upsert a PolarOrder row. Idempotent on polarOrderId so replayed
// webhooks just refresh the row's status + invoice fields.
//
// Returns one of:
//   { ok: true,  action: "created" | "updated", businessId }
//   { ok: false, reason: "error", message }
export async function upsertPolarOrderFromPayload(
  order: PolarOrderPayload,
  overrides?: PolarOrderOverrides,
): Promise<
  | { ok: true; action: "created" | "updated"; businessId: string | null }
  | { ok: false; reason: "error"; message: string }
> {
  try {
    const meta = readPolarMetadata(order.metadata);
    const customerEmail = order.customer?.email?.toLowerCase() ?? null;

    // Detect "have we already seen an order for this subscriptionId?"
    // so we can flip subscription_create → renewal on a webhook replay
    // or in a mixed backfill / live race.
    let hasPrior = false;
    if (order.subscriptionId) {
      const prior = await prisma.polarOrder.findFirst({
        where:  { polarSubscriptionId: order.subscriptionId, polarOrderId: { not: order.id } },
        select: { id: true },
      });
      hasPrior = !!prior;
    }

    const purchaseType = resolvePurchaseType({
      billingReason:                order.billingReason ?? null,
      metaPurchaseType:             meta.purchaseType,
      metaKind:                     meta.kind,
      hasPriorOrderForSubscription: hasPrior,
    });

    const productType = meta.productType ?? (
      order.subscriptionId ? "subscription" :
      meta.kind === "pack" ? "credits" :
      "one_time"
    );

    const creditsAmount = meta.creditsAmount != null && Number.isFinite(Number(meta.creditsAmount))
      ? Math.floor(Number(meta.creditsAmount))
      : null;

    const productName = meta.productName ?? order.product?.name ?? null;
    const businessId  = overrides?.businessId   ?? meta.businessId   ?? null;
    const userId      = overrides?.userId       ?? meta.userId       ?? null;
    const businessName = overrides?.businessName ?? meta.businessName ?? null;

    const existing = await prisma.polarOrder.findUnique({
      where:  { polarOrderId: order.id },
      select: { id: true },
    });

    await prisma.polarOrder.upsert({
      where:  { polarOrderId: order.id },
      create: {
        polarOrderId:        order.id,
        polarOrderNumber:    order.invoiceNumber ?? null,
        polarCustomerId:     order.customerId,
        polarCustomerEmail:  customerEmail,
        polarProductId:      order.productId ?? null,
        polarSubscriptionId: order.subscriptionId ?? null,
        polarCheckoutId:     order.checkoutId ?? null,

        userId,
        businessId,
        businessName,

        productName,
        productType,
        purchaseType,
        planId:        meta.planId ?? null,
        creditsAmount,

        amountCents:   order.totalAmount,
        currency:      order.currency || "USD",
        status:        order.status,

        invoiceNumber:    order.invoiceNumber ?? null,
        invoiceGenerated: !!order.isInvoiceGenerated,
        billingReason:    order.billingReason ?? null,

        metadata:  order.metadata != null ? (order.metadata as object) : undefined,
        createdAt: order.createdAt,
      },
      update: {
        polarOrderNumber:   order.invoiceNumber ?? undefined,
        polarCustomerEmail: customerEmail ?? undefined,
        status:             order.status,
        invoiceNumber:      order.invoiceNumber ?? undefined,
        invoiceGenerated:   !!order.isInvoiceGenerated || undefined,
        billingReason:      order.billingReason ?? undefined,
        // Backfill: fill in workspace context only if we resolved one
        // here and it isn't already set on the row (don't overwrite
        // good data with null).
        ...(businessId   ? { businessId }   : {}),
        ...(businessName ? { businessName } : {}),
        ...(userId       ? { userId }       : {}),
      },
    });

    return { ok: true, action: existing ? "updated" : "created", businessId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "error", message };
  }
}
