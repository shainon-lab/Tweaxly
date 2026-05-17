// Plain HTML form posting to a Route Handler. See /api/auth/register for
// the reason this isn't a server action.

import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

export default async function RegisterPage({
  searchParams,
}: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const isDupe = err === "exists";
  const errorMsg =
    isDupe ? "An account with this email already exists. Please log in or reset your password." :
    err    ? "Please enter a valid email and a password of at least 6 characters." :
    null;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
          <div className="text-sm text-slate-400 mt-4 text-center">
            Create your account — one workspace per business owner.
          </div>
        </div>
        {errorMsg ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            <div>{errorMsg}</div>
            {isDupe ? (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <Link href="/login" className="text-accent hover:underline">Log in →</Link>
                <Link href="/forgot-password" className="text-accent hover:underline">Reset password →</Link>
              </div>
            ) : null}
          </div>
        ) : null}
        <form action="/api/auth/register" method="post" className="space-y-4">
          <div>
            <label className="label">Name (optional)</label>
            <input className="input" name="name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Password (min 6 chars)</label>
            <PasswordInput name="password" required minLength={6} />
          </div>
          <button className="btn-primary w-full" type="submit">Create account</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
