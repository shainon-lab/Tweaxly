// GET /api/billing/orders/[orderId]/invoice
//
// Customer-facing invoice download. The orderId in the path is OUR
// internal PolarOrder.id (a cuid), NOT the Polar order id - that way
// the URL doesn't leak Polar's identifier scheme and we can authorize
// on our own row before touching the Polar API.
//
// Behavior:
//   1. Look up the PolarOrder by our id.
//   2. Verify the authenticated user can see this order (member of
//      its workspace OR matching customer email).
//   3. Ask Polar for a fresh signed invoice URL via fetchOrderInvoiceUrl.
//   4. Return JSON:
//        200 { url: "<short-lived Polar URL>" }            — open in new tab
//        202 { status: "generating" }                      — UI polls
//        502 { error: "invoice_unavailable", message }     — surface error
//
// Polar invoice URLs are short-lived signed URLs; do NOT cache them -
// re-resolve every time. The Polar API key never leaves the server.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchOrderInvoiceUrl } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requireUser();

  const order = await prisma.polarOrder.findUnique({
    where: { id: orderId },
    select: {
      polarOrderId:       true,
      userId:             true,
      polarCustomerEmail: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Authorization: the order belongs to this user IF the userId on
  // the row matches OR the customer email matches the user's. Mirrors
  // the listing endpoint's payer-only filter so a row visible in
  // /api/billing/orders is downloadable here, and a workspace member
  // who didn't pay can't grab the invoice.
  const userOwnsRow = order.userId === user.id;
  const emailMatch  = order.polarCustomerEmail === user.email.toLowerCase();
  if (!userOwnsRow && !emailMatch) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await fetchOrderInvoiceUrl(order.polarOrderId);
  if (result.ok) {
    return NextResponse.json({ url: result.url });
  }
  if (result.reason === "generating") {
    return NextResponse.json(
      { status: "generating", message: "Invoice is being generated - try again in a few seconds." },
      { status: 202 },
    );
  }
  return NextResponse.json(
    { error: "invoice_unavailable", message: result.message ?? "Invoice could not be retrieved." },
    { status: 502 },
  );
}
