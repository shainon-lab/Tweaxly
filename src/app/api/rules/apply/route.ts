import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findApplicableRule } from "@/lib/categorize";

export const runtime = "nodejs";

export async function POST() {
  const { business } = await requireBusiness();
  const [rules, txns] = await Promise.all([
    prisma.categorizationRule.findMany({ where: { businessId: business.id } }),
    prisma.transaction.findMany({ where: { businessId: business.id } }),
  ]);
  let updated = 0;
  for (const t of txns) {
    const app = findApplicableRule(rules, {
      description: t.description, vendor: t.vendor, source: t.source,
    });
    if (!app) continue;
    if (t.categoryId === app.categoryId && t.isRecurring === (t.isRecurring || app.setRecurring) && t.isOneTime === (t.isOneTime || app.setOneTime)) {
      continue;
    }
    await prisma.transaction.update({
      where: { id: t.id },
      data: {
        categoryId: app.categoryId,
        isRecurring: t.isRecurring || app.setRecurring,
        isOneTime: t.isOneTime || app.setOneTime,
      },
    });
    updated++;
  }
  return NextResponse.json({ updated });
}
