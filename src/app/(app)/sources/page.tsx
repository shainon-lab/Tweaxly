import PageHeader from "@/components/PageHeader";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { requireBusiness } from "@/lib/auth";
import SourcesClient from "./SourcesClient";

export default async function SourcesPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Data"
        subtitle="Bank accounts, credit cards, PayPal and other places your money moves. Every imported file is tagged to a source so the coverage matrix can show you what's uploaded and what's still missing."
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="data" />
      <SourcesClient currency={business.currency} />
    </>
  );
}
