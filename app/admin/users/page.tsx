import type { Metadata } from "next"
import { UserManagement } from "@/components/admin/user-management"

export const metadata: Metadata = {
  title: "User Management | Admin | Sloth AI Planner",
  description: "Manage users in Sloth AI Planner",
}

export default function UserManagementPage() {
  return <UserManagement />
}
