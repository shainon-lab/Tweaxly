// GET /api/admin/billing/orders
//
// Super-admin view of every Polar order across the platform. Powers
// the /admin/billing/orders table. Pagination + email search; defaults
// to newest first.
//
// Query params:
//   q     - partial email match (case-insensitive)
//   page  - 1-indexed; defaults to 1
//   limit - rows per page; defaults to 50, max 200
//
// Auth: requireSuperAdminApi. Regular admins do NOT get access to the
// global billing ledger - it's super-admin only per spec.

import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireSuperAdminApi();
  if (!gate.ok) return gate.response;

  const url   = new URL(req.url);
  const q     = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const page  = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const skip  = (page - 1) * limit;

  const where = q
    ? {
        polarCustomerEmail: { contains: q, mode: "insensitive" as const },
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.polarOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id:                 true,
        polarOrderId:       true,
        polarOrderNumber:   true,
        polarCustomerId:    true,
        polarCustomerEmail: true,
        businessId:         true,
        businessName:       true,
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
    }),
    prisma.polarOrder.count({ where }),
  ]);

  return NextResponse.json({
    orders: rows.map((o) => ({
      id:                 o.id,
      polarOrderId:       o.polarOrderId,
      polarOrderNumber:   o.polarOrderNumber,
      polarCustomerId:    o.polarCustomerId,
      polarCustomerEmail: o.polarCustomerEmail,
      workspaceId:        o.businessId,
      workspaceName:      o.businessName ?? "Unknown workspace",
      productName:        o.productName,
      productType:        o.productType,
      purchaseType:       o.purchaseType,
      creditsAmount:      o.creditsAmount,
      amountCents:        o.amountCents,
      currency:           o.currency,
      status:             o.status,
      invoiceNumber:      o.invoiceNumber,
      invoiceGenerated:   o.invoiceGenerated,
      createdAt:          o.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
