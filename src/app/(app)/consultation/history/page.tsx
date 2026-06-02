// Consultation History - split-screen: list of past consultation
// THREADS on the left, the selected thread's full conversation on the
// right. Selection is driven by ?id= (consultation id). An ongoing
// chat with multiple questions is one entry: it shows the first
// question, the question count, and started/last-answer timestamps.

import PageHeader from "@/components/PageHeader";
import AdvisoryHelp from "@/components/AdvisoryHelp";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasFeature, getEffectivePlan } from "@/lib/billing";
import ConsultationTabs from "../ConsultationTabs";
import HistoryClient, { type HistoryListItem, type HistoryDetail } from "./HistoryClient";

export default async function ConsultationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const [canShareAnalyses, effectivePlan] = await Promise.all([
    hasFeature(business.id, "shareAnalyses"),
    getEffectivePlan(business.id),
  ]);

  const allMessages = await prisma.consultationMessage.findMany({
    where: { consultation: { businessId: business.id } },
    orderBy: [{ consultationId: "asc" }, { createdAt: "asc" }],
  });

  type DetailMsg = {
    id: string;
    role: "user" | "assistant";
    content: string;
    payload: string | null;
    // The Phase-1 structured advisor payload, when the assistant turn
    // produced one - so re-opened sessions render through
    // StructuredAdvisoryView, the same component the New Advisory view
    // uses, instead of the markdown-only briefing.
    structured: import("@/lib/advisorTypes").StructuredAdvice | null;
    createdAt: string;
  };

  // Group every message into its consultation thread. allMessages is
  // already ordered by (consultationId, createdAt) so per-thread order
  // is preserved. Each thread is ONE history entry.
  const byThread = new Map<string, DetailMsg[]>();
  for (const m of allMessages) {
    const arr = byThread.get(m.consultationId) ?? [];
    arr.push({
      id: m.id,
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
      payload: m.payload ?? null,
      structured: (m.structured as import("@/lib/advisorTypes").StructuredAdvice | null) ?? null,
      createdAt: m.createdAt.toISOString(),
    });
    byThread.set(m.consultationId, arr);
  }

  type Thread = {
    id: string;
    firstQuestion: string;
    questionCount: number;
    startedAt: string;
    lastAnswerAt: string | null;
    lastActivityAt: number;
    messages: DetailMsg[];
  };
  const threads: Thread[] = [];
  for (const [id, msgs] of byThread) {
    if (msgs.length === 0) continue;
    const userMsgs = msgs.filter((m) => m.role === "user");
    const assistantMsgs = msgs.filter((m) => m.role === "assistant");
    threads.push({
      id,
      firstQuestion: (userMsgs[0] ?? msgs[0]).content,
      questionCount: userMsgs.length,
      startedAt: msgs[0].createdAt,
      lastAnswerAt: assistantMsgs.length ? assistantMsgs[assistantMsgs.length - 1].createdAt : null,
      lastActivityAt: new Date(msgs[msgs.length - 1].createdAt).getTime(),
      messages: msgs,
    });
  }
  // Most-recently-active thread first.
  threads.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

  const list: HistoryListItem[] = threads.map((t) => ({
    id: t.id,
    firstQuestion: t.firstQuestion,
    questionCount: t.questionCount,
    startedAt: t.startedAt,
    lastAnswerAt: t.lastAnswerAt,
  }));

  let detail: HistoryDetail | null = null;
  const selectedId = sp.id ?? list[0]?.id ?? null;
  if (selectedId) {
    const chosen = threads.find((t) => t.id === selectedId);
    if (chosen) {
      detail = { id: chosen.id, messages: chosen.messages };
    }
  }

  return (
    <>
      <PageHeader
        title="Advisory - History"
        subtitle="Review previous consultations and business recommendations."
        help={<AdvisoryHelp />}
      />
      <ConsultationTabs historyCount={list.length} />
      <HistoryClient
        list={list}
        detail={detail}
        currency={business.currency}
        canShareAnalyses={canShareAnalyses}
        currentPlan={effectivePlan.plan}
      />
    </>
  );
}
