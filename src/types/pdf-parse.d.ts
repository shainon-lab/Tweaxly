// Minimal type declaration for pdf-parse (ships no types). We import the
// inner module directly to avoid the package index's debug side-effect.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text:     string;
    numpages: number;
    info:     unknown;
    metadata: unknown;
    version:  string;
  }
  function pdfParse(dataBuffer: Buffer | Uint8Array): Promise<PdfParseResult>;
  export default pdfParse;
}
