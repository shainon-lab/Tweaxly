// Workspace-scoped mapping templates for the Bank Statement Import Wizard.
// On second+ uploads in the same workspace the wizard pre-fills the column
// mapping from the most recently used template so users don't re-map for the
// same bank every month.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { business } = await requireBusiness();
  const rows = await prisma.mappingTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, source: true, mapping: true, createdAt: true },
  });
  return NextResponse.json({
    templates: rows.map((r) => ({
      id:        r.id,
      name:      r.name,
      source:    r.source,
      // Stored as JSON-string in the DB; parse here so the wizard gets a plain
      // object and doesn't have to JSON.parse on every render.
      mapping:   safeParse(r.mapping),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

function safeParse(s: string): Record<string, string | null> {
  try { return JSON.parse(s); } catch { return {}; }
}
