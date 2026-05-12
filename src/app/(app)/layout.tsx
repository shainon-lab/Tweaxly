import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { requireBusiness } from "@/lib/auth";
import { getSidebarAlerts } from "@/lib/alerts";

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await requireBusiness();
  return {
    title: business.name,
    icons: business.faviconData ? { icon: business.faviconData } : undefined,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireBusiness();
  const alerts = await getSidebarAlerts(business.id);
  return (
    // Lock the outer container to the viewport height and make only the main
    // area scroll — the sidebar stays put no matter how long the page is.
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        businessName={business.name}
        logoData={business.logoData ?? null}
        alerts={alerts}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-8 py-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
