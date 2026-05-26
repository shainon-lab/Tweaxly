// /auth/verify-email
//
// Two roles:
//   1. Receiver for the link in the welcome email (?token=…). On
//      mount, hand the token to the API which validates + redirects
//      to /account/verified on success or back here with ?status=…
//      on failure. We render the loading + failure states; the
//      success state lives on /account/verified.
//   2. Status page that explains expired / invalid / already-verified
//      states when the API redirects back with the relevant ?status.
//
// Public route - no auth required (users may not have a session when
// they click the link, e.g. on a different browser).

import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";

type Search = {
  token?: string;
  status?: "invalid" | "expired" | "already_verified";
};

const STATUS_COPY: Record<NonNullable<Search["status"]>, { title: string; body: string }> = {
  invalid: {
    title: "Verification link not recognized",
    body:  "This link doesn't match a current verification token. It may have already been used, or the email might have been tampered with on the way through. Sign in and use the Resend button in the banner to get a fresh link.",
  },
  expired: {
    title: "This link has expired",
    body:  "Verification links are valid for 24 hours. Sign in and use the Resend button in the verify-email banner to get a fresh link.",
  },
  already_verified: {
    title: "Already verified",
    body:  "Your email is already verified. You can sign in and use the full platform.",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  // If the page is loaded directly with a token in the query (i.e.
  // straight from the email link), hand off to the API which does
  // the SHA-256 hash compare + redirect. The user only sees this
  // page if the API hits an error and redirects back with ?status.
  if (sp.token && !sp.status) {
    // Server-side redirect so the token leaves the URL as quickly
    // as possible. The API endpoint takes it from the query, then
    // redirects again to /account/verified or back here without it.
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(sp.token)}`);
  }

  const status = sp.status ?? "invalid";
  const copy   = STATUS_COPY[status];

  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="md" showTagline />
        </div>
        <h1 className="text-xl font-semibold text-slate-50 mb-2">{copy.title}</h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{copy.body}</p>
        <Link
          href="/login"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          Sign in to Tweaxly
        </Link>
      </div>
    </div>
  );
}
