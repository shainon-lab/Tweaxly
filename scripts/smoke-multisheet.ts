/* Multi-sheet workbook smoke test:
 *   - parseMonthlyWorkbook should iterate every sheet
 *   - parseSheetNameToYM should detect months from common sheet-name formats
 *   - Each sheet's totals are summed correctly per category */
import * as XLSX from "xlsx";
import { parseMonthlyWorkbook, parseSheetNameToYM } from "../src/lib/parsers";

function main() {
  // ── Sheet name parser ──────────────────────────────────────────────────────
  const cases: { name: string; expected: string | null }[] = [
    { name: "January 2026", expected: "2026-01" },
    { name: "Jan 2026", expected: "2026-01" },
    { name: "jan-2026", expected: "2026-01" },
    { name: "Jan-26", expected: "2026-01" },
    { name: "Jan26", expected: "2026-01" },
    { name: "2026-01", expected: "2026-01" },
    { name: "2026/01", expected: "2026-01" },
    { name: "2026.01", expected: "2026-01" },
    { name: "01/2026", expected: "2026-01" },
    { name: "01-2026", expected: "2026-01" },
    { name: "December 2025", expected: "2025-12" },
    { name: "Dec 2025", expected: "2025-12" },
    { name: "2026-Jan", expected: "2026-01" },
    { name: "2026 January", expected: "2026-01" },
    // ambiguous / non-month names
    { name: "Sheet1", expected: null },
    { name: "Summary", expected: null },
    { name: "Q1 totals", expected: null },
  ];
  console.log("— Sheet-name parser cases —");
  let failed = 0;
  for (const c of cases) {
    const got = parseSheetNameToYM(c.name);
    const ok = got === c.expected;
    console.log(`  ${ok ? "✓" : "✗"} "${c.name}" → ${got ?? "null"}  (expected ${c.expected ?? "null"})`);
    if (!ok) failed++;
  }
  if (failed > 0) throw new Error(`${failed} sheet-name parser case(s) failed`);

  // ── Multi-sheet workbook ───────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Revenue", "Marketing", "Rent"],
      [28000, -2400, -3500],
    ]),
    "January 2026",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Revenue", "Marketing", "Rent", "Surprise"],
      [31000, -1800, -3500, -1200],
    ]),
    "Feb 2026",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Revenue", "Marketing", "Rent"],
      [32000, -1500, -3500],
      [1500, -200, 0], // sub-row that should be summed
    ]),
    "2026-03",
  );
  // A sheet with no parseable month — user will pick manually
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Revenue", "Marketing"],
      [5000, -300],
    ]),
    "Random Tab",
  );
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  console.log("\n— Multi-sheet workbook —");
  const parsed = parseMonthlyWorkbook("multi.xlsx", buf);
  console.log(`Filename: ${parsed.filename}`);
  console.log(`Sheets parsed: ${parsed.sheets.length}`);
  for (const s of parsed.sheets) {
    console.log(`  · ${s.sheetName.padEnd(15)} detected=${s.detectedMonth ?? "null"} categories=${Object.keys(s.totals).length} rows=${s.rowCount}`);
    for (const [cat, amt] of Object.entries(s.totals)) {
      console.log(`      ${cat.padEnd(20)} ${amt}`);
    }
  }
  // March sheet should have summed amounts: Revenue 33500, Marketing -1700, Rent -3500
  const mar = parsed.sheets.find((s) => s.sheetName === "2026-03");
  if (!mar) throw new Error("March sheet missing");
  if (mar.totals["Revenue"] !== 33500) throw new Error(`Expected March Revenue 33500, got ${mar.totals["Revenue"]}`);
  if (mar.totals["Marketing"] !== -1700) throw new Error(`Expected March Marketing -1700, got ${mar.totals["Marketing"]}`);
  // March's "Rent" sub-row was 0 so we don't expect that to be summed beyond -3500
  if (mar.totals["Rent"] !== -3500) throw new Error(`Expected March Rent -3500, got ${mar.totals["Rent"]}`);

  // Random Tab should have null detectedMonth
  const random = parsed.sheets.find((s) => s.sheetName === "Random Tab");
  if (!random) throw new Error("Random Tab missing");
  if (random.detectedMonth !== null) throw new Error(`Expected Random Tab month null, got ${random.detectedMonth}`);

  console.log("\nAll good.");
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
