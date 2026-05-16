"use client";

// Small button that opens the Scenario Builder side panel. Mounted
// in the Forecast PageHeader's right slot on the Scenarios view
// once at least one assumption exists. Dispatches the shared open
// event so the panel (mounted elsewhere on the page) slides in.

export default function ScenarioBuilderTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tweaxly:open-scenario-builder"));
        }
      }}
      className="btn-primary text-sm px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-transform duration-200 active:scale-[0.98]"
    >
      Scenario Builder
    </button>
  );
}
