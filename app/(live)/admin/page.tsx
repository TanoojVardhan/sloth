import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard | Sloth AI Planner",
  description: "Admin dashboard for Sloth AI Planner",
}

export default function AdminPage() {
  return <AdminDashboard />
}
