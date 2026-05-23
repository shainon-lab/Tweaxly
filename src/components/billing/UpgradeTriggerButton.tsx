"use client";

// One-click upgrade trigger. Renders a button (styled by the caller
// via className + label) that opens the shared UpgradeModal. Used
// everywhere a banner / pill / inline CTA wants to lead the user
// into the Pro checkout flow - so every entry point on the platform
// flows through the same modal + checkout pipeline.

import { useState } from "react";
import UpgradeModal from "./UpgradeModal";

interface UpgradeTriggerButtonProps {
  // The feature the user just tried to use - bubbles through to the
  // modal headline ("Unlock <feature>"). Optional.
  feature?:    string;
  // The current plan ("free" | "pro" | "business"), shown as a pill
  // inside the modal body. Optional.
  currentPlan?: string;
  // Tailored bullets shown in the modal. Optional - falls back to
  // the modal's generic list when omitted.
  benefits?:    string[];
  // Button content (text + glyph). Required so each caller controls
  // the wording in-context (e.g. "Upgrade to Pro →" vs "Reactivate").
  children:    React.ReactNode;
  className?:  string;
  // Optional: side-effect that runs on click before opening the
  // modal - e.g. close a parent menu/popover.
  onBeforeOpen?: () => void;
}

export default function UpgradeTriggerButton({
  feature, currentPlan, benefits,
  children, className, onBeforeOpen,
}: UpgradeTriggerButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { onBeforeOpen?.(); setOpen(true) }}
        className={className}
      >
        {children}
      </button>
      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        feature={feature}
        currentPlan={currentPlan}
        benefits={benefits}
      />
    </>
  );
}
