// Premium gate for Real-Time Business Alerts. Web Push delivery and
// custom monitors are Pro-only; in-app inbox is available on every
// plan. Centralised here so the API + UI can ask one question.

import { getEffectivePlan } from "../billing";

export async function canUsePushAlerts(businessId: string): Promise<boolean> {
  const eff = await getEffectivePlan(businessId);
  if (eff.readOnly) return false;
  return eff.plan !== "free";
}
