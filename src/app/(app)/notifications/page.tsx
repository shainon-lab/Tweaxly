// /notifications previously hosted the threshold-rule manager. It now
// lives under Business Signals → Alerts → Set Alerts. Keep this route
// as a redirect so any deep links (older bookmarks, in-app
// "Set notifications" CTAs) still land in the right place.

import { redirect } from "next/navigation";

export default function NotificationsRedirect() {
  redirect("/business-signals/alerts/settings");
}
