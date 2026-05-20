// Shared types for the report-export pipeline.
//
// Every report page builds an `ExportPayload` from the same in-memory
// data that drives the on-screen render, then hands it to the
// DownloadButton. CSV / XLSX generation is client-side from this
// payload so the export and the screen never disagree.

export type ColumnKind =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "month";

export interface ExportColumn {
  key: string;        // matches the row object key
  label: string;      // header text
  kind: ColumnKind;
  width?: number;     // approximate character width - XLSX uses it
}

export type CellValue = string | number | null;

export interface ExportSection {
  // Optional section header rendered as a bold, merged row in XLSX
  // and as a blank-line + label in CSV. Use for "Total revenue",
  // "Total outcome", "P&L" subtotal blocks.
  title?: string;
  rows: Record<string, CellValue>[];
  // When true, this section's rows render BOLD in XLSX (totals row).
  bold?: boolean;
}

export interface ExportPayload {
  // Filename prefix - gets "_YYYY-MM-DD.<ext>" appended automatically.
  filename:  string;

  // Header block printed at the top of every export.
  title:     string;
  subtitle?: string;            // e.g. "Q2 2026" or "All time"
  filters?:  Record<string, string>; // any other current state
  baseCurrency: string;
  businessName?: string;

  columns: ExportColumn[];
  sections: ExportSection[];

  // Optional note printed at the bottom (e.g. multi-currency
  // conversion disclosure).
  footnote?: string;
}
