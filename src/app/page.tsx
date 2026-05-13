import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { requireBusiness } from "@/lib/auth";

// Landing route. Funnels every signed-in visitor through requireBusiness()
// so that:
//   - no session → /login
//   - signed in but no business yet → /setup
//   - signed in with at least one business → /dashboard (and the oldest
//     business is auto-selected if currentBusinessId wasn't already set on
//     the session — this is what makes a fresh login on an existing demo
//     account land on the dashboard with its data, instead of being pushed
//     into the new-business setup flow).
export default async function Home() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  await requireBusiness();
  redirect("/dashboard");
}
