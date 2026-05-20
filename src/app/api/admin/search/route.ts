// GET /api/admin/search?q=...
//
// Cross-tenant search for the admin command bar. Returns grouped
// results: businesses, users, consultations. (Invoice/Order/Payment
// types are listed in the spec but no underlying tables exist yet -
// they'll plug in here once Stripe is wired.)
//
// Limit: 5 per group. The bar is for "find then jump", not for
// browsing.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ businesses: [], users: [], consultations: [] });
  }
  const contains = { contains: q, mode: "insensitive" as const };

  const [businesses, users, consultations] = await Promise.all([
    prisma.business.findMany({
      where: {
        OR: [
          { id: { contains: q } },
          { name: contains },
        ],
      },
      take: 5,
      orderBy: { lastActivityAt: "desc" },
      select: { id: true, name: true, status: true, plan: true, owner: { select: { email: true } } },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { email: contains },
          { name:  contains },
          { id:    { contains: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, systemRole: true,
        businesses: { select: { id: true, name: true }, take: 1 },
      },
    }),
    prisma.consultation.findMany({
      where: {
        OR: [
          { id: { contains: q } },
          { title: contains },
        ],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, business: { select: { id: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ businesses, users, consultations });
}
