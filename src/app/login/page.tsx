import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import Link from "next/link";
import Logo from "@/components/Logo";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return;
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ err?: string }> }) {
  const _ = await searchParams; void _;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showTagline />
        </div>
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" name="password" type="password" required />
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
