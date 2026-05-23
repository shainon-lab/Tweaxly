"use client";

// Renders a button + manages BuyCreditsModal open state. The Pro
// counterpart to UpgradeTriggerButton - dropped in anywhere a "Buy
// more credits" CTA used to link to /settings.

import { useState } from "react";
import BuyCreditsModal from "./BuyCreditsModal";

interface BuyCreditsTriggerButtonProps {
  children:    React.ReactNode;
  className?:  string;
  // Optional side-effect that runs before opening the modal (e.g.
  // close a parent dialog).
  onBeforeOpen?: () => void;
}

export default function BuyCreditsTriggerButton({
  children, className, onBeforeOpen,
}: BuyCreditsTriggerButtonProps) {
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
      <BuyCreditsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
