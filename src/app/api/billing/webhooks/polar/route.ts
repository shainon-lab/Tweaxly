// POST /api/billing/webhooks/polar
//
// Polar webhook receiver. The Polar dashboard sends every relevant
// billing event here (subscription lifecycle + order/refund). We
// verify the HMAC signature with POLAR_WEBHOOK_SECRET, then route
// each event into the existing billing primitives:
//
//   subscription.created/active     → upsert Subscription + applyMonthlyAllowance
//   subscription.updated            → refresh row (period dates, plan, cancelAt)
//   subscription.canceled           → mark cancelAtPeriodEnd
//   subscription.revoked/past_due   → status=canceled|past_due; reconcileEntitledCredits
//   order.paid (kind=pack)          → grantCredits(.. "purchase" ..)
//   order.refunded                  → refundPurchase(originatingTxnId)
//
// Other event types are acked with 200 but ignored. Always return
// 200 once the signature passes - retrying webhooks on transient
// errors is Polar's job, and our own internal failures should not
// block their queue.

import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { prisma } from "@/lib/db";
import {
  applyMonthlyAllowance,
  grantCredits,
  reconcileEntitledCredits,
  refundPurchase,
  CREDIT_PACKS,
  CUSTOM_PACK_SKU,
  CUSTOM_PACK_MIN_CREDITS,
  normalizePlan,
} from "@/lib/billing";
import { POLAR_PROVIDER, polarEnv, type CheckoutMetadata } from "@/lib/billing/polar";
import { recordAudit, type AuditAction } from "@/lib/audit";

// Webhook helper: write an AuditLog row using the business owner as
// the actor so the entry surfaces on the owner's Account → Access
// Logs feed. Best-effort - failure here never blocks the webhook ack.
async function recordSubscriptionAudit(
  businessId: string,
  action: AuditAction,
  metadata: Record<string, unknown>,
) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!biz) return;
    await recordAudit({
      actorUserId: biz.ownerId,
      action,
      targetBusinessId: businessId,
      metadata,
    });
  } catch (err) {
    console.error("[polar webhook] audit write failed", err);
  }
}

// Polar requires the *raw* request body to verify the HMAC. Next 14
// app router gives us req.text() which preserves it byte-for-byte.
export const dynamic = "force-dynamic";

