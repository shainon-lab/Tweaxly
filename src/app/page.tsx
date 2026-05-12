import { redirect } from "next/navigation";
import { getOptionalContext } from "@/lib/auth";

export default async function Home() {
  const ctx = await getOptionalContext();
  if (!ctx) redirect("/login");
  if (!ctx.business) redirect("/setup");
  redirect("/dashboard");
}
