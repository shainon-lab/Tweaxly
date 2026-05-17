import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await requireUser();
  const { t } = await getServerT();
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
        }}
      />
    </>
  );
}
