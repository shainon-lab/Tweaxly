import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { requireBusiness } from "@/lib/auth";
import SourcesClient from "./SourcesClient";
import { Building2, CalendarCheck, HeartPulse } from "lucide-react";

export default async function SourcesPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Data"
        subtitle="Bank accounts, credit cards, PayPal and other places your money moves. Every imported file is tagged to a source so the coverage matrix can show you what's uploaded and what's still missing."
        help={
          <HowItWorks
            title="How sources work"
            intro="A source is one place your money flows through - a specific bank account, credit card, PayPal account, or merchant processor. Every upload and every Plaid sync is tagged to a source so Tweaxly can track which months you have data for and where the gaps are."
            cards={[
              { icon: <Building2 size={16} strokeWidth={1.7} />,     title: "Add a source",      body: "Add one for every account you track. Pick a type (bank, credit card, PayPal, payment processor), currency, and start month. Sources you no longer use can be archived to keep the picker clean." },
              { icon: <CalendarCheck size={16} strokeWidth={1.7} />, title: "Coverage matrix",   body: "A month-by-month grid showing which sources are uploaded for each month. Empty cells are missing data; filled cells show the number of transactions ingested. Use it to spot gaps before they distort your reports." },
              { icon: <HeartPulse size={16} strokeWidth={1.7} />,    title: "Health score",      body: "Each source gets a freshness score based on how recent its latest upload is. Sources that haven't been touched in 60+ days show up as Stale on the dashboard so the gaps stay visible." },
            ]}
            outro="Plaid-connected sources auto-update; manually-uploaded sources need a fresh statement each month. The Health Score widget on the dashboard surfaces sources that need attention."
          />
        }
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="data" />
      <SourcesClient currency={business.currency} />
    </>
  );
}
