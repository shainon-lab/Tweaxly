import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { parseMonthlyWorkbook, kindFromName } from "@/lib/parsers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await requireBusiness();
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseMonthlyWorkbook(file.name, buf);
  if (parsed.sheets.length === 0) {
    return NextResponse.json(
      {
        error:
          "Could not find any sheet with category columns and numeric values in this file.",
      },
      { status: 400 },
    );
  }
  const sheets = parsed.sheets.map((s) => {
    const categories = Object.keys(s.totals);
    const items = categories.map((cat) => {
      const amount = s.totals[cat];
      const guessed = kindFromName(cat);
      return {
        category: cat,
        amount,
        direction: amount >= 0 ? "income" : ("expense" as "income" | "expense"),
        kind: guessed.kind,
        isOneTime: guessed.isOneTime,
      };
    });
    const incomeTotal = items
      .filter((i) => i.amount > 0)
      .reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = items
      .filter((i) => i.amount < 0)
      .reduce((sum, i) => sum + Math.abs(i.amount), 0);
    return {
      sheetName: s.sheetName,
      detectedMonth: s.detectedMonth,
      rowCount: s.rowCount,
      items,
      incomeTotal,
      expenseTotal,
    };
  });
  return NextResponse.json({
    filename: file.name,
    sheets,
  });
}
