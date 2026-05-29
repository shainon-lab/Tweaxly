// Shared "How Signals work" help modal used by every page in the
// Signals section (Signals, Monitor). One source of truth - if the
// explainer copy ever changes, both pages stay in sync.

import HowItWorks from "@/components/HowItWorks";
import { BadgeCheck, CheckCircle2, RefreshCw, Bell, Sliders, BellRing } from "lucide-react";

export default function SignalsHelp() {
  return (
    <HowItWorks
      title="How Signals work"
      intro="The most important business observations from your data right now. AI-generated signals surface what changed and what to focus on; Monitor rules fire when the specific numbers you care about cross a threshold you set. Together they cover the broad picture and your custom KPIs."
      cards={[
        { icon: <BadgeCheck size={16} strokeWidth={1.7} />,   title: "Signals",          body: "AI-generated observations passed through an importance threshold. If nothing meaningful is going on, slots stay empty. Plans cap how many active signals you can have at a time." },
        { icon: <CheckCircle2 size={16} strokeWidth={1.7} />, title: "Read & resolved",  body: "Mark a signal as read once you've seen it - it stays in the list, just muted. Mark as resolved when you're closing it out. If the same condition re-appears, a new signal opens automatically." },
        { icon: <RefreshCw size={16} strokeWidth={1.7} />,    title: "Refresh signals",  body: "Triggers a fresh AI analysis on demand and uses 3 AI credits from your balance. Automatic updates (after data uploads or the weekly re-evaluation) are always free." },
        { icon: <Sliders size={16} strokeWidth={1.7} />,      title: "Monitor",          body: "Build your own threshold rules. Pick a metric (revenue, expenses, a specific category), a direction (up / down), a threshold (% change or absolute amount), and a comparison window (vs. last month / quarter / year)." },
        { icon: <BellRing size={16} strokeWidth={1.7} />,     title: "Firing alerts",    body: "When a Monitor rule's condition is true, an alert lands in the Monitor tab and in the bell notifications. Each rule has its own severity (critical / important / info) and channel preferences (in-app, push, email)." },
        { icon: <Bell size={16} strokeWidth={1.7} />,         title: "Signals vs. notifications", body: "Signals are the current state of your business. The bell shows notifications - events that happened to a signal: created, updated, escalated, or resolved. We never repeat a notification for a signal that's simply still present." },
      ]}
      outro="Monitor rules don't use AI credits - they're rule-based math on your data. Use them for ground-truth thresholds; use Signals for the broader observations Tweaxly surfaces automatically."
    />
  );
}
