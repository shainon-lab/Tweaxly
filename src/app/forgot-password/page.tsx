// Forgot password form. Posts to /api/auth/forgot. The server returns
// the same neutral message regardless of whether the email exists, so
// nothing here exposes account existence.

import Link from "next/link";
import Logo from "@/components/Logo";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Reset your password</h1>
        <p className="text-sm text-slate-400 mb-4">
          Enter the email you signed up with. We&apos;ll send you a link to choose a new password.
        </p>
        {sent ? (
          <div className="mb-4 rounded-md border border-good/40 bg-good/10 text-good text-sm px-3 py-2">
            If this email exists in our system, a password reset link will be sent.
          </div>
        ) : null}
        <form action="/api/auth/forgot" method="post" className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required autoFocus />
          </div>
          <button className="btn-primary w-full" type="submit">Send reset link</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link href="/login" className="text-accent hover:underline">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
