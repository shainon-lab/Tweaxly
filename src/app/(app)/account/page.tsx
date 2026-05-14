import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Account"
        subtitle="Billing, payment methods, password, security, and account closure."
      />
      <AccountClient
        user={{
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </>
  );
}
