"use client";

// Thin entry-point button used by every AI surface that supports
// sharing (Consultation in Phase 3; Signals / Forecast / Insights in
// Phase 4). Owns the modal's open state so the caller can keep its
// own JSX clean - just drop the button next to the analysis with the
// snapshot props and the entitlement.

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareAnalysisModal from "./ShareAnalysisModal";
import type { ShareSourceType } from "@/lib/sharedAnalyses";

export default function ShareAnalysisButton({
  sourceType,
  sourceId,
  snapshotContent,
  snapshotMeta,
  canShare,
  currentPlan,
  className,
  label = "Share",
}: {
  sourceType:      ShareSourceType;
  sourceId:        string;
  snapshotContent: Record<string, unknown>;
  snapshotMeta:    Record<string, unknown>;
  canShare:        boolean;
  currentPlan:     string;
  className?:      string;
  label?:          string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className
          ?? "btn-ghost text-sm whitespace-nowrap inline-flex items-center gap-1.5"
        }
      >
        <Share2 size={14} strokeWidth={2} />
        {label}
      </button>
      <ShareAnalysisModal
        open={open}
        onClose={() => setOpen(false)}
        sourceType={sourceType}
        sourceId={sourceId}
        snapshotContent={snapshotContent}
        snapshotMeta={snapshotMeta}
        canShare={canShare}
        currentPlan={currentPlan}
      />
    </>
  );
}
