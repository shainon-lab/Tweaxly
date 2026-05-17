// Plain HTML form posting to a Route Handler. Server actions for auth had
// intermittent "Connection closed" failures on Vercel when iron-session's
// cookies().set() raced with redirect() — see /api/auth/login.

import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ err?: string; reset?: string }> }) {
  const { err, reset } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        {reset ? (
          <div className="mb-4 rounded-md border border-good/40 bg-good/10 text-good text-sm px-3 py-2">
            Your password has been updated. You can now log in.
          </div>
        ) : null}
        {err ? (
          <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">
            Email or password didn&apos;t match. Try again.
          </div>
        ) : null}
        <form action="/api/auth/login" method="post" className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required autoFocus />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="label">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput name="password" required />
          </div>
          <button className="btn-primary w-full" type="submit">Sign in</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
}
