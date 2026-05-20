// POST   /api/admin/accounts/[id]/notes      - create note
// DELETE /api/admin/accounts/[id]/notes?noteId=... - delete note
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  let body: { body?: string; tags?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "missing_body" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const note = await prisma.adminNote.create({
    data: {
      targetBusinessId: params.id,
      authorUserId: auth.user.id,
      body: text,
      tags: body.tags ? body.tags.trim() : null,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "account.note_added",
    targetBusinessId: params.id,
    metadata: { noteId: note.id, tags: note.tags ?? null, length: text.length },
    request: req,
  });

  return NextResponse.json({ ok: true, id: note.id });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrSuperApi();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "missing_noteId" }, { status: 400 });

  const note = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!note || note.targetBusinessId !== params.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.adminNote.delete({ where: { id: noteId } });
  await recordAudit({
    actorUserId: auth.user.id,
    action: "account.note_deleted",
    targetBusinessId: params.id,
    metadata: { noteId },
    request: req,
  });
  return NextResponse.json({ ok: true });
}
