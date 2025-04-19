import type { Metadata } from "next"
import { NotificationsManagement } from "@/components/admin/notifications-management"

export const metadata: Metadata = {
  title: "Notifications | Admin | Sloth AI Planner",
  description: "Manage notifications in Sloth AI Planner",
}

export default function NotificationsPage() {
  return <NotificationsManagement />
}
