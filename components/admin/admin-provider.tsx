"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserRole, isSuperAdmin } from "@/lib/services/role-service"
import { useRouter } from "next/navigation"

interface AdminContextType {
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdminUser, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminStatus() {
      if (authLoading) return

      if (!user) {
        router.push("/login?callbackUrl=/admin")
        return
      }

      try {
        // Check if user is a super admin by email
        const superAdmin = await isSuperAdmin(user.email || "")
        setIsSuperAdmin(superAdmin)

        if (superAdmin) {
          setIsAdmin(true)
          setIsLoading(false)
          return
        }

        // Check user role
        const role = await getUserRole(user.uid)

        if (role === "admin" || role === "super_admin") {
          setIsAdmin(true)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, authLoading, router])

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isSuperAdmin: isSuperAdminUser,
        isLoading,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