function readMeta(meta: unknown): Partial<CheckoutMetadata> {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  const asStr = (v: unknown): string | undefined =>
    typeof v === "string" ? v : (typeof v === "number" ? String(v) : undefined);
  return {
    businessId:    asStr(m.businessId),
    kind:          m.kind === "subscription" || m.kind === "pack" ? m.kind : undefined,
    packSku:       asStr(m.packSku),
    // packCredits is stamped as a string (Polar metadata is scalar-only).
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
// metadata is missing (e.g., subscription renewals - Polar generates
// the order, not our checkout, so it has no checkout metadata of
// ours). Falls back to the metadata snapshot if the billingReason
// isn't useful.
function resolvePurchaseType(opts: {
  billingReason: string | null | undefined;
  metaPurchaseType: string | undefined;
  metaKind: "subscription" | "pack" | undefined;
  hasPriorOrderForSubscription: boolean;
}): string {
  // Renewals fire as subscription_cycle. Polar uses subscription_create
  // for the very first order on a new subscription.
  if (opts.billingReason === "subscription_cycle") return "renewal";
  if (opts.billingReason === "subscription_update") {
    return opts.metaPurchaseType === "upgrade" || opts.metaPurchaseType === "downgrade"
      ? opts.metaPurchaseType
      : "upgrade";
  }
  if (opts.billingReason === "subscription_create") {
    // First order on a subscription. If we've already seen one for
    // the same subscriptionId, treat as renewal (defensive - shouldn't
    // happen, but Polar's webhook can replay).
    return opts.hasPriorOrderForSubscription ? "renewal" : (opts.metaPurchaseType ?? "new_subscription");
  }
  if (opts.billingReason === "purchase") {
    // One-time purchase. metaPurchaseType is "credits_purchase" for
    // packs we created; default to one_time_purchase otherwise.
    return opts.metaPurchaseType ?? (opts.metaKind === "pack" ? "credits_purchase" : "one_time_purchase");
  }
  return opts.metaPurchaseType ?? "one_time_purchase";
}

// Upsert a PolarOrder row from a webhook Order payload. Idempotent on
// polarOrderId so replayed webhooks just refresh the row's status +
// invoice fields. Best-effort - failure here never blocks the wallet
// side of the webhook handler (the order ledger is a derived view,
// not the source of truth for entitlements).
async function upsertOrderRow(order: {
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
}) {
  try {
    const meta = readMeta(order.metadata);
    const customerEmail = order.customer?.email ?? null;

    // Detect "have we already seen an order for this subscriptionId?"
    // so we can flip subscription_create → renewal on a webhook replay.
    let hasPrior = false;
    if (order.subscriptionId) {
      const prior = await prisma.polarOrder.findFirst({
        where:  { polarSubscriptionId: order.subscriptionId, polarOrderId: { not: order.id } },
        select: { id: true },
      });
      hasPrior = !!prior;
    }

    const purchaseType = resolvePurchaseType({
      billingReason:               order.billingReason ?? null,
      metaPurchaseType:            meta.purchaseType,
      metaKind:                    meta.kind,
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
    const businessId  = meta.businessId ?? null;

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

        userId:        meta.userId ?? null,
        businessId,
        businessName:  meta.businessName ?? null,

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

        metadata: order.metadata != null ? (order.metadata as object) : undefined,
        createdAt: order.createdAt,
      },
      update: {
        polarOrderNumber:   order.invoiceNumber ?? undefined,
        polarCustomerEmail: customerEmail ?? undefined,
        status:             order.status,
        invoiceNumber:      order.invoiceNumber ?? undefined,
        invoiceGenerated:   !!order.isInvoiceGenerated || undefined,
        billingReason:      order.billingReason ?? undefined,
      },
    });
  } catch (err) {
    console.error("[polar-webhook] upsertOrderRow failed", { orderId: order.id, err });
  }
}

export async function POST(req: Request) {
  // Read the secret that matches the current Polar env. polarEnv()
  // resolves to POLAR_WEBHOOK_SECRET_PROD when POLAR_ENV=production
  // and POLAR_WEBHOOK_SECRET when sandbox - same pattern used by the
  // access token and product ids.
  const secret = polarEnv("POLAR_WEBHOOK_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 500 });
  }

  const raw = await req.text();
  // Polar sends standard webhook headers (svix-* style); validateEvent
  // expects them as a plain Record<string,string>.
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v });

  let event;
  try {
    event = validateEvent(raw, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Subscriptions ────────────────────────────────────────────
      case "subscription.created":
      case "subscription.active": {
        const sub = event.data;
        const meta = readMeta(sub.metadata);
        if (!meta.businessId) break;
        const existingId = await findSubIdByExternal(sub.id);
        const data = {
          plan:                   normalizePlan("pro"),
          status:                 "active",
          currentPeriodStart:     sub.currentPeriodStart,
          currentPeriodEnd:       sub.currentPeriodEnd,
          cancelAtPeriodEnd:      sub.cancelAtPeriodEnd,
          externalProvider:       POLAR_PROVIDER,
          externalCustomerId:     sub.customerId,
          externalSubscriptionId: sub.id,
          externalPriceId:        sub.productId,
        };
        if (existingId) {
          await prisma.subscription.update({ where: { id: existingId }, data });
          await recordSubscriptionAudit(meta.businessId, "billing.subscription_updated", {
            plan: data.plan, externalSubscriptionId: sub.id, eventType: event.type,
          });
        } else {
          await prisma.subscription.create({
            data: { businessId: meta.businessId, ...data },
          });
          await recordSubscriptionAudit(meta.businessId, "billing.subscription_created", {
            plan: data.plan, externalSubscriptionId: sub.id, eventType: event.type,
          });
        }
        // Bootstrap the wallet + month's allowance immediately so the
        // user sees credits the moment they bounce back from checkout.
        await applyMonthlyAllowance(meta.businessId);
        break;
      }

      case "subscription.updated": {
        const sub = event.data;
        const subId = await findSubIdByExternal(sub.id);
        if (!subId) break;
        await prisma.subscription.update({
          where: { id: subId },
          data:  {
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd:   sub.currentPeriodEnd,
            cancelAtPeriodEnd:  sub.cancelAtPeriodEnd,
            status:             mapSubStatus(sub.status),
          },
        });
        const meta = readMeta(sub.metadata);
        if (meta.businessId) {
          await recordSubscriptionAudit(meta.businessId, "billing.subscription_updated", {
            externalSubscriptionId: sub.id, status: mapSubStatus(sub.status),
          });
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.uncanceled": {
        const sub = event.data;
        const subId = await findSubIdByExternal(sub.id);
        if (!subId) break;
        await prisma.subscription.update({
          where: { id: subId },
          data:  {
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            cancelledAt:       event.type === "subscription.canceled" ? new Date() : null,
          },
        });
        const meta = readMeta(sub.metadata);
        if (meta.businessId) {
          await recordSubscriptionAudit(
            meta.businessId,
            event.type === "subscription.canceled" ? "billing.subscription_canceled" : "billing.subscription_updated",
            { externalSubscriptionId: sub.id, eventType: event.type },
          );
        }
        break;
      }

      case "subscription.revoked":
      case "subscription.past_due": {
        const sub = event.data;
        const subId = await findSubIdByExternal(sub.id);
        if (!subId) break;
        const status = event.type === "subscription.revoked" ? "canceled" : "past_due";
        await prisma.subscription.update({
          where: { id: subId },
          data:  { status },
        });
        // Falling off Pro means the monthly_grant credits should
        // disappear (per the reversion rules). Pack credits stay.
        const meta = readMeta(sub.metadata);
        if (meta.businessId) await reconcileEntitledCredits(meta.businessId);
        break;
      }

      // ── Orders + refunds ────────────────────────────────────────
      case "order.created":
      case "order.updated": {
        // These events let us record the row even if order.paid never
        // arrives (failed payment, manual order in Polar dashboard,
        // etc.). The pack-credit grant still happens on order.paid -
        // here we just keep the ledger row fresh.
        await upsertOrderRow(event.data);
        break;
      }

      case "order.paid": {
        const order = event.data;
        // Always record the row (subscription orders + pack orders).
        // We do this BEFORE the pack-credit grant so a wallet failure
        // doesn't lose the ledger entry.
        await upsertOrderRow(order);

        const meta = readMeta(order.metadata);
        if (!meta.businessId || meta.kind !== "pack" || !meta.packSku) break;
        // Sub-create / sub-renew orders also fire this event - they
        // carry kind="subscription" in metadata so we skip them here
        // and let subscription.* handle the wallet side.

        // Resolve how many credits to grant. Fixed packs read from
        // CREDIT_PACKS; the custom pack reads packCredits out of the
        // order metadata (server-side authored at checkout time, so
        // the user can't tamper with it).
        let credits: number | null = null;
        if (meta.packSku === CUSTOM_PACK_SKU) {
          const parsed = Number(meta.packCredits);
          if (Number.isFinite(parsed) && parsed >= CUSTOM_PACK_MIN_CREDITS) {
            credits = Math.floor(parsed);
          }
        } else {
          const pack = CREDIT_PACKS.find((p) => p.sku === meta.packSku);
          if (pack) credits = pack.credits;
        }
        if (credits == null || credits <= 0) break;

        // Idempotent: ignore a second order.paid for the same Polar order id.
        const already = await prisma.aiCreditTransaction.findFirst({
          where: {
            businessId: meta.businessId,
            kind:       "purchase",
            meta:       { path: ["polarOrderId"], equals: order.id },
          },
          select: { id: true },
        });
        if (already) break;
        // 12-month expiry per the credit-pack policy (same default
        // used by the existing manual grant code path).
        const expiresAt = new Date();
        expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
        await grantCredits(meta.businessId, credits, "purchase", {
          reason:    `Polar order ${order.id} · ${meta.packSku}`,
          expiresAt,
          meta:      { polarOrderId: order.id, packSku: meta.packSku, credits, provider: POLAR_PROVIDER },
        });
        break;
      }

      case "order.refunded": {
        const order = event.data;
        // Update the ledger row to reflect the refund.
        await upsertOrderRow(order);

        // Find the original purchase txn we wrote when this order
        // was paid, then revert whatever's left of it.
        const purchaseTxn = await prisma.aiCreditTransaction.findFirst({
          where: {
            kind: "purchase",
            meta: { path: ["polarOrderId"], equals: order.id },
          },
          select: { id: true },
        });
        if (purchaseTxn) {
          await refundPurchase(purchaseTxn.id, `Polar order ${order.id} refunded`);
        }
        break;
      }

      default:
        // Acked but no-op. Many of Polar's event types (benefit
        // grants, customer state changed, etc.) aren't relevant to
        // the billing surfaces we own.
        break;
    }
  } catch (err) {
    // Never 5xx Polar - their queue will retry forever. Log here
    // and return 200 so the user-visible side gets investigated
    // through our own observability instead.
    console.error("[polar-webhook] handler failed", { type: event.type, err });
  }

  return NextResponse.json({ ok: true });
}

async function findSubIdByExternal(externalId: string): Promise<string | null> {
  const row = await prisma.subscription.findFirst({
    where:  { externalSubscriptionId: externalId },
    select: { id: true },
  });
  return row?.id ?? null;
}

function mapSubStatus(polarStatus: string): string {
  switch (polarStatus) {
    case "active":      return "active";
    case "trialing":    return "trialing";
    case "past_due":    return "past_due";
    case "canceled":    return "canceled";
    case "incomplete":  return "incomplete";
    default:            return polarStatus;
  }
}
