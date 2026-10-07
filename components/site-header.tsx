"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

// Shown only to signed-out visitors (marketing pages, login, signup).
// Once a user is signed in, AppChrome hands off to the (app) route group's
// own sidebar layout instead, so this stays a simple, single top bar.
export function SiteHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
          <Image src="/sloth-planner-logo.png" alt="Sloth Planner" width={36} height={36} className="rounded-lg" />
          <div className="hidden sm:flex flex-col">
            <span className="font-serif text-lg font-semibold text-foreground">Sloth Planner</span>
            <span className="text-xs text-muted-foreground">Stay Organized</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!loading && !user && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
