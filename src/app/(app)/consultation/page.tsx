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
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";
import BankIntelligenceEmptyState from "@/components/BankIntelligenceEmptyState";

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
      />
      <ConsultationTabs historyCount={totalQuestions} />
      {isEmpty ? (
        <BankIntelligenceEmptyState surface="consultation" />
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
