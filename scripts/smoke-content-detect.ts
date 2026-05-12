/* Smoke for content-based column detection.
 * Verifies guessMapping can find Date and Amount even when headers are unusual,
 * generic, or in a foreign language. */
import * as XLSX from "xlsx";
import { parseFileBuffer, guessMapping } from "../src/lib/parsers";

function build(rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function test(label: string, rows: (string | number)[][], expected: { date: string; amount: string; description?: string }) {
  const buf = build(rows);
  const parsed = parseFileBuffer("test.xlsx", buf);
  const guess = guessMapping(parsed.headers, parsed.rows);
  const ok =
    guess.date === expected.date &&
    guess.amount === expected.amount &&
    (expected.description === undefined || guess.description === expected.description);
  console.log(
    `  ${ok ? "✓" : "✗"} ${label.padEnd(48)} → date=${guess.date} amount=${guess.amount} description=${guess.description}`,
  );
  if (!ok) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(guess)}`);
}

console.log("— Content-based column detection —");

// 1) Standard headers — header heuristic should still work
test(
  "standard 'Date / Description / Amount' headers",
  [
    ["Date", "Description", "Amount"],
    ["2026-01-01", "Coffee", -5],
    ["2026-01-02", "Salary", 5000],
  ],
  { date: "Date", amount: "Amount", description: "Description" },
);

// 2) Generic single-letter headers — content detection picks them
test(
  "single-letter headers ('A', 'B', 'C')",
  [
    ["A", "B", "C"],
    ["2026-01-15", "AMAZON.COM", -45],
    ["2026-02-10", "STRIPE PAYOUT", 1200],
    ["2026-02-15", "RENT", -1500],
    ["2026-03-01", "ACME PAYROLL DEPOSIT", 5000],
    ["2026-03-10", "OFFICE SUPPLY", -120],
  ],
  { date: "A", amount: "C", description: "B" },
);

// 3) Numeric-only headers (Excel auto-numbered)
test(
  "headers labeled '1', '2', '3'",
  [
    ["1", "2", "3"],
    ["2026-01-15", "Description text here", 1200],
    ["2026-02-10", "Another row", -45],
    ["2026-03-01", "Third row", 100],
  ],
  { date: "1", amount: "3", description: "2" },
);

// 4) Mixed up order — date in the middle
test(
  "date in the middle column",
  [
    ["Memo", "When", "Sum"],
    ["Coffee", "2026-01-15", -5],
    ["Salary deposit", "2026-02-01", 5000],
    ["Rent", "2026-02-05", -1500],
  ],
  { date: "When", amount: "Sum", description: "Memo" },
);

// 5) Hebrew-only headers that don't match exact synonyms — content fallback
test(
  "Hebrew headers (no exact synonym match)",
  [
    ["ת. עסקה", "פרטים", "סכום בש\"ח"],
    ["2026-01-15", "קפה", -25],
    ["2026-02-01", "משכורת", 12000],
    ["2026-02-05", "שכירות", -3500],
  ],
  { date: "ת. עסקה", amount: 'סכום בש"ח' },
);

console.log("\nAll good.");
