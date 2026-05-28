"use client";

// Reusable blur-+-lock wrapper for any locked premium surface.
// Wraps the actual content (e.g. ScenarioBuilderPanel) so the user
// sees what the feature looks like rather than a generic upsell
// card. Clicking the overlay's CTA opens the shared UpgradeModal.
//
// Usage:
//   <LockedOverlay
//     locked={!canScenarios}
//     feature="Scenario Builder"
//     plan={effectivePlan.plan}
//     benefits={[
//       "Model hires, cuts, contract changes, marketing shifts",
//       "Stack multiple scenarios side by side",
//       "Long-term horizons (Pro+)",
//     ]}
//   >
//     <ScenarioBuilderPanel ... />
//   </LockedOverlay>

import { useState } from "react";
import UpgradeModal from "./UpgradeModal";

interface LockedOverlayProps {
  // When false, children render normally with no overlay.
  locked:    boolean;
  // The capability being locked - shown in the overlay AND in the
  // upgrade modal headline.
  feature:   string;
  plan?:     string;   // current plan, passed to UpgradeModal
  // Custom benefit bullets shown inside the modal. If omitted, the
  // modal falls back to its generic list.
  benefits?: string[];
  // Optional short blurb shown ON the overlay itself (above the
  // button). Defaults to the spec phrasing: "Available in Pro".
  blurb?:    string;
  // Optional: prevent the underlying content from receiving pointer
  // events even outside the overlay area. Default true.
  blockInteraction?: boolean;
  // Optional: how aggressively to blur the underlying content.
  // "sm" (default) keeps the layout readable; "md" makes it obvious.
  blur?: "sm" | "md";
  children: React.ReactNode;
}

export default function LockedOverlay({
  locked, feature, plan, benefits, blurb,
  blockInteraction = true,
  blur = "sm",
  children,
}: LockedOverlayProps) {
  const [open, setOpen] = useState(false);

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={[
          blur === "md" ? "blur" : "blur-sm",
          "opacity-60 select-none",
          blockInteraction ? "pointer-events-none" : "",
        ].join(" ")}
      >
        {children}
      </div>

      <div
        data-surface="dark"
        className="absolute inset-0 z-10 flex items-center justify-center p-6 rounded-xl"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(11,13,18,0.85), rgba(11,13,18,0.55))",
        }}
      >
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-accent/40 bg-accent-soft/20 text-accent mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-white">{feature} is a Pro feature</div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            {blurb ?? "Available on Pro and Business plans. Free users see this layout as a preview."}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          >
            Upgrade to unlock
          </button>
        </div>
      </div>

      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        feature={feature}
        currentPlan={plan}
        benefits={benefits}
      />
    </div>
  );
}
