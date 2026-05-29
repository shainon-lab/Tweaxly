// Suggested Consultations.
//
// AI-curated list of questions worth asking, derived from the same
// BusinessContext + signal pool the rest of the platform uses.
// Surfaces:
//   • The single highest-priority "Recommended" consultation (lifted
//     from the legacy hero so the most urgent question comes first).
//   • A wider sweep of strategic situations from the signal pool +
//     evergreen advisor entry points.
//
// Each suggestion renders as a card with a CONSULT button. Clicking
// it navigates to /consultation?q=<question>&auto=1 which the
// ConsultationClient picks up and auto-submits, so the user lands
// directly on the answer.

import PageHeader from "@/components/PageHeader";
import AdvisoryHelp from "@/components/AdvisoryHelp";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";
import {
  pickRecommendedConsultation,
  pickSuggestedConsultations,
  type StrategicSituation,
} from "@/lib/consultationFocus";
import ConsultationTabs from "../ConsultationTabs";
import SuggestedClient, { type SuggestedQuestion } from "./SuggestedClient";

export const dynamic = "force-dynamic";

export default async function SuggestedPage() {
  const { business } = await requireBusiness();

  const totalQuestions = await prisma.consultationMessage.count({
    where: { consultation: { businessId: business.id }, role: "user" },
  });

  // Build the full suggestion list. The recommended consultation
  // becomes the first card with a "Priority" badge; the strategic
  // situations follow.
  let questions: SuggestedQuestion[] = [];
  try {
    const ctx     = await buildBusinessContext(business.id);
    const signals = await recommendProactive(business.id, ctx);
    const rec     = pickRecommendedConsultation(ctx, signals);
    // Bigger pool than the legacy hero (which capped at 4). 9 here
    // + the recommended row → up to 10 questions on the page.
    const sits    = pickSuggestedConsultations(ctx, signals, rec?.signalKey, 9);

    if (rec) {
      questions.push({
        id:       `rec-${rec.signalKey ?? "context"}`,
        title:    rec.cta,
        question: rec.question,
        blurb:    `${rec.observation} ${rec.interpretation}`.trim(),
        tone:     rec.tone === "good" ? "good"
                : rec.tone === "warn" ? "warn"
                : rec.tone === "bad"  ? "bad"
                : "neutral",
        priority: true,
      });
    }
    questions.push(...sits.map((s: StrategicSituation): SuggestedQuestion => ({
      id:       s.id,
      title:    s.title,
      question: s.question,
      blurb:    s.blurb,
      tone:     s.tone,
      priority: false,
    })));
  } catch {
    questions = [];
  }

  return (
    <>
      <PageHeader
        title="Advisory - Suggested"
        subtitle="AI-curated questions worth asking, ranked by what's actionable, abnormal, or otherwise important right now in this workspace."
        help={<AdvisoryHelp />}
      />
      <ConsultationTabs historyCount={totalQuestions} />
      <SuggestedClient questions={questions} />
    </>
  );
}
