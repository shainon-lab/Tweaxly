"use client";

// Onboarding empty-state for Forecast → Scenarios. Shown only when
// the user has zero assumptions in play. Centered message + a
// 'Scenario Builder' CTA. Clicking the CTA expands the builder
// inline below the message rather than opening the side panel -
// at this stage there's no existing forecast context worth
// preserving, so an inline setup reads as more natural onboarding.
//
// Once the user creates their first assumption, the page re-renders
// without this component and the persistent top-right Scenario
// Builder button takes over.

import { useState } from "react";
import ScenarioBuilder, { type RosterMember } from "./ScenarioBuilder";

export default function ScenariosOnboarding({
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
  const [showBuilder, setShowBuilder] = useState(false);
  return (
    <div className="space-y-6">
      {!showBuilder ? (
        <div className="card text-center py-14 px-6">
          <div className="text-lg font-semibold text-slate-100 mb-2">
            No scenarios created yet
          </div>
          <div className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mb-6">
            If you would like to generate a forecast based on specific business scenarios,
            use the Scenario Builder to create one or more forecasting scenarios.
          </div>
          <button
            type="button"
            onClick={() => setShowBuilder(true)}
            className="btn-primary text-sm md:text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform duration-200 active:scale-[0.98]"
          >
            Scenario Builder
          </button>
        </div>
      ) : (
        <div className="card">
          <ScenarioBuilder
            roster={roster}
            activePayrollSum={activePayrollSum}
            maxMonthsAhead={maxMonthsAhead}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
