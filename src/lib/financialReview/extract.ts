import "server-only";
import * as XLSX from "xlsx";

// Input preparation for the Financial Review module.
//
// Strategy (text-first, vision-fallback):
//   • PDF with a real text layer  -> extract text with pdf-parse (cheap,
//     fast - the "original" method) and send it as text.
//   • Scanned / image PDF (no text layer) -> send the file to Claude as a
//     native document block; Claude reads it with vision. Slower + less
//     precise, so we flag it and surface a recommendation to the user.
//   • XLSX / CSV -> flatten every sheet to text.
//
// Raw bytes are never persisted - only the extracted text is kept.

export type SupportedFileType = "pdf" | "xlsx" | "csv";

// Below this many non-whitespace characters we treat a PDF's text layer
// as empty (i.e. a scan) and fall back to vision.
const MIN_PDF_TEXT_CHARS = 100;

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
  // Scanned PDFs passed to Claude natively (vision path).
  documents: ReviewDocument[];
  // Text from text-layer PDFs + spreadsheets (original method).
  text:      string;
  fileLabel: string;
  fileType:  "pdf" | "xlsx" | "csv" | "mixed";
  fileCount: number;
  // Total raw bytes of the scanned PDFs sent to Claude (size guard).
  pdfBytes:  number;
  // True when at least one file had to use the vision fallback.
  scanned:     boolean;
  scannedNames: string[];
}

// Read a PDF's embedded text layer. Returns "" for scanned/image PDFs
// (or if the parser fails), which triggers the vision fallback.
async function readPdfTextLayer(buf: Buffer): Promise<string> {
  try {
    // Import the inner module directly - the package index runs a debug
    // block that reads a bundled test PDF and breaks under the bundler.
    const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
      default: (b: Buffer) => Promise<{ text: string }>;
    };
    const data = await mod.default(buf);
    return (data.text ?? "").trim();
  } catch {
    return "";
  }
}

// Turn uploaded buffers into a review input. Async because text-layer
// extraction is async. Throws on unsupported or unreadable spreadsheets.
export async function buildReviewInput(files: { name: string; buf: Buffer }[]): Promise<ReviewInput> {
  if (files.length === 0) throw new Error("No files provided.");

  const documents: ReviewDocument[] = [];
  const textParts: string[] = [];
  const scannedNames: string[] = [];
  const types = new Set<SupportedFileType>();
  let pdfBytes = 0;

  for (const f of files) {
    const type = detectFileType(f.name);
    if (!type) {
      throw new Error(`Unsupported file type: ${f.name}. Upload a PDF, XLSX or CSV.`);
    }
    types.add(type);

    if (type === "pdf") {
      const textLayer = await readPdfTextLayer(f.buf);
      const meaningful = textLayer.replace(/\s/g, "").length >= MIN_PDF_TEXT_CHARS;
      if (meaningful) {
        // Original method: use the embedded text.
        textParts.push(`===== FILE: ${f.name} =====\n${textLayer}`);
      } else {
        // Scanned: fall back to Claude vision.
        documents.push({ name: f.name, mediaType: "application/pdf", base64: f.buf.toString("base64") });
        pdfBytes += f.buf.length;
        scannedNames.push(f.name);
      }
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
    scanned: scannedNames.length > 0,
    scannedNames,
  };
}
