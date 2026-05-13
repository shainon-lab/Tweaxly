// /data-flow used to host the category × month grid; that view now lives
// on /report with ?view=grid. Keep the route as a redirect so older
// links and any in-app references still resolve.

import { redirect } from "next/navigation";

export default function DataFlowRedirect() {
  redirect("/report?view=grid");
}
