// Shared "How Reports work" help modal. Used on every Report sub-tab
// (P&L Statements, Category Trends, Yearly Summary). One source of
// truth - copy edits stay in sync across all three.

import HowItWorks from "@/components/HowItWorks";
import { FileText, GitCompare, Download, Layers, CalendarRange, BarChart3 } from "lucide-react";

export default function ReportsHelp() {
  return (
    <HowItWorks
      title="How Reports work"
      intro="Long-form views of your business across the period or year you pick. Numbers come straight from your uploaded data; AI is only used to write the prose narrative. Same period, same data, same report - reproducible every time."
      cards={[
        { icon: <FileText size={16} strokeWidth={1.7} />,      title: "P&L Statements",  body: "The full profit-and-loss view. Revenue and expense totals by month, quarter, or year, with category breakdowns. The base of every other report on the platform." },
        { icon: <Layers size={16} strokeWidth={1.7} />,        title: "Category Trends", body: "The per-category month grid - every category as a row, every month as a column. Drill into a single category, spot rising or falling trends, and confirm hunches before acting." },
        { icon: <CalendarRange size={16} strokeWidth={1.7} />, title: "Yearly Summary",  body: "A full retrospective on any completed calendar year. Top insights and tips ranked by importance - revenue movements, margin trajectory, payroll ratio, vendor concentration. Each insight comes with a one-line tip." },
        { icon: <BarChart3 size={16} strokeWidth={1.7} />,     title: "Charts",          body: "The seven-chart period grid - trend, cash flow, top expense categories, revenue channel, spending shape, swing, and top vendors. A visual snapshot of the same period you're viewing on the other reports." },
        { icon: <GitCompare size={16} strokeWidth={1.7} />,    title: "Comparison",      body: "Every report supports side-by-side period comparison - this period vs. last year, last quarter, or the period before. Surfaces what grew, what shrank, and where to dig in first." },
        { icon: <Download size={16} strokeWidth={1.7} />,      title: "Exports",         body: "Excel, CSV, and PDF on Pro. White-label PDF exports for sharing with partners, accountants, and stakeholders. PDF downloads use the exact period you're viewing." },
      ]}
      outro="Granularity (month / quarter / year) and the comparison period are owner-set on each report. The same period flows through to the PDF export."
    />
  );
}
