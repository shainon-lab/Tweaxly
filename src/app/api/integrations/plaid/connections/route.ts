// GET /api/integrations/plaid/connections
//
// Returns the current workspace's Plaid connections + their linked
// accounts (one FinancialSource per Plaid account) for the
// integrations UI. The encrypted access_token is NEVER serialized
// out of here.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { business } = await requireBusiness();

  const conns = await prisma.plaidConnection.findMany({
    where:   { businessId: business.id, status: { not: "disconnected" } },
    orderBy: { createdAt: "desc" },
    include: {
      financialSources: {
        where:   { status: "active" },
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, type: true, last4: true, currency: true,
          currentBalance: true, availableBalance: true,
        },
      },
    },
  });

  return NextResponse.json({
    connections: conns.map((c) => ({
      id:                  c.id,
      institutionName:     c.institutionName,
      status:              c.status,
      lastError:           c.lastError,
      lastSyncCompletedAt: c.lastSyncCompletedAt?.toISOString() ?? null,
      createdAt:           c.createdAt.toISOString(),
      accounts:            c.financialSources,
    })),
  });
}
