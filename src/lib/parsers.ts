// File parsing - handles CSV and XLSX uniformly via SheetJS.
// Returns { headers, rows } where rows are { [header]: cellValue }.
import * as XLSX from "xlsx";

export type ParsedRow = Record<string, unknown>;
export type ParsedFile = { headers: string[]; rows: ParsedRow[] };

export function parseFileBuffer(filename: string, buf: Buffer): ParsedFile {
  const isCsv = /\.csv$/i.test(filename);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  let headers: string[] = json.length > 0 ? Object.keys(json[0]) : [];
  // Drop fully empty rows.
  let rows = json.filter((r) =>
    Object.values(r).some((v) => v !== null && v !== ""),
  );

  // ── Split-amount fallback ─────────────────────────────────────────────────
  // Some files split outflows and inflows into two columns: bank exports use
  // Debit/Credit, while accounting/P&L exports use Income/Expense (or
  // Revenue/Expenses). If we detect either pattern AND there's no clear
  // single-amount column, synthesize one so guessMapping can pick it up.
  const lower = headers.map((h) => h.toLowerCase().trim());
  const hasSingleAmount = lower.some((h) =>
    /^(amount|amt|value|sum|total|transaction\s*amount|txn\s*amount)$/.test(h),
  );
  const inflowRe  = /^(credit|credits|deposit|deposits|in|inflow|inflows|incoming|income|revenue|revenues|sales|זכות|זיכויים)$/;
  const outflowRe = /^(debit|debits|withdrawal|withdrawals|out|outflow|outflows|outgoing|outcome|expense|expenses|cost|costs|חובה|חיובים)$/;
  const inflowIdx  = lower.findIndex((h) => inflowRe.test(h));
  const outflowIdx = lower.findIndex((h) => outflowRe.test(h));
  if (!hasSingleAmount && inflowIdx !== -1 && outflowIdx !== -1) {
    const inflowH = headers[inflowIdx];
    const outflowH = headers[outflowIdx];
    const SYNTH = "Amount (auto)";
    // Prepend so it's picked first by guessMapping
    headers = [SYNTH, ...headers];
    rows = rows.map((r) => {
      const inflow  = parseAmount(r[inflowH]);
      const outflow = parseAmount(r[outflowH]);
      // Inflows are positive; outflows are negative. The user's outflow values
      // may already be negative in the file - abs-then-negate so we end up
      // with consistent signs regardless of how the source represented them.
      const synthesized = Math.abs(inflow) - Math.abs(outflow);
      return { ...r, [SYNTH]: synthesized };
    });
  }

  void isCsv;
  return { headers, rows };
}

// Heuristic: guess which header maps to which canonical field.
// Wide synonym lists so most bank/credit/payment exports auto-detect without
// the user having to map columns manually.
const FIELD_HINTS: Record<string, string[]> = {
  date: [
    "date",
    "posted",
    "posting date",
    "post date",
    "transaction date",
    "trans date",
    "trans. date",
    "txn date",
    "operation date",
    "value date",
    "when",
    "תאריך",
    "תאריך עסקה",
    "תאריך ערך",
    "ת. עסקה",
    "ת. ערך",
  ],
  amount: [
    // The synthesized column from parseFileBuffer when a file has split
    // Debit/Credit (or Income/Expense) columns - listed first so the
    // exact-match phase picks it before falling through to alternatives.
    "amount (auto)",
    "amount",
    "amt",
    "value",
    "sum",
    "total",
    "transaction amount",
    "txn amount",
    "net",
    "net amount",
    "סכום",
    "סכום עסקה",
    "סכום בש\"ח",
    "סכום בשח",
    "debit",
    "credit",
    "withdrawal",
    "deposit",
    // Single-column P&L exports often use one of these names.
    "revenue",
    "income",
    "expense",
    "expenses",
    "outcome",
    "in",
    "out",
  ],
  description: [
    "description",
    "narrative",
    "narration",
    "details",
    "particulars",
    "memo",
    "merchant",
    "merchant name",
    "name",
    "transaction details",
    "פירוט",
    "פירוט עסקה",
    "פרטי העסקה",
  ],
  currency: ["currency", "ccy", "מטבע"],
  txnId: ["id", "transaction id", "reference", "ref", "ref no", "txn id"],
  source: ["source", "account", "account number", "חשבון"],
  category: ["category", "type", "קטגוריה", "סוג עסקה"],
  notes: ["notes", "comment", "comments", "הערות"],
  vendor: [
    "vendor",
    "payee",
    "merchant",
    "merchant name",
    "name",
    "ספק",
    "שם בית עסק",
    "שם המוטב",
  ],
};

