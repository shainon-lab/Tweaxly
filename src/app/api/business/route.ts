import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Caps the size of base64 data URLs we'll persist. The browser pre-encodes the
// file to base64 (~33% bigger than the bytes), so 1.4MB of base64 ≈ 1MB raw.
// Plenty for a logo or favicon and prevents accidental DB bloat from a 5MB
// product photo.
const MAX_DATA_URL_LEN = 1_400_000;
// Tolerant MIME match: FileReader sometimes emits extra parameters (e.g.
// `data:image/svg+xml;charset=utf-8;base64,…`), so allow anything between
// the MIME type and the comma that starts the payload.
const ALLOWED_LOGO_MIME = /^data:image\/(png|jpe?g|webp|svg\+xml)(;[^,]*)?,/i;
const ALLOWED_FAVICON_MIME = /^data:image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon)(;[^,]*)?,/i;

function validateDataUrl(value: unknown, kind: "logo" | "favicon"): string | null | "invalid" {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  if (value.length > MAX_DATA_URL_LEN) return "invalid";
  const re = kind === "logo" ? ALLOWED_LOGO_MIME : ALLOWED_FAVICON_MIME;
  if (!re.test(value)) return "invalid";
  return value;
}

// Partial update: only fields actually present in the request body are
// touched. Crucial for branding-only PATCH calls — otherwise the server
// would silently overwrite vatEnabled / fiscalStartMonth back to defaults.
export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();

  const data: Record<string, unknown> = {};
  if ("name" in b && typeof b.name === "string" && b.name.trim().length > 0) {
    data.name = b.name.trim();
  }
  if ("currency" in b && typeof b.currency === "string" && b.currency.trim().length > 0) {
    data.currency = b.currency.toUpperCase().trim();
  }
  if ("fiscalStartMonth" in b && b.fiscalStartMonth != null) {
    const n = Number(b.fiscalStartMonth);
    if (Number.isInteger(n) && n >= 1 && n <= 12) data.fiscalStartMonth = n;
  }
  if ("vatEnabled" in b) data.vatEnabled = !!b.vatEnabled;
  if ("vatRate" in b && b.vatRate != null) data.vatRate = Number(b.vatRate);

  if ("logoData" in b) {
    const v = validateDataUrl(b.logoData, "logo");
    if (v === "invalid") return NextResponse.json({ error: "Invalid logo: must be a PNG/JPEG/WEBP/SVG data URL under 1MB" }, { status: 400 });
    data.logoData = v;
  }
  if ("faviconData" in b) {
    const v = validateDataUrl(b.faviconData, "favicon");
    if (v === "invalid") return NextResponse.json({ error: "Invalid favicon: must be a PNG/SVG/ICO data URL under 1MB" }, { status: 400 });
    data.faviconData = v;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(business);
  }

  try {
    const next = await prisma.business.update({
      where: { id: business.id },
      data,
    });
    return NextResponse.json(next);
  } catch (err) {
    // Surface the underlying error so the client can show something useful
    // instead of an opaque 500. Common cause locally: dev server was started
    // before `prisma db push` and is running with a stale Prisma client that
    // doesn't know about the new branding columns — restart `npm run dev`.
    const msg = err instanceof Error ? err.message : "Database update failed";
    console.error("PATCH /api/business failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
