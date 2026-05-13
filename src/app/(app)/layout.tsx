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
        {/* pt-16 on mobile leaves room for the floating hamburger button
            (sidebar lives behind a drawer below the lg breakpoint). */}
        <div className="px-4 sm:px-6 lg:px-8 pt-16 pb-6 lg:py-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
