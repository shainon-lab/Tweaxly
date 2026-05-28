// Plain HTML form posting to a Route Handler. Server actions for auth had
// intermittent "Connection closed" failures on Vercel when iron-session's
// cookies().set() raced with redirect() - see /api/auth/login.

import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
// GOOGLE_SIGNIN: kept on disk - re-enable when Google credentials land.
// import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { getServerT } from "@/lib/i18n/server";

// Error codes that arrive on /login?err=… from auth route bounces.
// Mapped to plain-English copy so the user sees something actionable
// instead of a slug.
const ERROR_COPY: Record<string, string> = {
  google_unavailable:      "Google sign-in is not configured. Use email and password.",
  google_canceled:         "Google sign-in was canceled. Try again or use email and password.",
  google_missing_params:   "Google didn't return the expected response. Please try again.",
  google_state_mismatch:   "The sign-in link expired. Please try again.",
  google_exchange_failed:  "Google sign-in failed midway. Please try again.",
  google_email_unverified: "The Google account's email isn't verified. Verify it in Google first, then retry.",
};

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ err?: string; reset?: string; next?: string; email?: string }> }) {
  const { err, reset, next, email } = await searchParams;
  const { t } = await getServerT();
  // Only honour `next` if it's a same-origin path - prevents open-
  // redirect attacks where an attacker links to /login?next=https://evil.
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
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
            {ERROR_COPY[err] ?? t("auth.invalidCredentials")}
          </div>
        ) : null}

        {/* GOOGLE_SIGNIN: hidden in the UI for now per product
            decision. Backend (start + callback routes, helper, env
            var support, schema columns) remains live - flip this
            block back on once Google Cloud credentials are set up.
            Re-enable by uncommenting the block + the
            GoogleSignInButton import above.
        <GoogleSignInButton />
        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
          <span>or</span>
          <span className="flex-1 h-px bg-line" aria-hidden="true" />
        </div>
        */}

        {safeNext && safeNext.startsWith("/invite/") ? (
          <div className="mb-4 rounded-md border border-accent/40 bg-accent-soft/15 text-accent text-xs px-3 py-2 leading-relaxed">
            Sign in to accept your workspace invitation. We&apos;ll take you straight to the accept screen after login.
          </div>
        ) : null}
        <form action="/api/auth/login" method="post" className="space-y-4">
          {safeNext ? <input type="hidden" name="next" value={safeNext} /> : null}
          <div>
            <label className="label">{t("common.email")}</label>
            <input
              className="input"
              name="email"
              type="email"
              required
              autoFocus
              defaultValue={email ?? ""}
            />
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
