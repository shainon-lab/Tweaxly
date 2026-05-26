import Link from "next/link";
import Logo from "@/components/Logo";
import { getServerT } from "@/lib/i18n/server";
import RegisterForm from "./RegisterForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default async function RegisterPage({
  searchParams,
}: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const { t } = await getServerT();
  const isDupe = err === "exists";
  const errorMsg =
    isDupe         ? t("auth.duplicateEmail") :
    err === "terms" ? "You must accept the Terms of Service to create an account." :
    err            ? t("auth.weakSignup")     :
    null;
  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
          <div className="text-sm text-slate-400 mt-4 text-center">
            {t("auth.createAccount")} - one workspace per business owner.
          </div>
        </div>
        {errorMsg ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            <div>{errorMsg}</div>
            {isDupe ? (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <Link href="/login" className="text-accent hover:underline">{t("auth.signIn")} →</Link>
                <Link href="/forgot-password" className="text-accent hover:underline">{t("auth.forgotPassword")} →</Link>
              </div>
            ) : null}
          </div>
        ) : null}
        {/* "Continue with Google" sits above the form per the auth
            spec. Google flow auto-verifies the email so the user
            skips the welcome-email step entirely. */}
        <GoogleSignInButton />
        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
          <span>or</span>
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
        </div>

        <RegisterForm
          labels={{
            businessName: t("auth.businessName"),
            yourName:     t("auth.yourName"),
            email:        t("common.email"),
            passwordHint: t("auth.passwordMinHint"),
            create:       t("auth.createAccount"),
          }}
        />
        <div className="mt-4 text-center text-sm text-slate-400">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">{t("auth.signIn")}</Link>
        </div>
      </div>
    </div>
  );
}
