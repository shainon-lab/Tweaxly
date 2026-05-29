// Shared "How forecasting works" help modal used by every page in the
// Forecast section (Overview, Scenarios, Workforce Planning). One
// source of truth - if the explainer copy ever changes, both pages
// stay in sync.

import HowItWorks from "@/components/HowItWorks";
import { LineChart, Sliders, Gauge, Users } from "lucide-react";

export default function ForecastHelp() {
  return (
    <HowItWorks
      title="How forecasting works"
      intro="Tweaxly projects revenue, expenses, and cash forward based on your recent activity. The baseline assumes the trend continues. Scenarios let you model real changes - hires, raises, contracts, marketing shifts, one-off events - on top of the baseline so you see the impact before committing."
      cards={[
        { icon: <LineChart size={16} strokeWidth={1.7} />, title: "Overview",           body: "The baseline forecast: what your business looks like if recent trends continue. Confidence reflects how much consistent history we had to work with." },
        { icon: <Sliders size={16} strokeWidth={1.7} />,   title: "Scenarios",          body: "Layer assumptions on top of the baseline. Stack multiple scenarios side by side to compare options. Pro feature." },
        { icon: <Users size={16} strokeWidth={1.7} />,     title: "Workforce planning", body: "A dedicated payroll workspace. Live total cost, payroll as a share of revenue, change vs. last month, and a 12-month forecast that roots through to the team roster. Model hires, raises, and contractor changes before committing." },
        { icon: <Gauge size={16} strokeWidth={1.7} />,     title: "Confidence",         body: "Every forecast shows a confidence level. Long horizons and limited history reduce it; consistent recent data lifts it." },
      ]}
      outro="The forecast horizon (3 / 6 / 12 / 24 / 36 / 60 months) caps at 3 months on Free and 60 months on Pro. Set it from the picker on the Forecast page."
    />
  );
}
