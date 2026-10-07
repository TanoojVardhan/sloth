"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

/**
 * Picks the site's outer chrome based on auth state. Signed-out visitors get
 * the marketing top bar + footer; once signed in, the (app) route group's
 * own sidebar layout takes over completely, so we step out of the way here
 * rather than stacking a top bar on top of the sidebar.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <>{children}</>
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
