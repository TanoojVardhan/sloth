"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getUserRole, isSuperAdmin } from "@/lib/services/role-service"

export function useAdminAuth(requiredRole: "admin" | "super_admin" = "admin") {
  const { user, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthorization() {
      if (isLoading) return

      if (!user) {
        router.push("/login?callbackUrl=/admin")
        return
      }

      try {
        // Check if user is a super admin by email
        if (requiredRole === "super_admin") {
          const superAdmin = await isSuperAdmin(user.email || "")
          if (superAdmin) {
            setIsAuthorized(true)
            setIsCheckingAuth(false)
            return
          }
        }

        // Check user role
        const role = await getUserRole(user.uid)

        if (
          (requiredRole === "admin" && (role === "admin" || role === "super_admin")) ||
          (requiredRole === "super_admin" && role === "super_admin")
        ) {
          setIsAuthorized(true)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin authorization:", error)
        router.push("/dashboard")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthorization()
  }, [user, isLoading, router, requiredRole])

  return { isAuthorized, isCheckingAuth }
}