export function guessMapping(
  headers: string[],
  rows: ParsedRow[] = [],
): Record<string, string | null> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const out: Record<string, string | null> = {};
  for (const [field, hints] of Object.entries(FIELD_HINTS)) {
    let foundIdx = -1;
    for (const h of hints) {
      const idx = lower.findIndex((x) => x === h);
      if (idx !== -1) {
        foundIdx = idx;
        break;
      }
    }
    if (foundIdx === -1) {
      for (const h of hints) {
        const idx = lower.findIndex((x) => x.includes(h));
        if (idx !== -1) {
          foundIdx = idx;
          break;
        }
      }
    }
    out[field] = foundIdx === -1 ? null : headers[foundIdx];
  }

  // Content-based fallback: when header heuristics fail, scan each column's
  // VALUES to find the date/amount/text columns. Works for files with foreign-
  // language headers, no headers, or unusual labels.
  if (rows.length > 0 && (!out.date || !out.amount || !out.description)) {
    const sample = rows.slice(0, Math.min(rows.length, 30));
    const dateScore: Record<string, number> = {};
    const amountScore: Record<string, number> = {};
    const textScore: Record<string, number> = {};
    for (const h of headers) {
      let dateCount = 0;
      let amountCount = 0;
      let textCount = 0;
      for (const row of sample) {
        const v = row[h];
        if (v == null || v === "") continue;
        const isDate = parseDate(v) !== null;
        if (isDate) dateCount++;
        const n = parseAmount(v);
        if (Number.isFinite(n) && n !== 0 && Math.abs(n) >= 0.01) amountCount++;
        const s = String(v ?? "").trim();
        if (
          !isDate &&
          s.length >= 3 &&
          /[A-Za-z֐-׿]/.test(s) // contains letters (English or Hebrew)
        ) {
          textCount++;
        }
      }
      dateScore[h] = dateCount / sample.length;
      amountScore[h] = amountCount / sample.length;
      textScore[h] = textCount / sample.length;
    }
    if (!out.date) {
      const best = headers.reduce(
        (b, h) => (dateScore[h] > (dateScore[b] ?? 0) ? h : b),
        headers[0],
      );
      if (best && dateScore[best] >= 0.5) out.date = best;
    }
    if (!out.amount) {
      // Don't pick the date column as amount even if some dates parsed as numbers
      const best = headers
        .filter((h) => h !== out.date)
        .reduce(
          (b, h) => (amountScore[h] > (amountScore[b] ?? 0) ? h : b),
          headers.filter((h) => h !== out.date)[0] ?? headers[0],
        );
      if (best && amountScore[best] >= 0.5) out.amount = best;
    }
    if (!out.description && !out.vendor) {
      const remaining = headers.filter(
        (h) => h !== out.date && h !== out.amount,
      );
      const best = remaining.reduce(
        (b, h) => (textScore[h] > (textScore[b] ?? 0) ? h : b),
        remaining[0] ?? headers[0],
      );
      if (best && textScore[best] >= 0.3) out.description = best;
    }
  }

  return out;
}

export function parseAmount(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  let s = String(raw).trim();
  if (!s) return 0;
  // Handle "(123.45)" => -123.45
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/^-/.test(s)) { sign = -1; s = s.slice(1); }
  s = s.replace(/[^\d.,-]/g, "");
  // If both . and , exist, assume , is thousands.
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    // Could be European decimal - only convert if exactly one comma with 1-2 trailing digits.
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) s = parts.join(".");
    else s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? sign * n : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly summary parser - multi-sheet workbook
//
// File shape per sheet: header row = category names; data row(s) = amounts.
// Multiple data rows are summed per column so a "totals" row at the bottom or
// sub-line items both work. Each sheet in an XLSX workbook represents one
// month; the sheet name is parsed for a YYYY-MM (e.g. "January 2026", "Jan-26",
// "2026-01"). CSV files are treated as a single virtual sheet.
// ─────────────────────────────────────────────────────────────────────────────

