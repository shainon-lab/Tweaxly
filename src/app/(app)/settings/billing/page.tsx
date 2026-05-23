// Per-workspace billing now renders inline inside Settings → Business
// Plan (the third sub-tab carved out of the legacy "Business Profile"
// panel). Old /settings/billing deep links redirect to the new tab.
import { redirect } from "next/navigation";

export default function BillingSettingsRedirect() {
  redirect("/settings?tab=plan");
}
