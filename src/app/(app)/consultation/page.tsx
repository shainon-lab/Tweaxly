// New Advisory.
//
// Custom-question surface only. The previous "Recommended" hero and
// "Strategic situations" list moved to /consultation/suggested. This
// page is now a focused, spacious textarea + answer view.
//
// Arrival from /consultation/suggested with ?q=&auto=1 prefills the
// draft AND auto-submits, so the user lands directly on the answer.
// Arrival with just ?q= prefills the draft for editing.

import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { MessageSquareText, Sparkles, History } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";
import EmptyDataPreview from "@/components/EmptyDataPreview";

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; auto?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const [totalQuestions, totalTxnCount] = await Promise.all([
    prisma.consultationMessage.count({
      where: { consultation: { businessId: business.id }, role: "user" },
    }),
    prisma.transaction.count({ where: { businessId: business.id } }),
  ]);
  // Without transactions the advisor has nothing to ground its
  // answers in - show the platform-wide bank-intelligence empty state
  // instead of letting the user spend credits on context-free advice.
  const isEmpty = totalTxnCount === 0;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeEnabled =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  const initialDraft = typeof sp.q === "string" ? sp.q : "";
  // ?auto=1 means the user clicked a suggested question - submit the
  // draft on mount so they don't have to click Consult again.
  const autoSubmit   = sp.auto === "1" && !!initialDraft.trim();
  const { t } = await getServerT();

  return (
    <>
      <PageHeader
        title={t("page.advisory.title")}
        subtitle={t("page.advisory.subtitle")}
        right={
          <HowItWorks
            title="How the AI advisor works"
            intro="Free-form Q&A about your business. The advisor sees your full financial picture, business profile, and recent activity. Ask anything in plain business English; the advisor speaks the same back."
            cards={[
              { icon: <MessageSquareText size={16} strokeWidth={1.7} />, title: "Asking questions", body: "Type a question, hit Analyze. Answers are grounded in YOUR numbers and YOUR business context, not generic templates." },
              { icon: <Sparkles size={16} strokeWidth={1.7} />,          title: "AI credits",       body: "A simple question costs 1 credit. A deep analysis on a signal costs 3. Generating a fresh forecast or running a scenario costs 5." },
              { icon: <History size={16} strokeWidth={1.7} />,           title: "History",          body: "Past consultations are kept. Open the History tab to scroll back through previous Q&As - useful when you want to compare what changed." },
            ]}
            outro="The advisor can talk about strategy, growth ideas, hiring decisions, vendor choices, pricing - not just numbers. If a topic isn't useful, ignore the response and ask differently."
          />
        }
      />
      <ConsultationTabs historyCount={totalQuestions} />
      {isEmpty ? (
        <EmptyDataPreview surface="consultation" />
      ) : (
        <ConsultationClient
          currency={business.currency}
          claudeEnabled={claudeEnabled}
          active={null}
          initialDraft={initialDraft}
          autoSubmit={autoSubmit}
        />
      )}
    </>
  );
}
