// Consultation History — split-screen: list of past consultations on the
// left, the selected consultation's response on the right. Selection is
// driven by ?id= so deep-linking and back/forward work cleanly.

import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationTabs from "../ConsultationTabs";
import HistoryClient, { type HistoryListItem, type HistoryDetail } from "./HistoryClient";
import { renderMarkdown } from "../markdown";

export default async function ConsultationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  // Top-level list shows one row per Consultation, dated by its most
  // recent message timestamp so newest activity bubbles up first.
  const consultations = await prisma.consultation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        // First user message = the question; last assistant message =
        // the answer shown in the right panel.
        take: 50,
      },
    },
  });

  const list: HistoryListItem[] = consultations.map((c) => {
    const firstUser = c.messages.find((m) => m.role === "user");
    return {
      id: c.id,
      title: firstUser?.content ?? c.title,
      askedAt: (firstUser?.createdAt ?? c.createdAt).toISOString(),
    };
  });

  let detail: HistoryDetail | null = null;
  const selectedId = sp.id ?? list[0]?.id ?? null;
  if (selectedId) {
    const chosen = consultations.find((c) => c.id === selectedId);
    if (chosen) {
      const firstUser = chosen.messages.find((m) => m.role === "user");
      const lastAssistant = chosen.messages.slice().reverse().find((m) => m.role === "assistant");
      detail = {
        id: chosen.id,
        question: firstUser?.content ?? chosen.title,
        askedAt: (firstUser?.createdAt ?? chosen.createdAt).toISOString(),
        answerMarkdown: lastAssistant?.content ?? null,
      };
    }
  }

  // Pre-render the markdown server-side so the client component doesn't
  // need to re-parse it on every selection.
  const answerNodes =
    detail && detail.answerMarkdown ? renderMarkdown(detail.answerMarkdown) : null;

  return (
    <>
      <PageHeader
        title="Consultation History"
        subtitle="Review previous consultations and business recommendations."
      />
      <ConsultationTabs historyCount={list.length} />
      <HistoryClient list={list} detail={detail} answerNodes={answerNodes} />
    </>
  );
}
