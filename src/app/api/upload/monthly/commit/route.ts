import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { kindFromName } from "@/lib/parsers";
import { dateToYM } from "@/lib/format";

export const runtime = "nodejs";

type Item = {
  category: string;
  amount: number; // signed: + income, − expense
};

type SheetCommit = {
  sheetName: string;
  // Either YYYY-MM directly, or an ISO date string we'll convert.
  representsMonth?: string;
  representsDate?: string;
  items: Item[];
};

type Body = {
  filename: string;
  sheets: SheetCommit[];
};

function ymOrFromDate(
  representsMonth: string | undefined,
  representsDate: string | undefined,
): string | null {
  if (representsMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(representsMonth)) {
    return representsMonth;
  }
  if (representsDate) {
    const d = new Date(representsDate);
    if (!Number.isNaN(d.getTime())) return dateToYM(d);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = (await req.json()) as Body;
  if (!body.filename || !Array.isArray(body.sheets) || body.sheets.length === 0) {
    return NextResponse.json(
      { error: "filename and at least one sheet are required" },
      { status: 400 },
    );
  }

  // Resolve / cache categories across all sheets so we don't redo lookups.
  const categoryByName = new Map<string, { id: string; isOneTime: boolean }>();
  async function ensureCategory(rawName: string) {
    const name = rawName.trim();
    if (!name) return null;
    let entry = categoryByName.get(name);
    if (entry) return entry;
    let cat = await prisma.category.findFirst({
      where: { businessId: business.id, name },
    });
    if (!cat) {
      const guessed = kindFromName(name);
      cat = await prisma.category.create({
        data: {
          businessId: business.id,
          name,
          kind: guessed.kind,
          isOneTime: guessed.isOneTime,
        },
      });
    }
    entry = { id: cat.id, isOneTime: cat.isOneTime };
    categoryByName.set(name, entry);
    return entry;
  }

  const results: {
    sheetName: string;
    batchId: string;
    representsMonth: string;
    imported: number;
  }[] = [];

  for (const sheet of body.sheets) {
    const ym = ymOrFromDate(sheet.representsMonth, sheet.representsDate);
    if (!ym) {
      return NextResponse.json(
        {
          error: `Sheet "${sheet.sheetName}" has no valid month. Provide representsMonth (YYYY-MM) or representsDate.`,
        },
        { status: 400 },
      );
    }
    // Use the first day of the month as the transactionDate.
    const [yearStr, monthStr] = ym.split("-");
    const txnDate = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));

    const batch = await prisma.uploadBatch.create({
      data: {
        businessId: business.id,
        source: "monthly_summary",
        mode: "monthly_summary",
        filename: `${body.filename} :: ${sheet.sheetName}`,
        rowCount: sheet.items.length,
        representsMonth: ym,
      },
    });

    // Pull the actual category record so we can use its `kind` to decide the
    // sign convention. The category drives whether this is income or expense
    // - NOT the user-uploaded sign. This matters when the spreadsheet has
    // all-positive numbers (e.g. user lists "Marketing 2400" without a minus).
    const ensuredIds = new Set<string>();
    for (const item of sheet.items) {
      const cat = await ensureCategory(item.category);
      if (cat) ensuredIds.add(cat.id);
    }
    const ensuredCats = await prisma.category.findMany({
      where: { id: { in: Array.from(ensuredIds) } },
    });
    const kindById = new Map(ensuredCats.map((c) => [c.id, c.kind]));

    let imported = 0;
    for (const item of sheet.items) {
      const cat = await ensureCategory(item.category);
      if (!cat) continue;
      const raw = Number(item.amount);
      if (!Number.isFinite(raw) || raw === 0) continue;
      const kind = kindById.get(cat.id) ?? "other";
      // Sign convention is driven by category kind:
      //   revenue  → positive (income)
      //   anything else → negative (outcome)
      // The user's upload sign is treated as a magnitude.
      const magnitude = Math.abs(raw);
      const isIncomeKind = kind === "revenue";
      const signedAmount = isIncomeKind ? magnitude : -magnitude;
      const type = isIncomeKind ? "income" : "expense";
      await prisma.transaction.create({
        data: {
          businessId: business.id,
          uploadBatchId: batch.id,
          source: "monthly_summary",
          originalSourceFile: body.filename,
          transactionDate: txnDate,
          accountingMonth: ym,
          amount: signedAmount,
          currency: business.currency,
          type,
          categoryId: cat.id,
          description: item.category,
          isOneTime: cat.isOneTime,
        },
      });
      imported++;
    }

    results.push({
      sheetName: sheet.sheetName,
      batchId: batch.id,
      representsMonth: ym,
      imported,
    });
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  return NextResponse.json({
    sheets: results,
    sheetCount: results.length,
    totalImported,
  });
}
