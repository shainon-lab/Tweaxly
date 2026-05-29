import PageHeader from "@/components/PageHeader";
import DataHelp from "@/components/DataHelp";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import IntegrationClient from "./IntegrationClient";

export default async function IntegrationPage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title="Data - Integration"
        subtitle={t("page.integration.subtitle")}
        help={<DataHelp />}
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="data" />
      <IntegrationClient />
    </>
  );
}
