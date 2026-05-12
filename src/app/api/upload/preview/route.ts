import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { parseFileBuffer, guessMapping } from "@/lib/parsers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await requireBusiness();
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseFileBuffer(file.name, buf);
  if (parsed.headers.length === 0) {
    return NextResponse.json({ error: "Could not read any headers from this file." }, { status: 400 });
  }
  const guess = guessMapping(parsed.headers, parsed.rows);
  // Cap preview rows to 1000 to keep payload sane.
  return NextResponse.json({
    headers: parsed.headers,
    rows: parsed.rows.slice(0, 1000),
    filename: file.name,
    guess,
  });
}
