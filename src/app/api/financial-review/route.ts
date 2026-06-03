import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectFileType, extractAndCombine } from "@/lib/financialReview/extract";
import { generateFinancialReview } from "@/lib/financialReview/generate";

// File parsing + a 30-90s Claude call need the Node runtime.
export const runtime = "nodejs";
// Never cache; every upload is a fresh review.
export const dynamic = "force-dynamic";

const MAX_FILES = 8;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file

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
      status: true, score: true, statusLevel: true, createdAt: true,
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const entries = form.getAll("files").filter((f): f is File => f instanceof File);
  if (entries.length === 0) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
  }
  if (entries.length > MAX_FILES) {
    return NextResponse.json({ error: `Please upload at most ${MAX_FILES} files.` }, { status: 400 });
  }

  // Validate types + sizes, then read into buffers.
  const files: { name: string; buf: Buffer }[] = [];
  for (const f of entries) {
    if (!detectFileType(f.name)) {
      return NextResponse.json(
        { error: `Unsupported file "${f.name}". Upload PDF, XLSX or CSV.` },
        { status: 400 },
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${f.name}" is too large (max 15 MB).` },
        { status: 400 },
      );
    }
    files.push({ name: f.name, buf: Buffer.from(await f.arrayBuffer()) });
  }

  // Extract text. A parse failure here means we never create a row.
  let combined;
  try {
    combined = await extractAndCombine(files);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not read the uploaded files." },
      { status: 400 },
    );
  }

  // Create the review row up-front so even a generation failure leaves a
  // visible, retrievable record (status "failed") scoped to the workspace.
  const review = await prisma.financialReview.create({
    data: {
      businessId:      business.id,
      createdByUserId: user.id,
      fileName:        combined.fileLabel,
      fileType:        combined.fileType,
      fileCount:       combined.fileCount,
      extractedText:   combined.text,
      status:          "processing",
    },
    select: { id: true },
  });

  try {
    const generated = await generateFinancialReview({
      businessId:    business.id,
      apiKey,
      currency:      business.currency,
      fileLabel:     combined.fileLabel,
      extractedText: combined.text,
    });
    await prisma.financialReview.update({
      where: { id: review.id },
      data: {
        status:      "complete",
        reportType:  generated.reportType,
        score:       generated.score,
        statusLevel: generated.statusLevel,
        result:      generated.result,
      },
    });
    return NextResponse.json({ id: review.id, status: "complete" }, { status: 201 });
  } catch (e) {
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
