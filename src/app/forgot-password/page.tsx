import Link from "next/link";
import Logo from "@/components/Logo";
import { getServerT } from "@/lib/i18n/server";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const { t } = await getServerT();
  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">{t("forgot.title")}</h1>
        <p className="text-sm text-slate-400 mb-4">{t("forgot.subtitle")}</p>
        {sent ? (
          <div className="mb-4 rounded-md border border-good/40 bg-good/10 text-good text-sm px-3 py-2">
            {t("forgot.sentMessage")}
          </div>
        ) : null}
        <form action="/api/auth/forgot" method="post" className="space-y-4">
          <div>
            <label className="label">{t("common.email")}</label>
            <input className="input" name="email" type="email" required autoFocus />
          </div>
          <button className="btn-primary w-full" type="submit">{t("forgot.sendLink")}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link href="/login" className="text-accent hover:underline">{t("forgot.backToLogin")}</Link>
        </div>
      </div>
    </div>
  );
}
