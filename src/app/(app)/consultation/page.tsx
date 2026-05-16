import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import {
  pickTodaysFocus,
  pickRecommendedConsultation,
  pickSuggestedConsultations,
  type TodaysFocus,
  type RecommendedConsultation,
  type StrategicSituation,
} from "@/lib/consultationFocus";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const active = null;
  const totalQuestions = await prisma.consultationMessage.count({
    where: { consultation: { businessId: business.id }, role: "user" },
  });

  // Build today's AI focus + the Recommended hero + the curated
  // Strategic situations. All derived from the same BusinessContext
  // the advisor uses, so the Consultation surface stays consistent
  // with whatever the user is seeing on the dashboard and signals.
  let focus: TodaysFocus | null = null;
  let recommended: RecommendedConsultation | null = null;
  let suggested: StrategicSituation[] = [];
  try {
    const ctx = await buildBusinessContext(business.id);
    const signals = await recommendProactive(business.id, ctx);
    focus = pickTodaysFocus(ctx, signals);
    recommended = pickRecommendedConsultation(ctx, signals);
    suggested = pickSuggestedConsultations(ctx, signals, recommended?.signalKey);
  } catch {
    // Fresh accounts without any data still render — the freeform
    // input below is always available.
    focus = null;
    recommended = null;
    suggested = [];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeEnabled =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  const initialDraft = typeof sp.q === "string" ? sp.q : "";

  return (
    <>
      <PageHeader
        title="Advisory"
        subtitle="Strategic AI recommendations based on your business data."
      />
      <ConsultationTabs historyCount={totalQuestions} />
      <ConsultationClient
        currency={business.currency}
        claudeEnabled={claudeEnabled}
        active={active}
        focus={focus}
        recommended={recommended}
        suggested={suggested}
        initialDraft={initialDraft}
      />
    </>
  );
}
