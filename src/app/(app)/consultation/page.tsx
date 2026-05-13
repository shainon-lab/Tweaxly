import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";

export default async function ConsultationPage() {
  const { business } = await requireBusiness();

  // The New Consultation view always lands clean — no pre-loaded thread,
  // no ?id= state to honor. Every Start Consultation creates a fresh
  // Consultation row server-side, and past Q&As live on /history.
  const active = null;

  // Used by the tab nav to badge Consultation History with a count.
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
        subtitle="Ask about cashflow, payroll, expenses, forecasts, profitability, hiring decisions, or business performance."
      />
      <ConsultationTabs historyCount={totalQuestions} />
      <ConsultationClient
        currency={business.currency}
        claudeEnabled={claudeEnabled}
        active={active}
      />
    </>
  );
}
