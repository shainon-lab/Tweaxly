import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationClient from "./ConsultationClient";

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const threads = await prisma.consultation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  const activeId = sp.id ?? threads[0]?.id ?? null;
  const active = activeId
    ? await prisma.consultation.findFirst({
        where: { id: activeId, businessId: business.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  // History view: pair every past user message with the next assistant
  // reply from the same thread. Ordered newest-question-first.
  const allMessages = await prisma.consultationMessage.findMany({
    where: { consultation: { businessId: business.id } },
    orderBy: [{ consultationId: "asc" }, { createdAt: "asc" }],
  });
  type HistoryEntry = {
    id: string;
    question: string;
    answer: string | null;
    askedAt: string;
  };
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

  // Detect whether the real Claude integration is configured. The advisor
  // checks the same env var at request time; we expose a boolean here so the
  // UI can show a clear banner when free-form Q&A isn't available yet.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeEnabled =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  return (
    <>
      <PageHeader
        title="Consultation"
        subtitle={
          claudeEnabled
            ? "Ask anything about your business. Claude has your last 18 months of data on hand and can answer general business questions too."
            : "Free-form Q&A needs the Claude integration enabled — see the banner below."
        }
      />
      <ConsultationClient
        currency={business.currency}
        claudeEnabled={claudeEnabled}
        history={history}
        active={
          active
            ? {
                id: active.id,
                title: active.title,
                messages: active.messages.map((m) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  payload: m.payload,
                  createdAt: m.createdAt.toISOString(),
                })),
              }
            : null
        }
      />
    </>
  );
}