export type MonthlySheetParsed = {
  sheetName: string;
  // Auto-detected YYYY-MM from sheet name; null if not parseable.
  detectedMonth: string | null;
  // category name → summed amount (sign preserved: + = income, − = expense)
  totals: Record<string, number>;
  rowCount: number;
};

export type MonthlyWorkbookParsed = {
  filename: string;
  sheets: MonthlySheetParsed[];
};

const MONTH_ABBR = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

// Try to extract a YYYY-MM from a sheet name. Recognizes common formats:
//   "2026-01" / "2026/01" / "2026.01"            → "2026-01"
//   "01-2026" / "01/2026" / "01.2026"            → "2026-01"
//   "January 2026" / "Jan 2026" / "Jan-26"       → "2026-01"
//   "2026 January" / "2026-Jan"                  → "2026-01"
// Returns null if the sheet name doesn't carry month info.
export function parseSheetNameToYM(name: string): string | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;
  // YYYY-MM (or YYYY/MM, YYYY.MM)
  let m = n.match(/^(\d{4})[\s\-./_]+(\d{1,2})$/);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) {
      return `${m[1]}-${String(month).padStart(2, "0")}`;
    }
  }
  // MM-YYYY (or MM/YYYY, MM.YYYY)
  m = n.match(/^(\d{1,2})[\s\-./_]+(\d{4})$/);
  if (m) {
    const month = Number(m[1]);
    if (month >= 1 && month <= 12) {
      return `${m[2]}-${String(month).padStart(2, "0")}`;
    }
  }
  // MonthName(+Year) - "January 2026", "jan2026", "jan-2026", "jan-26"
  for (let i = 0; i < MONTH_ABBR.length; i++) {
    const mn = MONTH_ABBR[i];
    const re = new RegExp(`^${mn}[a-z]*[\\s\\-./_]*(\\d{2,4})?$`);
    const match = n.match(re);
    if (match) {
      let yy = match[1] ? Number(match[1]) : new Date().getUTCFullYear();
      if (yy < 100) yy = yy < 50 ? 2000 + yy : 1900 + yy;
      return `${yy}-${String(i + 1).padStart(2, "0")}`;
    }
  }
  // Year + MonthName - "2026 January", "2026-jan"
  for (let i = 0; i < MONTH_ABBR.length; i++) {
    const mn = MONTH_ABBR[i];
    const re = new RegExp(`^(\\d{4})[\\s\\-./_]*${mn}[a-z]*$`);
    const match = n.match(re);
    if (match) {
      return `${match[1]}-${String(i + 1).padStart(2, "0")}`;
    }
  }
  return null;
}

// Aggregate one sheet's rows into category totals. Skips columns that look like
// time/label fields ("Month", "Date", "Period", "Year") - those usually carry
// the month label, not numeric data.
function aggregateSheet(
  sheetName: string,
  headers: string[],
  rows: ParsedRow[],
): MonthlySheetParsed {
  const totals: Record<string, number> = {};
  const skipHeader = /^(month|date|period|year)$/i;
  for (const row of rows) {
    for (const h of headers) {
      if (skipHeader.test(h.trim())) continue;
      const v = row[h];
      if (v == null || v === "") continue;
      const amt = parseAmount(v);
      if (!Number.isFinite(amt) || amt === 0) continue;
      const key = h.trim();
      totals[key] = (totals[key] ?? 0) + amt;
    }
  }
  return {
    sheetName,
    detectedMonth: parseSheetNameToYM(sheetName),
    totals,
    rowCount: rows.length,
  };
}

export function parseMonthlyWorkbook(
  filename: string,
  buf: Buffer,
): MonthlyWorkbookParsed {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, raw: false });
  const sheets: MonthlySheetParsed[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
      dateNF: "yyyy-mm-dd",
    });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    const rows = json.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== ""),
    );
    if (headers.length === 0 || rows.length === 0) continue;
    const parsed = aggregateSheet(sheetName, headers, rows);
    if (Object.keys(parsed.totals).length === 0) continue;
    sheets.push(parsed);
  }
  return { filename, sheets };
}

