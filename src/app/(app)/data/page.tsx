// /data → /sources redirect. The Data sidebar entry currently lands
// on the Sources tab; the section's full tab nav lives in DataTabs.
// When a richer landing experience (Connected accounts, Sync status,
// Source health monitoring) is added later, this file becomes the
// real /data page and the sidebar can drop the redirect.

import { redirect } from "next/navigation";

export default function DataIndexPage() {
  redirect("/sources");
}
