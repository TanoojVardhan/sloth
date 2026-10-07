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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
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
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="flex min-h-screen">
      <NotificationManager />
      <CommandPalette />
      <OccupationOnboarding />
      <TimetableAutoSync />
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile off-canvas sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top strip — just a menu trigger, not a full nav bar */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <Button variant="outline" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-serif text-lg font-semibold text-foreground">Sloth Planner</span>
          <ThemeToggle />
        </div>

        <main className="flex-1 bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
