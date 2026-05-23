import PageHeader from "@/components/PageHeader";
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
        title={t("page.integration.title")}
        subtitle={t("page.integration.subtitle")}
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="data" />
      <IntegrationClient />
    </>
  );
}
