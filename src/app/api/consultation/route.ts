import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, answerQuestion, deriveTitle } from "@/lib/advisor";

export const runtime = "nodejs";

// GET — list consultations for current business, with last message preview
export async function GET() {
  const { business } = await requireBusiness();
  const list = await prisma.consultation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ consultations: list });
}

// POST — send a message. If no consultationId, creates a new thread.
// Body: { consultationId?: string, message: string }
export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json();
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  let consultationId = body.consultationId as string | undefined;
  if (consultationId) {
    const owned = await prisma.consultation.findFirst({
      where: { id: consultationId, businessId: business.id },
    });
    if (!owned) consultationId = undefined;
  }
  if (!consultationId) {
    const created = await prisma.consultation.create({
      data: { businessId: business.id, title: deriveTitle(message) },
    });
    consultationId = created.id;
  }

  // Pull the conversation history BEFORE inserting the new user message —
  // we'll pass that as the prior turns and add the new message as the
  // current user turn inside answerQuestion.
  const priorMessages = await prisma.consultationMessage.findMany({
    where: { consultationId },
    orderBy: { createdAt: "asc" },
    take: 40, // keep the last ~20 user/assistant pairs for context
  });

  await prisma.consultationMessage.create({
    data: { consultationId, role: "user", content: message },
  });

  const ctx = await buildBusinessContext(business.id);
  const { answer, mode } = await answerQuestion(
    ctx,
    message,
    priorMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  );

  await prisma.consultationMessage.create({
    data: {
      consultationId,
      role: "assistant",
      content: answer.content,
      payload: answer.payload ? JSON.stringify(answer.payload) : null,
    },
  });
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { updatedAt: new Date() },
  });

  const fresh = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ consultation: fresh, mode });
}

// DELETE — remove a thread
export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.consultation.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
