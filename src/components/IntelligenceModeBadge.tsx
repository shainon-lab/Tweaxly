// Small pill that labels the platform's current "intelligence mode".
//
// Modes derive from which financial-source types the workspace has:
//   - Bank-only           → "Bank Intelligence Mode"
//   - Bank + cards/paypal → "Enhanced Intelligence Mode"
//
// Per the onboarding progressive-intelligence philosophy: the platform
// should provide value with partial data and label its own state so
// the owner understands the trade-offs (e.g. card expenses appearing
// as summarized bank charges rather than detailed vendor purchases).
//
// Bank-only mode is the most common "I just started" state and is
// labeled prominently. Once a card / paypal source is added the badge
// upgrades to "Enhanced". The badge intentionally never shows
// negative framing ("limited" / "partial") — it's a status indicator,
// not a downgrade nudge. The CardUploadRecommendation surface handles
// the nudge separately.

import { Sparkles } from "lucide-react";
import type { BankCardSignals } from "@/lib/settlements";

export default function IntelligenceModeBadge({
  signals,
}: {
  signals: BankCardSignals | null;
}) {
  if (!signals || !signals.hasBankSource) return null;
  const bankOnly = !signals.hasCardSource && !signals.hasPaypalSource;
  const label = bankOnly ? "Bank Intelligence Mode" : "Enhanced Intelligence Mode";
  const hint  = bankOnly
    ? "Forecasts and insights are powered by your bank activity. Upload a credit-card or PayPal source to unlock per-vendor categorization."
    : "Forecasts and insights combine bank, card, and/or PayPal data for vendor-level analysis.";
  const tone  = bankOnly ? "text-brand-purple border-brand-purple/30 bg-accent-soft/30" : "text-good border-good/30 bg-good/10";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}
      title={hint}
    >
      <Sparkles size={11} strokeWidth={2} />
      {label}
    </span>
  );
}
