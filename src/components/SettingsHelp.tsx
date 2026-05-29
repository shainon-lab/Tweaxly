// Shared "How Settings works" help modal for every Settings sub-tab
// (Business Settings, Business Profile, Business Plan, Members &
// Access). Opening the ? on any tab shows the same section-wide
// overview.
//
// Categories & Vendors lives under /settings?tab=categories but
// conceptually belongs to the Data section, so it uses DataHelp
// instead - not this component. Workspaces lives under Account,
// not Settings, so it's not covered here either.

import HowItWorks from "@/components/HowItWorks";
import { Building2, Sparkles, CreditCard, Users } from "lucide-react";

export default function SettingsHelp() {
  return (
    <HowItWorks
      title="How Settings work"
      intro="Workspace-level configuration. Most of this is set once when you start a workspace and only revisited when something changes - business basics, AI context, plan, team. Every workspace has its own Settings, so changes here only affect the current workspace."
      cards={[
        { icon: <Building2 size={16} strokeWidth={1.7} />,  title: "Business Settings", body: "Name, currency, fiscal year, VAT, branding. The basics every report and forecast leans on. Currency changes re-convert past activity at locked historical rates so totals stay accurate." },
        { icon: <Sparkles size={16} strokeWidth={1.7} />,   title: "Business Profile",  body: "Industry, model, customers, KPIs - your business DNA. Drives every AI prompt so consultation answers and signal interpretations are grounded in YOUR business, not generic templates." },
        { icon: <CreditCard size={16} strokeWidth={1.7} />, title: "Business Plan",     body: "Track your AI Credit balance, switch between Free and Pro, manage billing. Each workspace has its own subscription - upgrading workspace A doesn't change workspace B." },
        { icon: <Users size={16} strokeWidth={1.7} />,      title: "Members & Access",  body: "Invite teammates with role-based access (Owner / Admin / Viewer). Pro feature - Free workspaces have a single owner only. Pending invitations count toward the 3-seat cap." },
      ]}
      outro="Categories & Vendors looks like a Settings tab but actually belongs to the Data section. Switching between workspaces and the cross-workspace overview live under Account."
    />
  );
}
