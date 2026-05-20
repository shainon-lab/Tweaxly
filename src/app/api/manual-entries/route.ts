import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createManualEntryAndMaterialize,
  isValidFrequency,
  type Frequency,
} from "@/lib/manualEntries";
import { kindFromName } from "@/lib/parsers";

export const runtime = "nodejs";

// GET — list all manual entries for the current business (with category + count of materialized txns)
export async function GET() {
  const { business } = await requireBusiness();
  const entries = await prisma.manualEntry.findMany({
    where: { businessId: business.id },
    include: {
      category: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

// POST — create a new manual entry. Body:
// {
//   type: "income" | "outcome",
//   categoryId: string OR newCategoryName: string,
//   amount: number (positive),
//   frequency: "one_time" | "monthly" | "quarterly" | "yearly",
//   startDate: ISO date string,
//   endDate?: ISO date string,
//   notes?: string
// }
export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json();

  // Validate type
  const type = body.type === "income" ? "income" : body.type === "outcome" ? "outcome" : null;
  if (!type) {
    return NextResponse.json({ error: "type must be income or outcome" }, { status: 400 });
  }

  // Validate frequency
  if (typeof body.frequency !== "string" || !isValidFrequency(body.frequency)) {
    return NextResponse.json(
      { error: "frequency must be one_time | monthly | quarterly | yearly" },
      { status: 400 },
    );
  }
  const frequency: Frequency = body.frequency;

  // Validate amount
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  // Validate dates
  const startDate = body.startDate ? new Date(body.startDate) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }
  const endDate = body.endDate ? new Date(body.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "endDate is invalid" }, { status: 400 });
  }
  if (endDate && startDate > endDate) {
    return NextResponse.json({ error: "endDate must be on/after startDate" }, { status: 400 });
  }

  // Resolve category — either existing or new
  let categoryId: string | null = null;
  if (typeof body.categoryId === "string" && body.categoryId.length > 0) {
    const owned = await prisma.category.findFirst({
      where: { id: body.categoryId, businessId: business.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "category not found" }, { status: 400 });
    }
    categoryId = owned.id;
  } else if (typeof body.newCategoryName === "string" && body.newCategoryName.trim().length > 0) {
    const name = body.newCategoryName.trim();
    let cat = await prisma.category.findFirst({
      where: { businessId: business.id, name },
    });
    if (!cat) {
      const guessed = kindFromName(name);
      // For income type, force kind=revenue regardless of name heuristic
      const kind = type === "income" ? "revenue" : guessed.kind;
      cat = await prisma.category.create({
        data: {
          businessId: business.id,
          name,
          kind,
          isOneTime: frequency === "one_time",
        },
      });
    }
    categoryId = cat.id;
  } else {
    return NextResponse.json(
      { error: "categoryId or newCategoryName required" },
      { status: 400 },
    );
  }

  // Optional currency override. Defaults to the business base currency
  // when omitted. We accept any ISO-ish 3-letter string and the
  // materializer hands it to the FX service — same path the CSV
  // importer uses, so cache + lookup behaviour is identical.
  const currency = typeof body.currency === "string" && body.currency.trim().length === 3
    ? body.currency.trim().toUpperCase()
    : business.currency;

  const result = await createManualEntryAndMaterialize({
    businessId: business.id,
    type,
    categoryId,
    amount,
    currency,
    frequency,
    startDate,
    endDate,
    notes: typeof body.notes === "string" ? body.notes : null,
  });

  return NextResponse.json({
    entry: result.entry,
    materialized: result.materialized,
  });
}

// DELETE — remove a manual entry. ON DELETE CASCADE on Transaction.manualEntryId
// removes all materialized transactions automatically.
export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const owned = await prisma.manualEntry.findFirst({
    where: { id, businessId: business.id },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Count for the response
  const count = await prisma.transaction.count({
    where: { manualEntryId: id, businessId: business.id },
  });
  await prisma.manualEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedTransactions: count });
}
