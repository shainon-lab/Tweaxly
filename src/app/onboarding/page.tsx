// Onboarding wizard - three steps tuned for Time To First Value:
//   1. Welcome
//   2. Business basics (name, country, base currency, fiscal year)
//   3. Data intro → upload bank OR skip into the product
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
        fiscalStartMonth: business.fiscalStartMonth,
      }}
      detectedCountry={detectedCountry}
    />
  );
}
