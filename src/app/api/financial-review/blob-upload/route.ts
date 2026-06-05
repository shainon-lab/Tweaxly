import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireBusiness } from "@/lib/auth";

// Client-token issuer for direct-to-Blob uploads.
//
// Why this exists: Vercel serverless functions reject any request body
// larger than ~4.5 MB at the platform edge, before our handler runs. A
// scanned multi-page PDF easily exceeds that, so the file is uploaded
// straight from the browser to Vercel Blob (bypassing the function body
// limit) and only the resulting blob reference is sent to the review API.
//
// This route mints a short-lived, constrained upload token. It is gated
// by requireBusiness() so only an authenticated workspace member can
// upload, and the token is locked to the supported file types and the
// 20 MB per-file ceiling.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep in sync with the per-file ceiling in the review route.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/csv",
  "application/octet-stream", // some browsers send this for .xlsx/.csv
];

export async function POST(req: NextRequest) {
  // Only authenticated workspace members may request an upload token.
  try {
    await requireBusiness();
  } catch {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
        // Token is only needed long enough to push one file.
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
      // Processing is driven by the client POST to /api/financial-review
      // once all uploads finish, so nothing to do here. (In local dev this
      // callback is not invoked by Blob; that is expected.)
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload token request failed." },
      { status: 400 },
    );
  }
}
