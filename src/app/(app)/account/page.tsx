import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { detectIpCountry } from "@/lib/geoip";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await requireUser();
  const { t } = await getServerT();
  // IP-derived region - used as a default when User.region is null
  // so the picker arrives pre-filled. The user can override it.
  const detectedRegion = detectIpCountry();
  return (
    <>
      <PageHeader
        title={t("account.title")}
        subtitle={t("account.subtitle")}
      />
      <AccountClient
        user={{
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          preferredLanguage: user.preferredLanguage,
          region: user.region,
          detectedRegion,
        }}
      />
    </>
  );
}
