// Fallback workspace creator. The standard signup flow now creates the
// business inline in /api/auth/register and drops the user straight at
// /dashboard, so this page is only reached when:
//   - A super_admin (or future invited collaborator) signs in without
//     a business and requireBusiness() redirects them here.
//   - A signup transaction failed mid-flight and left a User without a
//     Business - rare, but recoverable from here.
//
// Defaults match the register route: USD, no VAT, January fiscal year.
// All of that is editable in Settings → Business profile.

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

async function createBusinessAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const business = await prisma.business.create({
    data: {
      ownerId: session.userId,
      name,
      currency: "USD",
      fiscalStartMonth: 1,
      vatEnabled: false,
      vatRate: 0,
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({
          name: c.name, kind: c.kind, isOneTime: !!c.isOneTime,
        })),
      },
      memberships: {
        create: { userId: session.userId, role: "account_admin", joinedAt: new Date() },
      },
    },
  });
  session.currentBusinessId = business.id;
  await session.save();
  redirect("/dashboard");
}

export default async function SetupPage() {
  await requireUser();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Name your workspace</div>
          <div className="text-sm text-slate-400 mt-1">
            One quick step. Currency, fiscal year, and VAT can be configured from Settings later.
          </div>
        </div>
        <form action={createBusinessAction} className="space-y-4">
          <div>
            <label className="label">Business name</label>
            <input className="input" name="name" required autoFocus placeholder="e.g. Acme Co." />
          </div>
          <button className="btn-primary w-full" type="submit">Create workspace</button>
        </form>
      </div>
    </div>
  );
}
