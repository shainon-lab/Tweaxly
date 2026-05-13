import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext } from "@/lib/advisor";
import { generateConsultationPrompts } from "@/lib/consultationPrompts";
import ConsultationClient from "./ConsultationClient";
import ConsultationTabs from "./ConsultationTabs";

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  // The New Consultation view always lands clean — no pre-loaded thread,
  // no ?id= state to honor. Every Start Consultation creates a fresh
  // Consultation row server-side, and past Q&As live on /history.
  const active = null;

  // Used by the tab nav to badge Consultation History with a count.
  const totalQuestions = await prisma.consultationMessage.count({
    where: { consultation: { businessId: business.id }, role: "user" },
  });

  // Pull a fresh BusinessContext snapshot so we can produce dynamic
  // suggested prompts grounded in the user's actual numbers. Falls back
  // to general advisor prompts when there's no data yet.
  let prompts: string[] = [];
  try {
    const ctx = await buildBusinessContext(business.id);
    prompts = generateConsultationPrompts(ctx);
  } catch {
    prompts = [];
  }

  // Detect whether the real Claude integration is configured. The advisor
  // checks the same env var at request time; we expose a boolean here so the
  // UI can show a clear banner when free-form Q&A isn't available yet.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeEnabled =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);

  // ?q=… arrives via the "Consult AI" button next to every Business Signal.
  // We pre-fill the textarea with the question so the user can edit before
  // sending — we do NOT auto-submit per the product spec.
  const initialDraft = typeof sp.q === "string" ? sp.q : "";

  return (
    <>
      <PageHeader
        title="Consultation"
        subtitle="Your AI business advisor — Tweaxly analyzes your financial activity, payroll, expenses, revenue, and forecasts to help you make smarter business decisions. Tap a suggested trend below or ask anything about cashflow, hiring, vendors, or profitability."
      />
      <ConsultationTabs historyCount={totalQuestions} />
      <ConsultationClient
        currency={business.currency}
        claudeEnabled={claudeEnabled}
        active={active}
        prompts={prompts}
        initialDraft={initialDraft}
      />
    </>
  );
}
