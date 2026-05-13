import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  // Active thread: explicitly requested by ?id, otherwise the most recent
  // thread. The chat view doesn't render the older threads itself anymore
  // — past Q&As live on /consultation/history.
  const threads = await prisma.consultation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const activeId = sp.id ?? threads[0]?.id ?? null;
  const active = activeId
    ? await prisma.consultation.findFirst({
        where: { id: activeId, businessId: business.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  // Used by the tab nav to badge Chat history with a count.
  const totalQuestions = await prisma.consultationMessage.count({
    where: { consultation: { businessId: business.id }, role: "user" },
  });

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
      <ConsultationTabs historyCount={totalQuestions} />
      <ConsultationClient
        currency={business.currency}
        claudeEnabled={claudeEnabled}
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
