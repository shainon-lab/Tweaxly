// GET /api/admin/billing/orders/[orderId]/invoice
//
// Admin variant of the invoice download. Same Polar-side behavior as
// the customer endpoint (resolve fresh signed URL, trigger generation
// on 404, return JSON with url / generating / error), but the auth
// gate is super-admin instead of workspace membership - the admin
// view spans every workspace by design.

import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchOrderInvoiceUrl } from "@/lib/billing/polar";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const gate = await requireSuperAdminApi();
  if (!gate.ok) return gate.response;

  const { orderId } = await params;

  const order = await prisma.polarOrder.findUnique({
    where:  { id: orderId },
    select: { polarOrderId: true },
  });
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
