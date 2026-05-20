// Adaptive AI onboarding. Multi-step wizard:
//   1. Welcome  (Start setup vs. Explore demo business)
//   2. Business basics       (name, format, currency, country, industry)
//   3. Business stage        (new / growing / established)
//   4. Financial history     (yes/no - skipped on stage='new')
//   5. Payroll structure     (yes/no)
//   6. Business goals        (multi-select)
//   7. → /manual-data         (Import Your Business Data)
//
// Server-side: bootstraps the wizard with the current business
// values so saved answers persist across reloads. If the business
// already has `onboardedAt`, we redirect to /dashboard (existing
// users don't get ambushed).

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { detectIpCountry } from "@/lib/geoip";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { business } = await requireBusiness();
  if (business.onboardedAt) {
    redirect("/dashboard");
  }
  const detectedCountry = detectIpCountry();
  return (
    <OnboardingClient
      business={{
        id:               business.id,
        name:             business.name,
        currency:         business.currency,
        country:          business.country,
        industry:         business.industry,
        businessFormat:   business.businessFormat,
        businessStage:    business.businessStage,
        hasAnnualReports: business.hasAnnualReports,
        paysSalaries:     business.paysSalaries,
        goals:            business.goals,
      }}
      detectedCountry={detectedCountry}
    />
  );
}
