import "server-only";
import * as XLSX from "xlsx";

// File-text extraction for the Financial Review module. We turn an
// uploaded report (PDF / XLSX / CSV) into plain text that Claude can
// read. We do NOT persist the raw bytes - only the extracted text is
// stored on the review row.

export type SupportedFileType = "pdf" | "xlsx" | "csv";

export function detectFileType(name: string): SupportedFileType | null {
  if (/\.pdf$/i.test(name)) return "pdf";
  if (/\.xlsx?$/i.test(name)) return "xlsx";
  if (/\.csv$/i.test(name)) return "csv";
  return null;
}

export interface ExtractedFile {
  fileName: string;
  fileType: SupportedFileType;
  text:     string;
}

// Extract text from a single uploaded buffer. Throws on unsupported
// types or unreadable files.
export async function extractTextFromFile(fileName: string, buf: Buffer): Promise<ExtractedFile> {
  const type = detectFileType(fileName);
  if (!type) {
    throw new Error(`Unsupported file type: ${fileName}. Upload a PDF, XLSX or CSV.`);
  }

  if (type === "pdf") {
    // Import the library's inner module directly - the package's
    // index.js runs a debug block that reads a bundled test PDF, which
    // breaks under the Next.js server bundler. The inner module is the
    // actual parser with no side effects.
    const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
      default: (b: Buffer) => Promise<{ text: string }>;
    };
    const pdf = mod.default;
    const data = await pdf(buf);
    const text = (data.text ?? "").trim();
    if (!text) throw new Error(`Could not read any text from ${fileName}. It may be a scanned image PDF.`);
    return { fileName, fileType: "pdf", text };
  }

  // XLSX + CSV both go through SheetJS (already a project dep). Every
  // sheet is flattened to CSV text with its name as a header so the
  // model can see multi-tab workbooks (e.g. P&L + Balance Sheet).
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, raw: false });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) parts.push(`# Sheet: ${sheetName}\n${csv}`);
  }
  const text = parts.join("\n\n").trim();
  if (!text) throw new Error(`Could not read any data from ${fileName}.`);
  return { fileName, fileType: type, text };
}

// Combine multiple uploaded files into one labelled text document plus a
// summary of what was uploaded (used as the review's headline label).
export interface CombinedExtraction {
  text:      string;
  fileLabel: string;
  fileType:  "pdf" | "xlsx" | "csv" | "mixed";
  fileCount: number;
}

export async function extractAndCombine(
  files: { name: string; buf: Buffer }[],
): Promise<CombinedExtraction> {
  if (files.length === 0) throw new Error("No files provided.");
  const extracted: ExtractedFile[] = [];
  for (const f of files) {
    extracted.push(await extractTextFromFile(f.name, f.buf));
  }

  const text = extracted
    .map((e) => `===== FILE: ${e.fileName} =====\n${e.text}`)
    .join("\n\n");

  const types = new Set(extracted.map((e) => e.fileType));
  const fileType = types.size === 1 ? [...types][0] : "mixed";
  const fileLabel =
    extracted.length === 1
      ? extracted[0].fileName
      : `${extracted[0].fileName} + ${extracted.length - 1} more`;

  return { text, fileLabel, fileType, fileCount: extracted.length };
}
