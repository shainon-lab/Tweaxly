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
import { Lock } from "lucide-react";
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

      {/* Card-style upgrade box, centred over the blurred preview. Same
          visual treatment as BankIntelligenceEmptyState (the "Upload
          your bank transactions to activate your business intelligence"
          card) so every empty / locked state on the platform reads as
          part of the same family. The card uses a semi-transparent
          surface + backdrop blur so the user still senses the locked
          feature pulsing behind the box without the chrome competing
          for attention. */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
        <section
          className="rounded-2xl border border-line shadow-lg relative overflow-hidden max-w-xl w-full p-6 md:p-8 bg-ink-900/90 backdrop-blur-md"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(124,92,250,0.14) 0%, rgba(79,125,255,0.08) 50%, rgba(34,211,238,0.10) 100%)",
          }}
        >
          <div className="flex items-start gap-4">
            <span className="shrink-0 inline-flex w-11 h-11 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
              <Lock size={20} strokeWidth={1.5} />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold leading-tight tracking-tight">
                {feature} is a Pro feature
              </h2>
              <p className="mt-2 text-sm md:text-base text-slate-300 leading-relaxed">
                {blurb ?? "Available on Pro and Business plans. Free workspaces see this layout as a preview - upgrade to unlock it for everyone on the workspace."}
              </p>
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Lock size={14} strokeWidth={2} />
                  Upgrade to unlock
                </button>
                <span className="text-[11px] text-slate-500">
                  Unlocks for the whole workspace.
                </span>
              </div>
            </div>
          </div>
        </section>
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
