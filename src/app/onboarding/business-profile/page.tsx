// Business Profile (Business DNA) onboarding wizard.
//
// Routed at /onboarding/business-profile. Lives at the app root (not
// under (app)) so the page renders on a clean canvas without the
// sidebar / chrome - the wizard is the only thing the user sees.
//
// Auth-required. Redirects to /dashboard when the workspace already
// has a substantive profile (industry + business model) so users
// can't be looped back through the wizard repeatedly.

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import {
  getBusinessProfile, isProfileSubstantive,
} from "@/lib/businessProfile";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function BusinessProfileOnboardingPage() {
  const { business } = await requireBusiness();
  const profile = await getBusinessProfile(business.id);
  if (isProfileSubstantive(profile)) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      businessName={business.name}
      initial={profile ? {
        industry:         profile.industry,
        businessCategory: profile.businessCategory,
        businessModels:   profile.businessModels,
        mainGoal:         profile.mainGoal,
        customerType:     profile.customerType,
        revenueStage:     profile.revenueStage,
        biggestChallenge: profile.biggestChallenge,
        importantKpis:    profile.importantKpis,
      } : null}
    />
  );
}
