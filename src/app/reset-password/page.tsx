// Reset-password form. Validates the token's bare presence + format
// before rendering the inputs; full validity (not expired, not used)
// is re-checked server-side when the form submits.

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/passwordReset";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

const ERROR_MESSAGE: Record<string, string> = {
  invalid:  "This reset link is invalid. Request a new one from the forgot-password page.",
  expired:  "This reset link has expired. Request a new one from the forgot-password page.",
  used:     "This reset link has already been used. Request a new one if you still need to reset.",
  mismatch: "The two passwords don't match.",
  weak:     "Pick a stronger password (at least 6 characters).",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; err?: string }>;
}) {
  const { token, err } = await searchParams;
  if (!token) redirect("/forgot-password");

  // Quick liveness check so we don't show the form for a token that
  // can never succeed. Final validation still happens on POST.
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, expiresAt: true, usedAt: true },
  });
  const tokenLooksBad =
    !row || row.usedAt != null || row.expiresAt.getTime() < Date.now();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Choose a new password</h1>
        <p className="text-sm text-slate-400 mb-4">
          Pick a password you haven&apos;t used before. At least 6 characters.
        </p>
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
            {ERROR_MESSAGE[err] ?? "Something went wrong. Try again."}
          </div>
        ) : null}
        {!tokenLooksBad ? (
          <form action="/api/auth/reset" method="post" className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label">New password</label>
              <PasswordInput name="password" required autoFocus minLength={6} />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <PasswordInput name="confirmPassword" required minLength={6} />
            </div>
            <button className="btn-primary w-full" type="submit">Update password</button>
          </form>
        ) : (
          <Link href="/forgot-password" className="btn-ghost w-full">
            Request a new reset link
          </Link>
        )}
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link href="/login" className="text-accent hover:underline">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
