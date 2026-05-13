// Consultation → Chat history sub-tab. Lists every past user question
// (across all threads) with its timestamp; expanding a row reveals the
// advisor's reply.

import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationTabs from "../ConsultationTabs";
import HistoryClient, { type HistoryEntry } from "./HistoryClient";

export default async function ConsultationHistoryPage() {
  const { business } = await requireBusiness();

  // Pair every user message with the next assistant reply from the same
  // thread, ordered newest-question-first.
  const allMessages = await prisma.consultationMessage.findMany({
    where: { consultation: { businessId: business.id } },
    orderBy: [{ consultationId: "asc" }, { createdAt: "asc" }],
  });
  const history: HistoryEntry[] = [];
  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i];
    if (m.role !== "user") continue;
    const next = allMessages[i + 1];
    const answer =
      next && next.consultationId === m.consultationId && next.role === "assistant"
        ? next.content
        : null;
    history.push({
      id: m.id,
      question: m.content,
      answer,
      askedAt: m.createdAt.toISOString(),
    });
  }
  history.sort((a, b) => b.askedAt.localeCompare(a.askedAt));

  return (
    <>
      <PageHeader
        title="Consultation"
        subtitle="Every question you've asked the advisor — click any to read the answer again."
      />
      <ConsultationTabs historyCount={history.length} />
      <HistoryClient history={history} />
    </>
  );
}
