import { NextRequest, NextResponse } from "next/server";
import { get, del } from "@vercel/blob";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectFileType, buildReviewInput } from "@/lib/financialReview/extract";
import { generateFinancialReview } from "@/lib/financialReview/generate";
import {
  consumeCredits, grantCredits, costFor, getEffectivePlan, ensureMonthlyAllowance,
} from "@/lib/billing";

const REVIEW_COST = costFor("financialReview");

// File parsing + a 30-90s Claude call need the Node runtime.
export const runtime = "nodejs";
// Never cache; every upload is a fresh review.
export const dynamic = "force-dynamic";

const MAX_FILES = 8;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file (matches the upload token)

// A blob reference posted by the client after a direct-to-Blob upload.
interface BlobRef {
  url:      string;
  pathname: string;
  name:     string; // original filename (the stored pathname has a random suffix)
}

// Read a Vercel Blob's bytes into a Buffer. The store is private, so we
// fetch with access "private" (the BLOB_READ_WRITE_TOKEN env var is used
// automatically for authentication).
async function downloadBlob(url: string): Promise<Buffer> {
  const res = await get(url, { access: "private" });
  if (!res || res.statusCode !== 200) {
    throw new Error("Could not read the uploaded file from storage.");
  }
  const reader = res.stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function claudeConfigured(): string | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ok =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);
  return ok ? apiKey! : null;
}

// GET /api/financial-review - list this workspace's reviews (newest first).
export async function GET() {
  const { business } = await requireBusiness();
  const reviews = await prisma.financialReview.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fileName: true, fileType: true, reportType: true,
      financialYear: true, status: true, score: true, statusLevel: true, createdAt: true,
    },
  });
  return NextResponse.json({ reviews });
}

