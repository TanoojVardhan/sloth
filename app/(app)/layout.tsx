"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationManager } from "@/components/notification-manager"
import { CommandPalette } from "@/components/command-palette"
import { OccupationOnboarding } from "@/components/occupation-picker"
import { TimetableAutoSync } from "@/components/timetable-auto-sync"
import { E2eeGate } from "@/components/e2ee-gate"
import { MfaGate } from "@/components/mfa"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, dataReady, mfa } = useAuth()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Opening your planner…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="flex min-h-screen">
      {dataReady && (
        <>
          <NotificationManager />
          <CommandPalette />
          <OccupationOnboarding />
          <TimetableAutoSync />
        </>
      )}
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile off-canvas sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top strip — just a menu trigger, not a full nav bar */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display text-lg font-semibold text-foreground">Sloth Planner</span>
          <ThemeToggle />
        </div>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-9 lg:px-10">{dataReady ? children : mfa === "pending" ? <MfaGate /> : <E2eeGate />}</div>
        </main>
      </div>
    </div>
  )
}
