// The cross-workspace overview now lives inside Account →
// Workspaces. Old /workspaces deep links land on the Account page.
import { redirect } from "next/navigation";

export default function WorkspacesOverviewRedirect() {
  redirect("/account");
}