// POST /api/financial-review - upload one or more report files, extract
// their text, generate the AI review, and persist it. Returns the new
// review id. Processing is synchronous (fine for the expected 30-90s).
export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();

  const apiKey = claudeConfigured();
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI review engine is not configured (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  // The client uploads each file straight to Vercel Blob (bypassing the
  // 4.5 MB serverless body limit) and then POSTs the blob references here
  // as JSON, together with optional metadata.
  let payload: {
    blobs?: BlobRef[];
    financialYear?: string;
    notes?: string;
    reportCountry?: string;
    reportCurrency?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const blobs = Array.isArray(payload.blobs) ? payload.blobs : [];
  if (blobs.length === 0) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
  }
  if (blobs.length > MAX_FILES) {
    return NextResponse.json({ error: `Please upload at most ${MAX_FILES} files.` }, { status: 400 });
  }

  // Optional upload metadata: financial year (override of auto-detect)
  // and free-text notes.
  const yearRaw  = payload.financialYear;
  const notesRaw = payload.notes;
  const yearHint =
    typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw.trim())
      ? parseInt(yearRaw.trim(), 10)
      : null;
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null;

  // Reporting country + currency: context only, never used to
  // recalculate. Accept short codes; ignore anything implausible.
  const codeOf = (v: unknown): string | null =>
    typeof v === "string" && /^[A-Za-z]{2,8}$/.test(v.trim()) ? v.trim().toUpperCase() : null;
  const reportCountry  = codeOf(payload.reportCountry);
  const reportCurrency = codeOf(payload.reportCurrency);

  // The transient blobs must be cleaned up on every exit path (raw bytes
  // are never persisted), so route all early failures through this helper.
  const uploadedUrls = blobs.map((b) => b.url).filter((u): u is string => typeof u === "string");
  const cleanup = () => del(uploadedUrls).catch(() => {});
  const fail = async (message: string, status: number) => {
    await cleanup();
    return NextResponse.json({ error: message }, { status });
  };

  // Validate references up-front (cheap, no download), then pull bytes.
  for (const b of blobs) {
    const name = typeof b?.name === "string" && b.name.trim() ? b.name : b?.pathname;
    if (!name || typeof b?.url !== "string") return fail("Malformed upload reference.", 400);
    if (!detectFileType(name)) {
      return fail(`Unsupported file "${name}". Upload PDF, XLSX or CSV.`, 400);
    }
  }

  // Download each blob into a buffer.
  const files: { name: string; buf: Buffer }[] = [];
  try {
    for (const b of blobs) {
      const name = typeof b.name === "string" && b.name.trim() ? b.name : b.pathname;
      const buf = await downloadBlob(b.url);
      if (buf.length > MAX_BYTES) return fail(`"${name}" is too large (max 20 MB).`, 400);
      files.push({ name, buf });
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not read the uploaded files.", 400);
  }

  // Build the review input: PDFs become native document blocks (Claude
  // reads scanned/image PDFs with vision), spreadsheets become text. A
  // failure here means we never create a row. The blobs are no longer
  // needed once the bytes are in memory.
  let input;
  try {
    input = await buildReviewInput(files);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not read the uploaded files.", 400);
  }
  // Bytes are in memory now; remove the transient blobs immediately.
  await cleanup();

  // Keep the request to Claude under the API's PDF limit (~32 MB incl.
  // base64 overhead). Cap total raw PDF bytes well below that.
  const MAX_TOTAL_PDF = 20 * 1024 * 1024;
  if (input.pdfBytes > MAX_TOTAL_PDF) {
    return NextResponse.json(
      { error: "The uploaded PDFs are too large in total. Upload fewer or smaller files (under 20 MB combined)." },
      { status: 400 },
    );
  }

  // Charge AI credits before generating - this is a user-initiated AI
  // generation. Bootstrap the wallet first (free starter grant / monthly
  // allowance), then atomically debit. Refunded below if generation
  // fails, so the owner only pays for a review they actually receive.
  await ensureMonthlyAllowance(business.id).catch(() => {});
  const charge = await consumeCredits(business.id, REVIEW_COST, "financial_review", {
    fileName: input.fileLabel,
  });
  if (!charge.ok) {
    const eff = await getEffectivePlan(business.id).catch(() => null);
    return NextResponse.json(
      {
        error:    "insufficient_credits",
        cost:     REVIEW_COST,
        balance:  charge.balance,
        fallback: eff?.plan === "pro" ? "buy_credits" : "upgrade",
      },
      { status: 402 },
    );
  }

  // Create the review row up-front so even a generation failure leaves a
  // visible, retrievable record (status "failed") scoped to the workspace.
  const review = await prisma.financialReview.create({
    data: {
      businessId:      business.id,
      createdByUserId: user.id,
      fileName:        input.fileLabel,
      fileType:        input.fileType,
      fileCount:       input.fileCount,
      scanned:         input.scanned,
      financialYear:   yearHint,
      reportCountry,
      reportCurrency,
      notes,
      extractedText:   input.text || null,
      status:          "processing",
    },
    select: { id: true },
  });

  try {
    const generated = await generateFinancialReview({
      businessId:   business.id,
      apiKey,
      currency:     business.currency,
      fileLabel:    input.fileLabel,
      documents:    input.documents,
      text:         input.text,
      yearHint,
      countryHint:  reportCountry,
      currencyHint: reportCurrency,
    });
    await prisma.financialReview.update({
      where: { id: review.id },
      data: {
        status:        "complete",
        reportType:    generated.reportType,
        score:         generated.score,
        statusLevel:   generated.statusLevel,
        financialYear: yearHint ?? generated.result.detectedYear ?? null,
        financials:    generated.result.financials,
        result:        generated.result,
      },
    });
    return NextResponse.json(
      { id: review.id, status: "complete", creditsUsed: REVIEW_COST, balance: charge.balance },
      { status: 201 },
    );
  } catch (e) {
    // Generation failed - refund the credits we debited up-front so the
    // owner is never charged for a review they did not receive.
    await grantCredits(business.id, REVIEW_COST, "adjustment", {
      reason: "Refund: financial review generation failed",
      meta:   { reviewId: review.id },
    }).catch(() => {});
    await prisma.financialReview.update({
      where: { id: review.id },
      data: {
        status:       "failed",
        errorMessage: e instanceof Error ? e.message : "The review could not be generated.",
      },
    });
    return NextResponse.json(
      { id: review.id, status: "failed", error: "The review could not be generated. Please try again." },
      { status: 502 },
    );
  }
}
