// /data → /manual-data redirect. Import Data is the first tab in the
// Data section, so the sidebar entry lands there. When a richer
// landing experience (Connected accounts, Sync status, Source health
// monitoring) is added later, this file becomes the real /data page
// and the sidebar can drop the redirect.

import { redirect } from "next/navigation";

export default function DataIndexPage() {
  redirect("/manual-data");
}
