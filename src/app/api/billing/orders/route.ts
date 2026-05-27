// GET /api/billing/orders
//
// Returns every Polar order the authenticated user PAID FOR. Tied to
// the paying identity (this user account), not to workspace access -
// so a workspace member who didn't pay won't see another user's
// orders, and a user who paid for multiple workspaces sees all of
// them in one place.
//
// Filter:
//   - polarCustomerEmail matches the user's email (case-insensitive),
//     OR
//   - userId on the order matches the user.id we stamped at checkout.
//
// Each row includes its workspaceName so the user can tell at a
// glance which workspace the order belonged to.
//
// Sorted newest-first. No pagination today - one user's billing
// history fits comfortably in one page; we'll add pagination if a
// single account ever racks up >100 events.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  const orders = await prisma.polarOrder.findMany({
    where: {
      OR: [
        // Polar normalises customer emails to lowercase; we do too so
        // the comparison is symmetric.
        { polarCustomerEmail: user.email.toLowerCase() },
        { userId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id:                 true,
      polarOrderId:       true,
      polarOrderNumber:   true,
      businessName:       true,
      businessId:         true,
      productName:        true,
      productType:        true,
      purchaseType:       true,
      creditsAmount:      true,
      amountCents:        true,
      currency:           true,
      status:             true,
      invoiceNumber:      true,
      invoiceGenerated:   true,
      createdAt:          true,
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id:               o.id,
      polarOrderId:     o.polarOrderId,
      polarOrderNumber: o.polarOrderNumber,
      workspaceId:      o.businessId,
      // Fall back to "Unknown workspace" for legacy/unmapped orders
      // per the spec.
      workspaceName:    o.businessName ?? "Unknown workspace",
      productName:      o.productName,
      productType:      o.productType,
      purchaseType:     o.purchaseType,
      creditsAmount:    o.creditsAmount,
      amountCents:      o.amountCents,
      currency:         o.currency,
      status:           o.status,
      invoiceNumber:    o.invoiceNumber,
      invoiceGenerated: o.invoiceGenerated,
      createdAt:        o.createdAt.toISOString(),
    })),
  });
}
