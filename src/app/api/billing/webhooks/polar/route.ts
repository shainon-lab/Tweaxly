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
import { POLAR_PROVIDER, type CheckoutMetadata } from "@/lib/billing/polar";

// Polar requires the *raw* request body to verify the HMAC. Next 14
// app router gives us req.text() which preserves it byte-for-byte.
export const dynamic = "force-dynamic";

function readMeta(meta: unknown): Partial<CheckoutMetadata> {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    businessId:  typeof m.businessId === "string" ? m.businessId : undefined,
    kind:        m.kind === "subscription" || m.kind === "pack" ? m.kind : undefined,
    packSku:     typeof m.packSku === "string" ? m.packSku : undefined,
    // packCredits is stamped as a string (Polar metadata is scalar-only).
    packCredits: typeof m.packCredits === "string"
      ? m.packCredits
      : (typeof m.packCredits === "number" ? String(m.packCredits) : undefined),
  };
}

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
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
        } else {
          await prisma.subscription.create({
            data: { businessId: meta.businessId, ...data },
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
      case "order.paid": {
        const order = event.data;
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