// Heuristic: classify a category name into one of the dashboard kinds.
// Returns "other" if no pattern matches - never throws.
//
// The "income/revenue" pattern set is intentionally generous because miscategorizing
// an income column as expense produces visibly wrong P&L numbers. If you find a
// label that should be income but isn't being matched, add it here OR use the
// "Switch type" toggle on the Data Flow summary to fix it after the fact.
export function kindFromName(name: string): {
  kind: string;
  isOneTime: boolean;
} {
  const n = name.toLowerCase().trim();
  // Revenue / income - English + Hebrew (הכנס/מכירות/מחזור) + common business terms
  if (
    /(revenue|income|sales|invoic|receivable|consult|service\s*fee|earning|receipt|billing|royalt|grant|donation|contribution|fund\s*received|deposit\s*received|gross\s*(income|receipts|sales)|turnover|mrr|arr|recurring\s*revenue|monthly\s*recurring|annual\s*recurring|commission|interest\s*earned|dividend|rebate|cashback|refund\s*received|reimbursement)/i.test(
      n,
    ) ||
    /(הכנס|מכיר|מחזור|תקבול|כנסות|רווח|הכנסה|מענק|קופה\s*נכנסת)/.test(n)
  ) {
    return { kind: "revenue", isOneTime: false };
  }
  if (/(payroll|salary|salaries|wages|compensation|benefit|pension|401k|insurance\s*\(employee\))/i.test(n) ||
      /(שכר|משכורת|עובד|פיצויים|פנסיה)/.test(n)) {
    return { kind: "payroll", isOneTime: false };
  }
  if (/(rent|lease|insurance|subscription|software|saas|utilit|internet|hosting|cloud|domain|membership)/i.test(n) ||
      /(שכירות|ביטוח|תוכנה|מנוי)/.test(n)) {
    return { kind: "fixed", isOneTime: false };
  }
  if (/(market|advertis|\bads?\b|seo|sem|campaign|promotion|sponsor|pr|public\s*relation|content)/i.test(n) ||
      /(שיווק|פרסום)/.test(n)) {
    return { kind: "variable", isOneTime: false };
  }
  if (/(supply|supplies|materials|inventory|cogs|cost\s+of\s+goods|shipping|fulfill|travel|meals|entertainment|office\s*supply)/i.test(n) ||
      /(ציוד|חומרים|מלאי|אירוח|נסיעות)/.test(n)) {
    return { kind: "variable", isOneTime: false };
  }
  if (/(tax|vat|gst|hst|withhold|payroll\s*tax)/i.test(n) || /(מע\s*\"?\s*מ|מס|מיסוי)/.test(n)) {
    return { kind: "tax", isOneTime: false };
  }
  if (/(fee|stripe|paypal|processing|wire|bank\s*charge|transaction\s*fee|gateway)/i.test(n) ||
      /(עמלה|עמלות)/.test(n)) {
    return { kind: "fee", isOneTime: false };
  }
  if (/(transfer|owner\s*draw|capital\s*contribution|inter\s*account|move\s*funds)/i.test(n) ||
      /(העברה|העברות)/.test(n)) {
    return { kind: "transfer", isOneTime: false };
  }
  if (/(bonus|severance|legal\s*settlement|one[-\s]?time|equipment|hardware|laptop|furniture|setup\s*fee|deposit\s*paid)/i.test(n) ||
      /(בונוס|ציוד\s*חד\s*פעמי|רכישה\s*חד\s*פעמית)/.test(n)) {
    return { kind: "other", isOneTime: true };
  }
  return { kind: "other", isOneTime: false };
}

export function parseDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  const s = String(raw).trim();
  if (!s) return null;
  // Try ISO / native first.
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;
  // dd/mm/yyyy or mm/dd/yyyy heuristic.
  const m = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (m) {
    let [_, a, b, y] = m;
    let yy = Number(y);
    if (yy < 100) yy += 2000;
    const aN = Number(a), bN = Number(b);
    // Heuristic: if first > 12, treat as dd/mm. Otherwise default mm/dd.
    let mo: number, da: number;
    if (aN > 12) { da = aN; mo = bN; }
    else if (bN > 12) { mo = aN; da = bN; }
    else { mo = aN; da = bN; } // ambiguous - assume mm/dd (US default)
    const dt = new Date(Date.UTC(yy, mo - 1, da));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}
