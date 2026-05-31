// Confidence summary for the forecast readiness banner. Lives in its
// own file (no "use client" boundary) so the server-rendered Forecast
// page can call it directly. Previously this was exported from
// ForecastExplanationPanel.tsx, but that module is marked "use client"
// and Next.js cannot invoke a function across that boundary from a
// Server Component (the named export becomes a client reference, not
// the real function), which crashed the SC render.

import type { ForecastResult } from "@/lib/forecastEngine";

// Mirrors the Tone palette used in the explanation panel so the
// confidence percent picks up the same red / neutral / green
// treatment based on the underlying confidence band.
const TONE_TEXT_CONFIDENCE: Record<"positive" | "neutral" | "warning", string> = {
  positive: "text-good",
  neutral:  "text-slate-400",
  warning:  "text-warn",
};

function volatilityLabel(result: ForecastResult): "Low" | "Medium" | "High" {
  if (result.confidence === "high")   return "Low";
  if (result.confidence === "medium") return "Medium";
  return "High";
}

export function buildConfidenceMeta(result: ForecastResult): {
  pct: number;
  toneClass: string;
  basedOn: string;
} {
  const confTone = result.confidence === "high"   ? "positive"
                 : result.confidence === "medium" ? "neutral"
                 :                                  "warning";
  const volatility = volatilityLabel(result);
  const recurringCount = result.recurringDetected.length;
  const basedOn = [
    `${result.baselinePeriod.monthsWithData}/${result.baselinePeriod.monthsResolved} months`,
    `${volatility.toLowerCase()} volatility`,
    result.seasonalityApplied ? "seasonal pattern applied" : "no seasonal pattern",
    recurringCount > 0
      ? `${recurringCount} recurring item${recurringCount === 1 ? "" : "s"}`
      : "no recurring items",
  ].join(" · ");
  return {
    pct: result.confidenceScore,
    toneClass: TONE_TEXT_CONFIDENCE[confTone],
    basedOn,
  };
}
