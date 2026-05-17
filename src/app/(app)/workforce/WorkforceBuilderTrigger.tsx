"use client";

// Opens the Scenario Builder side panel scoped to workforce events
// only (payroll family). Dispatches the shared open event with a
// filter payload; ScenarioBuilderPanel (also mounted on this page)
// listens and slides in with payroll-only event cards.

import type { ScenarioBuilderOpenDetail } from "../forecast/ScenarioBuilderPanel";

export default function WorkforceBuilderTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          const detail: ScenarioBuilderOpenDetail = {
            filter: ["payroll"],
            title: "Workforce Scenario Builder",
            subtitle: "Model hires, terminations, and salary changes.",
          };
          window.dispatchEvent(
            new CustomEvent("tweaxly:open-scenario-builder", { detail }),
          );
        }
      }}
      className="btn-primary text-sm px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-transform duration-200 active:scale-[0.98]"
    >
      Workforce Scenario Builder
    </button>
  );
}
