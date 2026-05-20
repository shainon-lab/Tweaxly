// Plain HTML form posting to a Route Handler. Server actions for auth had
// intermittent "Connection closed" failures on Vercel when iron-session's
// cookies().set() raced with redirect() - see /api/auth/login.

import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { getServerT } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ err?: string; reset?: string }> }) {
  const { err, reset } = await searchParams;
  const { t } = await getServerT();
  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        {reset ? (
          <div className="mb-4 rounded-md border border-good/40 bg-good/10 text-good text-sm px-3 py-2">
            {t("auth.resetSuccess")}
          </div>
        ) : null}
        {err ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            {t("auth.invalidCredentials")}
          </div>
        ) : null}
        <form action="/api/auth/login" method="post" className="space-y-4">
          <div>
            <label className="label">{t("common.email")}</label>
            <input className="input" name="email" type="email" required autoFocus />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="label">{t("common.password")}</label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <PasswordInput name="password" required />
          </div>
          <button className="btn-primary w-full" type="submit">{t("auth.signIn")}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-accent hover:underline">{t("auth.create")}</Link>
        </div>
      </div>
    </div>
  );
}
