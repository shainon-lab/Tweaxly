"use client";

// Split credits progress bar shared by every surface that visualises
// the workspace's AI-credit balance (sidebar pill, UsageModal, Billing
// settings page). One segment shows remaining (good = green), the
// other shows used (bad = red). Always paired with `isLowCredits()`
// from this module so the parent can decide whether to render the
// "running out of credits" alert under the bar.

export interface CreditsBarProps {
  // Current credits remaining. Will be clamped to [0, total].
  balance: number;
  // Maximum credits for the current period (monthlyAICredits for Pro,
  // starterAICredits for Free, etc.). Must be > 0 for the bar to render.
  total:   number;
  // Visual height. "sm" matches the sidebar pill, "md" matches the
  // larger Billing settings + UsageModal surfaces.
  size?:   "sm" | "md";
}

// Returns true when remaining credits are at or below 10% of the total.
// Centralised here so every surface flags the same threshold.
export function isLowCredits(balance: number, total: number): boolean {
  if (total <= 0) return false;
  return balance / total <= 0.10;
}

export default function CreditsBar({ balance, total, size = "md" }: CreditsBarProps) {
  const safeTotal   = Math.max(1, total);
  const safeBalance = Math.max(0, Math.min(balance, safeTotal));
  const used        = safeTotal - safeBalance;
  const remainingPct = (safeBalance / safeTotal) * 100;
  const usedPct      = 100 - remainingPct;

  const height = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div
      className={`${height} rounded-full bg-ink-700/80 overflow-hidden flex`}
      role="progressbar"
      aria-valuenow={safeBalance}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-label={`${safeBalance} of ${safeTotal} credits remaining`}
    >
      <div
        className="h-full bg-good transition-[width] duration-300"
        style={{ width: `${remainingPct}%` }}
        title={`${safeBalance.toLocaleString()} credits remaining`}
      />
      <div
        className="h-full bg-bad transition-[width] duration-300"
        style={{ width: `${usedPct}%` }}
        title={`${used.toLocaleString()} credits used`}
      />
    </div>
  );
}
