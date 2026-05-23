import PageHeader from "@/components/PageHeader";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { requireBusiness } from "@/lib/auth";
import SourcesClient from "./SourcesClient";

export default async function SourcesPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Financial sources"
        subtitle="Bank accounts, credit cards, PayPal and other places your money moves. Every imported file is tagged to a source so the coverage matrix can show you what's uploaded and what's still missing."
      />
      <BusinessSettingsTabs />
      <SourcesClient currency={business.currency} />
    </>
  );
}
