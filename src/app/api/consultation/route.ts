import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireBusiness } from "@/lib/auth";
import { requireEmailVerified } from "@/lib/auth/verificationGate";
import { prisma } from "@/lib/db";
import { buildBusinessContext, answerQuestion, deriveTitle } from "@/lib/advisor";
import {
  consumeCredits, ensureMonthlyAllowance, getEffectivePlan,
  grantCredits, CREDIT_COSTS,
} from "@/lib/billing";

export const runtime = "nodejs";

// GET - list consultations for current business, with last message preview
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

// POST - send a message. If no consultationId, creates a new thread.
// Body: { consultationId?: string, message: string }
export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();
  // Email verification gate. AI surfaces are blocked for unverified
  // users regardless of grace period - we don't want to spend Claude
  // credits answering on behalf of an unconfirmed identity.
  const gate = await requireEmailVerified(user, "consultation");
  if (!gate.ok) {
    return NextResponse.json({
      error:   "email_unverified",
      reason:  gate.reason,
      message: "Please verify your email to use AI consultations.",
    }, { status: 403 });
  }
  const body = await req.json();
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Bootstrap or refresh the monthly AI Credit allowance for this
  // business, then attempt to consume one credit BEFORE we spend
  // money on the LLM call. consumeCredits is atomic, so two
  // simultaneous requests can't double-spend the last credit.
  const eff = await getEffectivePlan(business.id);
  if (eff.readOnly) {
    return NextResponse.json({
      error:        "read_only",
      message:      "This workspace is in read-only mode. Reactivate the subscription to use AI consultation.",
      plan:         eff.plan,
    }, { status: 402 });
  }
  await ensureMonthlyAllowance(business.id);
  const cost = CREDIT_COSTS.consultationMessage;
  const spent = await consumeCredits(business.id, cost, "AI consultation", { source: "consultation_api" });
  if (!spent.ok) {
    const message = eff.plan === "free"
      ? "You've used all your starter AI Credits. Upgrade to Pro to continue using AI-powered consultations, forecasting and advanced intelligence."
      : "You've run out of AI Credits this month. Buy more credits anytime - they're added instantly.";
    return NextResponse.json({
      error:    "insufficient_credits",
      message,
      balance:  spent.balance,
      needed:   cost,
      plan:     eff.plan,
    }, { status: 402 });
  }

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

  // Pull the conversation history BEFORE inserting the new user message -
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

  // Wrap the LLM call so we can refund credits if the model errors -
  // we already deducted optimistically above to avoid double-spend
  // under concurrency.
  let answer, mode;
  try {
    const ctx = await buildBusinessContext(business.id);
    const result = await answerQuestion(
      ctx,
      message,
      priorMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      business.id,
    );
    answer = result.answer;
    mode   = result.mode;
  } catch (err) {
    // Refund the credit we deducted - the user got nothing in return.
    await grantCredits(business.id, cost, "adjustment", {
      reason: "Refund: AI consultation failed",
      meta:   { consultationId, source: "consultation_api_refund" },
    }).catch(() => { /* best-effort refund; never block error response */ });
    throw err;
  }

  await prisma.consultationMessage.create({
    data: {
      consultationId,
      role:       "assistant",
      content:    answer.content,
      payload:    answer.payload ? JSON.stringify(answer.payload) : null,
      // Persist the structured payload so refreshes + history loads
      // get the rich card layout, not just the markdown fallback.
      // Prisma's Json column wants InputJsonValue - structured is a
      // plain object so the cast is safe.
      structured: answer.structured
        ? (answer.structured as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
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
  return NextResponse.json({
    consultation: fresh,
    mode,
    credits: { balance: spent.balance, spent: cost, plan: eff.plan },
  });
}

// DELETE - remove a thread
export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.consultation.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
