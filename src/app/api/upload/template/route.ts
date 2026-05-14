// Emit the canonical Tweaxly transactions CSV template. Users download
// this, fill in their business activity row-by-row, and upload it back —
// the dated-upload pipeline assigns each transaction to its accounting
// month based on the date column (vs the monthly-summary path which pins
// everything to a single month).
//
// Columns:
//   date         (required, YYYY-MM-DD)
//   type         (required, "income" | "expense")
//   amount       (required, numeric, positive)
//   currency     (required, 3-letter code)
//   category     (optional)
//   description  (optional, free text)
//   notes        (optional, business context for AI consultation)

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TEMPLATE_CSV = [
  "date,type,amount,currency,category,description,notes",
  "2025-01-03,income,12000,USD,Revenue,Monthly subscription revenue,",
  "2025-01-05,expense,3200,USD,Advertising,Google Ads campaign,Large seasonal campaign before summer",
  "2025-01-10,expense,45000,ILS,Salaries,January salaries,",
  "2025-01-15,income,50000,ILS,,Transfer from owner,Owner funding due to delayed USD conversion",
].join("\n") + "\n";

export async function GET() {
  return new NextResponse(TEMPLATE_CSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tweaxly-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
