import PageHeader from "@/components/PageHeader";
import DataTabs from "@/components/DataTabs";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import IntegrationClient from "./IntegrationClient";

export default async function IntegrationPage() {
  await requireBusiness();
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("page.integration.title")}
        subtitle={t("page.integration.subtitle")}
      />
      <DataTabs />
      <IntegrationClient />
    </>
  );
}
