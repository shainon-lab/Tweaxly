// CSV export - lightweight, raw data only, UTF-8 with BOM so Excel
// opens it without prompting for encoding.

import type { ExportPayload, CellValue } from "./types";

function escapeCell(value: CellValue): string {
  if (value == null) return "";
  const s = String(value);
  // RFC 4180: quote if the cell contains a comma, quote, or newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatCell(value: CellValue, kind: string): string {
  if (value == null) return "";
  if (kind === "currency" || kind === "number") {
    if (typeof value === "number") return value.toFixed(2);
    return String(value);
  }
  if (kind === "percent") {
    if (typeof value === "number") return (value * 100).toFixed(2);
    return String(value);
  }
  if (kind === "date") {
    if (typeof value === "string") return value.slice(0, 10);
    return String(value);
  }
  return String(value);
}

export function buildCsv(payload: ExportPayload): string {
  const lines: string[] = [];

  // Header block - lightweight prelude lines starting with #.
  lines.push(`# ${payload.title}`);
  if (payload.subtitle) lines.push(`# ${payload.subtitle}`);
  if (payload.businessName) lines.push(`# Business: ${payload.businessName}`);
  lines.push(`# Base currency: ${payload.baseCurrency}`);
  lines.push(`# Exported: ${new Date().toISOString().slice(0, 10)}`);
  if (payload.filters) {
    for (const [k, v] of Object.entries(payload.filters)) {
      lines.push(`# ${k}: ${v}`);
    }
  }
  lines.push("");

  // Column header row.
  lines.push(payload.columns.map((c) => escapeCell(c.label)).join(","));

  // Each section: optional title row + rows.
  for (const section of payload.sections) {
    if (section.title) {
      lines.push(""); // blank separator
      lines.push(escapeCell(`-- ${section.title} --`));
    }
    for (const row of section.rows) {
      lines.push(
        payload.columns
          .map((c) => escapeCell(formatCell(row[c.key] ?? null, c.kind)))
          .join(","),
      );
    }
  }

  if (payload.footnote) {
    lines.push("");
    lines.push(`# ${payload.footnote}`);
  }

  return lines.join("\n");
}

// BOM + content as a Blob ready for download.
export function csvBlob(payload: ExportPayload): Blob {
  const text = "﻿" + buildCsv(payload); // BOM hint for Excel
  return new Blob([text], { type: "text/csv;charset=utf-8" });
}
