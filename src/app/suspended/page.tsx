// Landing for users whose account has been suspended by an admin.
// Render-only - the suspension check lives in requireBusiness().
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function SuspendedPage() {
  await requireUser();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <div className="rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2 mb-4">
          Account suspended
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Your account has been temporarily suspended. Please contact support at
          {" "}<a href="mailto:support@tweaxly.com" className="text-accent hover:underline">support@tweaxly.com</a>{" "}
          to restore access.
        </p>
        <form action="/logout" method="post">
          <button className="btn-ghost w-full" type="submit">Sign out</button>
        </form>
        <div className="mt-3 text-xs text-slate-500">
          <Link href="/login" className="hover:text-slate-200">Switch account</Link>
        </div>
      </div>
    </div>
  );
}
