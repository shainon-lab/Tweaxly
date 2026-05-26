// POST /api/admin/billing/orders/backfill
//
// Super-admin one-off reconciliation. Pulls every order from Polar's
// orders.list and upserts each into our PolarOrder ledger. Used to
// catch up on orders that pre-date the ledger code OR to backfill
// after a webhook outage.
//
// Workspace mapping fallback chain (since older orders don't carry
// our checkout metadata):
//   1. metadata.businessId on the Polar order (new orders)
//   2. Subscription.externalCustomerId == order.customerId
//      (subscription orders we've seen before)
//   3. Subscription.externalSubscriptionId == order.subscriptionId
//      (subscription orders for known subs)
//   4. User.email == order.customer.email → user's primary Business
//      (legacy customers who pre-date subscription tracking)
//
// Rows that still can't be mapped land with businessId=null and show
// as "Unknown workspace" in the customer + admin tables; an admin can
// edit them later if needed.

import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPolar } from "@/lib/billing/polar";
import { upsertPolarOrderFromPayload } from "@/lib/billing/polar-orders";

export const dynamic  = "force-dynamic";
export const runtime  = "nodejs";
// Polar pagination is slow; allow longer than the default 10s.
export const maxDuration = 60;

async function resolveWorkspace(order: {
  customerId:      string;
  subscriptionId?: string | null;
  customer?:       { email?: string | null } | null;
  metadata?:       unknown;
}): Promise<{ businessId: string | null; businessName: string | null; userId: string | null }> {
  // (1) metadata.businessId is the cheapest path - already set on new
  // orders by our checkout routes.
  const meta = order.metadata && typeof order.metadata === "object"
    ? (order.metadata as Record<string, unknown>)
    : {};
  const metaBusinessId = typeof meta.businessId === "string" ? meta.businessId : null;
  if (metaBusinessId) {
    const biz = await prisma.business.findUnique({
      where:  { id: metaBusinessId },
      select: { id: true, name: true, ownerId: true },
    });
    if (biz) return { businessId: biz.id, businessName: biz.name, userId: biz.ownerId };
  }

  // (2) externalCustomerId on an existing Subscription. Polar's
  // customer ID is stable across subscription renewals, so this works
  // for renewals AND for pack purchases by the same customer.
  if (order.customerId) {
    const sub = await prisma.subscription.findFirst({
      where:   { externalCustomerId: order.customerId },
      orderBy: { createdAt: "desc" },
      select:  { businessId: true, business: { select: { name: true, ownerId: true } } },
    });
    if (sub?.businessId) {
      return {
        businessId:   sub.businessId,
        businessName: sub.business?.name ?? null,
        userId:       sub.business?.ownerId ?? null,
      };
    }
  }

  // (3) externalSubscriptionId match (subscription order whose sub we
  // saw before but the customerId on this order somehow differs).
  if (order.subscriptionId) {
    const sub = await prisma.subscription.findFirst({
      where:  { externalSubscriptionId: order.subscriptionId },
      select: { businessId: true, business: { select: { name: true, ownerId: true } } },
    });
    if (sub?.businessId) {
      return {
        businessId:   sub.businessId,
        businessName: sub.business?.name ?? null,
        userId:       sub.business?.ownerId ?? null,
      };
    }
  }

  // (4) Email → user → user's primary business. Last resort; only the
  // user's OWNED businesses are considered (memberships don't count
  // here because we can't be sure which workspace the user paid for).
  const email = order.customer?.email?.toLowerCase() ?? null;
  if (email) {
    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, businesses: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true, name: true } } },
    });
    const biz = user?.businesses[0];
    if (biz && user) {
      return { businessId: biz.id, businessName: biz.name, userId: user.id };
    }
  }

  return { businessId: null, businessName: null, userId: null };
}

export async function POST() {
  const gate = await requireSuperAdminApi();
  if (!gate.ok) return gate.response;

  const polar = getPolar();

  let fetched = 0;
  let created = 0;
  let updated = 0;
  let unmapped = 0;
  let errors  = 0;
  const errorSamples: { orderId: string; message: string }[] = [];

  try {
    // PageIterator handles pagination automatically - iterate every
    // page until exhausted. Limit per page is Polar's max (100).
    const pages = await polar.orders.list({ limit: 100 });
    for await (const page of pages) {
      const items = page.result?.items ?? [];
      for (const order of items) {
        fetched++;
        const { businessId, businessName, userId } = await resolveWorkspace({
          customerId:     order.customerId,
          subscriptionId: order.subscriptionId,
          customer:       order.customer,
          metadata:       order.metadata,
        });
        if (!businessId) unmapped++;

        const result = await upsertPolarOrderFromPayload(
          {
            id:                 order.id,
            createdAt:          order.createdAt,
            totalAmount:        order.totalAmount,
            currency:           order.currency,
            status:             String(order.status),
            billingReason:      order.billingReason ? String(order.billingReason) : null,
            invoiceNumber:      order.invoiceNumber,
            isInvoiceGenerated: order.isInvoiceGenerated,
            customerId:         order.customerId,
            productId:          order.productId,
            subscriptionId:     order.subscriptionId,
            checkoutId:         order.checkoutId,
            customer:           order.customer ? { email: order.customer.email, id: order.customer.id } : null,
            product:            order.product  ? { name:  order.product.name,   id: order.product.id   } : null,
            metadata:           order.metadata,
          },
          { businessId: businessId ?? undefined, businessName: businessName ?? undefined, userId: userId ?? undefined },
        );

        if (!result.ok) {
          errors++;
          if (errorSamples.length < 5) errorSamples.push({ orderId: order.id, message: result.message });
          continue;
        }
        if (result.action === "created") created++;
        else                              updated++;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: "polar_list_failed",
      message,
      partial: { fetched, created, updated, unmapped, errors, errorSamples },
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    fetched,
    created,
    updated,
    unmapped,
    errors,
    errorSamples,
  });
}
