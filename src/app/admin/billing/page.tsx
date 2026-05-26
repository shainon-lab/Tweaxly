// Admin · Billing. Global Polar order ledger across every workspace.
// Synced from the Polar webhook into our local PolarOrder table -
// this page reads only from local DB, never directly from Polar, so
// it stays fast even with thousands of rows.
//
// Auth: gated by /admin/layout.tsx's super_admin check; the API
// endpoint re-verifies via requireSuperAdminApi defense-in-depth.

import OrdersTable from "./OrdersTable";

export const dynamic = "force-dynamic";

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Billing · Orders</h1>
        <p className="text-xs text-slate-400 mt-1">
          Every Polar order across the platform - subscriptions, renewals,
          credit pack purchases, refunds. Search by customer email; download
          Polar invoice PDFs without leaving the admin.
        </p>
      </div>
      <OrdersTable />
    </div>
  );
}
