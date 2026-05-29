"use client";

// Side-panel wrapper around ScenarioBuilder.
//
// Originally the Scenario Builder lived inline at the bottom of the
// Forecast page, which caused two UX problems: (1) users had to
// scroll to it, then (2) the page jumped back to the top after each
// save. Both broke the "live forecasting" feel.
//
// This wrapper:
//   - Anchors a single primary 'Build / Modify Scenario' button at
//     the top of the Scenarios view.
//   - On click, slides in a right-side panel that hosts the existing
//     ScenarioBuilder. The forecast chart, KPIs, and assumption
//     chips stay visible behind a 30% black/blurred overlay, so the
//     user keeps watching their model change as they apply
//     assumptions.
//   - ESC closes; background click closes; dedicated close ✕ closes.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import ScenarioBuilder, { type RosterMember } from "./ScenarioBuilder";

// Any client component can dispatch this event to open the Scenario
// Builder panel from anywhere on the Forecast page (the +Scenario
// Builder button in ForecastSetup, the Open builder button in
// ActiveScenarioAssumptions, etc.).
export const SCENARIO_BUILDER_OPEN_EVENT = "tweaxly:open-scenario-builder";

// Detail accepted by the open event. When `filter` is set, the
// panel opens with the matching scope restriction (e.g. workforce
// shows only payroll events). When absent, the panel opens with
// every category visible.
export type ScenarioBuilderOpenDetail = {
  filter?: ("revenue" | "expense" | "payroll")[];
  // Header text overrides - used when the panel opens from a
  // scoped context (Workforce Planning) so the user sees the
  // intent in the header.
  title?: string;
  subtitle?: string;
};

export default function ScenarioBuilderPanel({
  roster,
  activePayrollSum,
  maxMonthsAhead,
  currency,
}: {
  roster: RosterMember[];
  activePayrollSum: number;
  maxMonthsAhead: number;
  currency: string;
}) {
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ScenarioBuilderOpenDetail["filter"]>(undefined);
  const [headerOverride, setHeaderOverride] = useState<{ title?: string; subtitle?: string }>({});

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Listen for app-wide requests to open the builder. Anywhere on the
  // forecast page (or a cross-page link landing here) can trigger it.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ScenarioBuilderOpenDetail>).detail ?? {};
      setFilter(detail.filter);
      setHeaderOverride({ title: detail.title, subtitle: detail.subtitle });
      setOpen(true);
    };
    window.addEventListener(SCENARIO_BUILDER_OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(SCENARIO_BUILDER_OPEN_EVENT, onOpen as EventListener);
  }, []);

  // Cross-page links can land with ?openBuilder=1 to pop the panel
  // on arrival. ?builderFilter=workforce scopes the panel to payroll
  // events only.
  useEffect(() => {
    if (sp.get("openBuilder") === "1") {
      if (sp.get("builderFilter") === "workforce") {
        setFilter(["payroll"]);
        setHeaderOverride({
          title: "Workforce Scenario Builder",
          subtitle: "Model hires, terminations, and salary changes.",
        });
      }
      setOpen(true);
    }
  }, [sp]);

  // Reset overrides when the panel closes so the next open starts
  // with whatever the trigger supplies (or none).
  useEffect(() => {
    if (!open) {
      setFilter(undefined);
      setHeaderOverride({});
    }
  }, [open]);

  return (
    <>
      {open ? (
        <>
          {/* Dimmed overlay - keeps the forecast results visible
              behind the builder so the user maintains visual
              connection to what they're modeling. */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Right-side panel - wider than the Consult panel since
              the builder has more controls. Smooth slide-in via
              the shared slideInRight keyframe. */}
          <aside
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[520px] bg-ink-900 border-l border-line shadow-2xl flex flex-col animate-[slideInRight_220ms_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label="Scenario Builder"
          >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
              <div className="min-w-0">
                <div className="t-meta uppercase tracking-wide text-accent font-semibold mb-1">
                  Scenario Builder
                </div>
                <div className="t-section text-slate-100">
                  {headerOverride.title ?? "Model a 'what-if' decision"}
                </div>
                <div className="t-body text-slate-400 mt-1">
                  {headerOverride.subtitle ?? "Pick an event below. The forecast updates as soon as you save."}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition duration-200"
                aria-label="Close Scenario Builder"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ScenarioBuilder
                roster={roster}
                activePayrollSum={activePayrollSum}
                maxMonthsAhead={maxMonthsAhead}
                currency={currency}
                familyFilter={filter}
              />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
