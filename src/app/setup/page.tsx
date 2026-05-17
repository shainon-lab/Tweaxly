import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import SetupCurrencyField from "./SetupCurrencyField";

async function createBusinessAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").trim().toUpperCase();
  const fiscalStartMonth = Number(formData.get("fiscalStartMonth") ?? 1) || 1;
  const vatEnabled = formData.get("vatEnabled") === "on";
  const vatRate = vatEnabled ? Number(formData.get("vatRate") ?? 0) : 0;
  if (!name) return;
  const business = await prisma.business.create({
    data: {
      ownerId: session.userId,
      name,
      currency,
      fiscalStartMonth,
      vatEnabled,
      vatRate,
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({
          name: c.name, kind: c.kind, isOneTime: !!c.isOneTime,
        })),
      },
      // First-class multi-tenancy: every new business gets a membership
      // for its creator with the account_admin role. Future invitees
      // attach via additional BusinessMembership rows.
      memberships: {
        create: { userId: session.userId, role: "account_admin" },
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
      <div className="card w-full max-w-2xl">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Set up your business</div>
          <div className="text-sm text-slate-400">You can change all of this later from settings.</div>
        </div>
        <form action={createBusinessAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Business name</label>
            <input className="input" name="name" required autoFocus />
          </div>
          <div>
            <label className="label">Currency</label>
            <SetupCurrencyField />
          </div>
          <div>
            <label className="label">Fiscal year starts in</label>
            <select className="input" name="fiscalStartMonth" defaultValue="1">
              {Array.from({length:12}).map((_,i)=>{
                const m = i+1;
                const lbl = new Date(Date.UTC(2024, i, 1)).toLocaleString("en-US",{month:"long"});
                return <option key={m} value={m}>{lbl}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" name="vatEnabled" id="vat" className="size-4" />
            <label htmlFor="vat" className="text-sm">Track VAT</label>
          </div>
          <div>
            <label className="label">VAT rate %</label>
            <input className="input" name="vatRate" type="number" step="0.1" defaultValue="0" />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <button className="btn-primary" type="submit">Create workspace</button>
          </div>
        </form>
      </div>
    </div>
  );
}
