import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import DataTabs from "@/components/DataTabs";
import ReviewBanner from "@/components/ReviewBanner";
import { getServerT } from "@/lib/i18n/server";
import { requireBusiness } from "@/lib/auth";
import IntegrationClient from "./IntegrationClient";
import { Plug, Lock, Activity } from "lucide-react";

export default async function IntegrationPage() {
  const { business } = await requireBusiness();
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("page.integration.title")}
        subtitle={t("page.integration.subtitle")}
        help={
          <HowItWorks
            title="How integrations work"
            intro="Direct connections to your financial systems instead of monthly CSV uploads. Once linked, transactions and balances sync automatically into the same place uploaded data lands - so every signal, forecast, and report sees the new activity within minutes."
            cards={[
              { icon: <Plug size={16} strokeWidth={1.7} />,     title: "Connect once",     body: "Plaid for bank and credit-card accounts (US, more regions soon). Stripe / PayPal / QuickBooks / Xero on the roadmap. Each integration links inside a few clicks." },
              { icon: <Lock size={16} strokeWidth={1.7} />,     title: "Strictly read-only", body: "Tweaxly NEVER moves money, NEVER stores your credentials, and NEVER acts as a financial institution. We only read transactions and balances. Connections can be revoked from this page at any time." },
              { icon: <Activity size={16} strokeWidth={1.7} />, title: "Automatic syncs",  body: "After the initial sync, new transactions arrive automatically. The Refresh button on each connection runs an on-demand pull when you want the very latest." },
            ]}
            outro="Don't see an integration you want? Continue uploading CSVs for that source for now and request the integration - we ship them based on demand."
          />
        }
      />
      <DataTabs />
      <ReviewBanner businessId={business.id} surface="data" />
      <IntegrationClient />
    </>
  );
}
