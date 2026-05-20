import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/passwordReset";
import { getServerT } from "@/lib/i18n/server";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; err?: string }>;
}) {
  const { token, err } = await searchParams;
  if (!token) redirect("/forgot-password");
  const { t } = await getServerT();

  const ERROR_MESSAGE: Record<string, string> = {
    invalid:  t("reset.invalid"),
    expired:  t("reset.expired"),
    used:     t("reset.used"),
    mismatch: t("reset.mismatch"),
    weak:     t("reset.weak"),
  };

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, expiresAt: true, usedAt: true },
  });
  const tokenLooksBad =
    !row || row.usedAt != null || row.expiresAt.getTime() < Date.now();

  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">{t("reset.title")}</h1>
        <p className="text-sm text-slate-400 mb-4">{t("reset.subtitle")}</p>
        {tokenLooksBad ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            {row?.usedAt
              ? ERROR_MESSAGE.used
              : row && row.expiresAt.getTime() < Date.now()
              ? ERROR_MESSAGE.expired
              : ERROR_MESSAGE.invalid}
          </div>
        ) : null}
        {err && !tokenLooksBad ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            {ERROR_MESSAGE[err] ?? t("errors.generic")}
          </div>
        ) : null}
        {!tokenLooksBad ? (
          <form action="/api/auth/reset" method="post" className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label">{t("reset.newPassword")}</label>
              <PasswordInput name="password" required autoFocus minLength={6} />
            </div>
            <div>
              <label className="label">{t("reset.confirmPassword")}</label>
              <PasswordInput name="confirmPassword" required minLength={6} />
            </div>
            <button className="btn-primary w-full" type="submit">{t("reset.update")}</button>
          </form>
        ) : (
          <Link href="/forgot-password" className="btn-ghost w-full">
            {t("reset.requestNew")}
          </Link>
        )}
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link href="/login" className="text-accent hover:underline">{t("forgot.backToLogin")}</Link>
        </div>
      </div>
    </div>
  );
}
