// XLSX export via SheetJS (already in package.json as the CDN
// licensed-build).
//
// The workbook structure mirrors what's on screen:
//   • Header rows: title, business, period, base currency, export date
//   • Blank separator
//   • Column header row (bold, frozen)
//   • Section rows; each section optionally preceded by a bold title
//   • Section "total" rows render bold
//   • Optional footnote at the bottom
//
// Currency / percent / date columns get matching Excel format codes
// so opening in Excel produces native-looking cells (not text).

import type { ExportPayload, ExportColumn, ExportSection, CellValue } from "./types";

// SheetJS types are loose; we import everything to keep the import
// surface small.
type Sheet = Record<string, unknown>;
type Workbook = { SheetNames: string[]; Sheets: Record<string, Sheet> };

// Maps our column kind to an Excel format code. Currency uses
// {symbol}#,##0.00 with a thousands separator. Percent multiplies the
// stored number by 100 in the display - we keep the underlying value
// as the decimal fraction (e.g. 0.215) for portability.
function formatForKind(kind: ExportColumn["kind"], currency: string): string | undefined {
  switch (kind) {
    case "currency":
      return `${currencySymbol(currency)}#,##0.00;[Red]-${currencySymbol(currency)}#,##0.00`;
    case "number":
      return "#,##0.00";
    case "percent":
      return "0.00%";
    case "date":
      return "yyyy-mm-dd";
    case "month":
      return "yyyy-mm";
    default:
      return undefined;
  }
}

function currencySymbol(code: string): string {
  switch (code.toUpperCase()) {
    case "USD": return "$";
    case "EUR": return "€";
    case "GBP": return "£";
    case "JPY": return "¥";
    case "ILS": return "₪";
    case "CNY": return "¥";
    case "INR": return "₹";
    case "BRL": return "R$";
    case "MXN": return "$";
    default:    return code + " ";
  }
}

export async function buildXlsxBlob(payload: ExportPayload): Promise<Blob> {
  // SheetJS is a CommonJS package - dynamic import keeps the
  // ~700KB lib out of the initial bundle and ensures it only
  // loads when the user actually clicks Download.
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new() as Workbook;

  // We build an array-of-arrays (AOA) describing every row,
  // including the prelude header lines. This gives full control
  // over what's bold / merged / formatted.
  const aoa: CellValue[][] = [];
  const boldRowIndexes = new Set<number>();
  const sectionTitleIndexes = new Set<number>();
  const formatRow: (string | undefined)[][] = []; // parallel array - format per (row, col)

  // Helper: add an arbitrary header row spanning the full width.
  function addHeaderRow(text: string, opts: { bold?: boolean } = {}) {
    const row: CellValue[] = [text, ...Array(payload.columns.length - 1).fill(null)];
    aoa.push(row);
    formatRow.push(payload.columns.map(() => undefined));
    if (opts.bold) boldRowIndexes.add(aoa.length - 1);
  }

  // Prelude.
  addHeaderRow(payload.title, { bold: true });
  if (payload.subtitle)     addHeaderRow(payload.subtitle);
  if (payload.businessName) addHeaderRow(`Business: ${payload.businessName}`);
  addHeaderRow(`Base currency: ${payload.baseCurrency}`);
  addHeaderRow(`Exported: ${new Date().toISOString().slice(0, 10)}`);
  if (payload.filters) {
    for (const [k, v] of Object.entries(payload.filters)) {
      addHeaderRow(`${k}: ${v}`);
    }
  }
  // Blank separator.
  aoa.push(payload.columns.map(() => null));
  formatRow.push(payload.columns.map(() => undefined));

  // Column header row.
  const headerRowIdx = aoa.length;
  aoa.push(payload.columns.map((c) => c.label));
  formatRow.push(payload.columns.map(() => undefined));
  boldRowIndexes.add(headerRowIdx);

  // Sections.
  for (const section of payload.sections) {
    if (section.title) {
      const titleRow: CellValue[] = [section.title, ...Array(payload.columns.length - 1).fill(null)];
      aoa.push(titleRow);
      formatRow.push(payload.columns.map(() => undefined));
      boldRowIndexes.add(aoa.length - 1);
      sectionTitleIndexes.add(aoa.length - 1);
    }
    for (const row of section.rows) {
      const dataRow = payload.columns.map((c) => row[c.key] ?? null);
      aoa.push(dataRow);
      formatRow.push(payload.columns.map((c) => formatForKind(c.kind, payload.baseCurrency)));
      if (section.bold) boldRowIndexes.add(aoa.length - 1);
    }
  }

  if (payload.footnote) {
    aoa.push(payload.columns.map(() => null));
    formatRow.push(payload.columns.map(() => undefined));
    addHeaderRow(payload.footnote);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa) as Sheet & { [k: string]: unknown };

  // Column widths. The user gives approximate "character" widths;
  // SheetJS expects { wch: n }.
  const colsMeta = payload.columns.map((c) => ({ wch: c.width ?? Math.max(c.label.length + 2, 14) }));
  (ws as { "!cols"?: { wch: number }[] })["!cols"] = colsMeta;

  // Freeze the header row + the first column ("Line" / category name)
  // so the user can scroll a wide report without losing context.
  (ws as { "!freeze"?: { xSplit: number; ySplit: number } })["!freeze"] = {
    xSplit: 1,
    ySplit: headerRowIdx + 1,
  };
  // SheetJS uses a different freeze syntax via the "views" property.
  (ws as { "!views"?: unknown[] })["!views"] = [
    { state: "frozen", xSplit: 1, ySplit: headerRowIdx + 1, topLeftCell: "B" + (headerRowIdx + 2) },
  ];

  // Apply per-cell formatting and bold.
  type CellMeta = { v?: CellValue; t?: string; s?: Record<string, unknown>; z?: string };
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < payload.columns.length; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = (ws as Record<string, CellMeta>)[addr];
      if (!cell) continue;
      const fmt = formatRow[r]?.[c];
      if (fmt) cell.z = fmt;
      if (boldRowIndexes.has(r)) {
        cell.s = { ...(cell.s ?? {}), font: { ...(cell.s as { font?: Record<string, unknown> } | undefined)?.font, bold: true } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws as unknown as object, "Report");

  // SheetJS's XLSX writer emits an ArrayBuffer in browser environments.
  const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
