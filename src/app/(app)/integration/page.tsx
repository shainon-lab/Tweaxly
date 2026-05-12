import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import IntegrationClient from "./IntegrationClient";

export default async function IntegrationPage() {
  await requireBusiness();
  return (
    <>
      <PageHeader
        title="Integration"
        subtitle="Pull data from your tools automatically — no more CSV exports."
      />
      <IntegrationClient />
    </>
  );
}
