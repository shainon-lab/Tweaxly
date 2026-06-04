import "server-only";
import * as XLSX from "xlsx";

// Input preparation for the Financial Review module.
//
// PDFs are sent to Claude as native document blocks (base64) - Claude
// reads them with vision, so this works for BOTH text PDFs and scanned
// image PDFs (very common for accountant reports). Spreadsheets (XLSX /
// CSV) have no vision path, so we flatten them to text. We do NOT
// persist raw bytes - only the spreadsheet text is kept on the row.

export type SupportedFileType = "pdf" | "xlsx" | "csv";

export function detectFileType(name: string): SupportedFileType | null {
  if (/\.pdf$/i.test(name)) return "pdf";
  if (/\.xlsx?$/i.test(name)) return "xlsx";
  if (/\.csv$/i.test(name)) return "csv";
  return null;
}

export interface ReviewDocument {
  name:      string;
  mediaType: "application/pdf";
  base64:    string;
}

export interface ReviewInput {
  // PDFs passed to Claude natively (handles scanned/image PDFs).
  documents: ReviewDocument[];
  // Extracted text from spreadsheet uploads (empty for pure-PDF uploads).
  text:      string;
  fileLabel: string;
  fileType:  "pdf" | "xlsx" | "csv" | "mixed";
  fileCount: number;
  // Total raw bytes of attached PDFs - used for the request-size guard.
  pdfBytes:  number;
}

// Turn uploaded buffers into a review input: PDF document blocks +
// flattened spreadsheet text. Throws on unsupported or unreadable files.
export function buildReviewInput(files: { name: string; buf: Buffer }[]): ReviewInput {
  if (files.length === 0) throw new Error("No files provided.");

  const documents: ReviewDocument[] = [];
  const textParts: string[] = [];
  const types = new Set<SupportedFileType>();
  let pdfBytes = 0;

  for (const f of files) {
    const type = detectFileType(f.name);
    if (!type) {
      throw new Error(`Unsupported file type: ${f.name}. Upload a PDF, XLSX or CSV.`);
    }
    types.add(type);

    if (type === "pdf") {
      documents.push({ name: f.name, mediaType: "application/pdf", base64: f.buf.toString("base64") });
      pdfBytes += f.buf.length;
      continue;
    }

    // XLSX / CSV -> flatten every sheet to CSV text.
    const wb = XLSX.read(f.buf, { type: "buffer", cellDates: true, raw: false });
    const parts: string[] = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv.trim()) parts.push(`# Sheet: ${sheetName}\n${csv}`);
    }
    const t = parts.join("\n\n").trim();
    if (!t) throw new Error(`Could not read any data from ${f.name}.`);
    textParts.push(`===== FILE: ${f.name} =====\n${t}`);
  }

  const fileType = types.size === 1 ? [...types][0] : "mixed";
  const fileLabel =
    files.length === 1 ? files[0].name : `${files[0].name} + ${files.length - 1} more`;

  return {
    documents,
    text: textParts.join("\n\n"),
    fileLabel,
    fileType,
    fileCount: files.length,
    pdfBytes,
  };
}
