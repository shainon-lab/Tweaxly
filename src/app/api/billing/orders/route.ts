// GET /api/billing/orders
//
// Returns every Polar order the authenticated user can see - that is,
// orders belonging to any workspace they're a member of. Single
// endpoint feeds the customer-facing Orders & Invoices section under
// Billing & Products.
//
// Filtered to: businesses where the user has an active membership,
// PLUS any orders whose polarCustomerEmail matches the user's email
// (covers legacy orders that pre-date the workspace metadata - they
// surface with workspaceName="Unknown workspace" so the user still
// sees a record).
//
// Sorted newest-first. No pagination today - one user's billing
// history fits comfortably in one page; we'll add pagination when a
// workspace racks up >100 events.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  // Workspaces the user can see. Includes their own owned businesses
  // and any active memberships (covers future team-member case).
  const memberships = await prisma.businessMembership.findMany({
    where:  { userId: user.id, status: "active" },
    select: { businessId: true },
  });
  const accessibleBusinessIds = memberships.map((m) => m.businessId);

  const orders = await prisma.polarOrder.findMany({
    where: {
      OR: [
        ...(accessibleBusinessIds.length > 0
          ? [{ businessId: { in: accessibleBusinessIds } }]
          : []),
        // Email fallback for legacy / un-mapped orders. Polar normalises
        // emails to lowercase but we lowercase ours too to be safe.
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
