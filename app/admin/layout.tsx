import type { ReactNode } from "react"
import { AdminProvider } from "@/components/admin/admin-provider"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminProvider>
  )
}
