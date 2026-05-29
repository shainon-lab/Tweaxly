// Shared "How Account works" help modal used by every sub-tab inside
// the Account section. One source of truth - if the explainer copy
// ever changes, every Account tab stays in sync.

import HowItWorks from "@/components/HowItWorks";
import { Briefcase, CreditCard, KeyRound, Languages, MailCheck, Accessibility, ShieldCheck, AlertOctagon } from "lucide-react";

export default function AccountHelp() {
  return (
    <HowItWorks
      title="How the Account section works"
      intro="Your personal account, separate from any workspace. Settings here apply across every workspace you own or belong to - workspaces you can switch into, billing across all of them, language and region, communication preferences, and account-level security."
      cards={[
        { icon: <Briefcase size={16} strokeWidth={1.7} />,    title: "Workspaces",              body: "Every workspace you own or belong to, with plan, AI credits, alerts, and recent activity at a glance. Switch between them or create a new one for a different business. Each workspace has its own subscription." },
        { icon: <CreditCard size={16} strokeWidth={1.7} />,   title: "Orders & Invoices",       body: "Every payment across every workspace - your personal billing history. Download invoices directly from Polar. Payment methods live as a section inside the same tab." },
        { icon: <KeyRound size={16} strokeWidth={1.7} />,     title: "Password",                body: "Change your account password. Strong-password requirements apply; the change is logged in Access Logs." },
        { icon: <Languages size={16} strokeWidth={1.7} />,    title: "Language & Region",       body: "Preferred language for the UI, and region used for date and number formatting. Region defaults to whatever we detected from your IP and can be overridden." },
        { icon: <MailCheck size={16} strokeWidth={1.7} />,    title: "Communication & Notifications", body: "Pause marketing channels you don't want. Manage notification cadence and quiet hours. Transactional emails (billing, security) always come through while the account is active." },
        { icon: <Accessibility size={16} strokeWidth={1.7} />, title: "Accessibility",           body: "Toggle the accessibility helper widget for high-contrast modes, larger text, and reduced motion. Settings persist across sessions and devices." },
        { icon: <ShieldCheck size={16} strokeWidth={1.7} />,  title: "Access Logs",             body: "Every sign-in, password change, and security event on this account. Useful for confirming nothing unexpected happened, or for audit." },
        { icon: <AlertOctagon size={16} strokeWidth={1.7} />, title: "Close Account",           body: "Permanently close your account. Workspaces you own are removed; workspaces you belong to but don't own stay intact for their other members." },
      ]}
      outro="Account settings are about YOU. Anything tied to a specific business - plan, AI credit balance, team members, business profile - lives inside that workspace's own Settings."
    />
  );
}
