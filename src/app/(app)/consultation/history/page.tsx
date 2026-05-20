// Consultation History - split-screen: list of past questions on the
// left, the selected question's response on the right. Selection is
// driven by ?id= (consultation-message id, not consultation id) so
// every question shows up as its own row even when several were asked
// inside the same thread.

import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationTabs from "../ConsultationTabs";
import HistoryClient, { type HistoryListItem, type HistoryDetail } from "./HistoryClient";

export default async function ConsultationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const allMessages = await prisma.consultationMessage.findMany({
    where: { consultation: { businessId: business.id } },
    orderBy: [{ consultationId: "asc" }, { createdAt: "asc" }],
  });

  type Pair = {
    id: string;
    question: string;
    answer: string | null;
    payload: string | null;
    askedAt: Date;
  };
  const pairs: Pair[] = [];
  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i];
    if (m.role !== "user") continue;
    const next = allMessages[i + 1];
    const paired =
      next && next.consultationId === m.consultationId && next.role === "assistant"
        ? next
        : null;
    pairs.push({
      id: m.id,
      question: m.content,
      answer: paired?.content ?? null,
      payload: paired?.payload ?? null,
      askedAt: m.createdAt,
    });
  }
  pairs.sort((a, b) => b.askedAt.getTime() - a.askedAt.getTime());

  const list: HistoryListItem[] = pairs.map((p) => ({
    id: p.id,
    title: p.question,
    askedAt: p.askedAt.toISOString(),
  }));

  let detail: HistoryDetail | null = null;
  const selectedId = sp.id ?? list[0]?.id ?? null;
  if (selectedId) {
    const chosen = pairs.find((p) => p.id === selectedId);
    if (chosen) {
      detail = {
        id: chosen.id,
        question: chosen.question,
        askedAt: chosen.askedAt.toISOString(),
        answerMarkdown: chosen.answer,
        payload: chosen.payload,
      };
    }
  }

  return (
    <>
      <PageHeader
        title="Advisory History"
        subtitle="Review previous consultations and business recommendations."
      />
      <ConsultationTabs historyCount={list.length} />
      <HistoryClient
        list={list}
        detail={detail}
        currency={business.currency}
      />
    </>
  );
}
