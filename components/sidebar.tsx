"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { useAuth } from "./auth-provider"
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Target,
  CalendarDays,
  Settings,
  ListTodo,
  LogOut,
  User,
  Folder,
  NotebookPen,
  Search,
  Timer,
  GraduationCap,
  ClipboardList,
  BarChart3,
  ShieldCheck,
} from "lucide-react"
import { openCommandPalette } from "./command-palette"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"
import { hasTool } from "@/lib/student"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/schedule", label: "Schedule", icon: ListTodo },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/insights", label: "Insights", icon: BarChart3 },
]

// Shown only for occupations that use them (set in Settings).
const studentNav = [
  { href: "/timetable", label: "Timetable", icon: GraduationCap, tool: "timetable" as const },
  { href: "/assignments", label: "Assignments", icon: ClipboardList, tool: "assignments" as const },
]

interface SidebarProps {
  className?: string
  /** Called after a nav link is clicked — used to close the mobile sheet. */
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  // The server decides who is an admin (ADMIN_EMAILS); everyone else just never gets the link.
  useEffect(() => {
    if (!user) return setIsAdmin(false)
    void (async () => {
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
          body: JSON.stringify({ action: "me" }),
        })
        setIsAdmin(res.ok)
      } catch {
        setIsAdmin(false)
      }
    })()
  }, [user])

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-full px-3.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    )

  return (
    <div
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-5 pb-4 pt-6">
        <Image src="/sloth-planner-logo.png" alt="" width={36} height={36} className="rounded-xl" />
        <div>
          <div className="font-display text-lg font-semibold leading-tight">Sloth Planner</div>
          <p className="text-xs text-sidebar-foreground/55">Stay organized, unhurried</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            openCommandPalette()
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-full bg-sidebar-accent/70 px-3.5 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Search className="h-4 w-4" />
          Search
          <kbd className="ml-auto rounded-md border border-sidebar-border px-1.5 font-sans text-[10px]">Ctrl K</kbd>
        </button>
        {[
          ...nav.slice(0, 3),
          ...studentNav.filter((n) => hasTool(user?.occupation, n.tool)),
          ...nav.slice(3),
        ].map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={linkClass(isActive)}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        {isAdmin && (
          <Link href="/admin" onClick={onNavigate} className={linkClass(pathname === "/admin")}>
            <ShieldCheck className="h-[18px] w-[18px]" />
            Admin
          </Link>
        )}
        <Link href="/settings" onClick={onNavigate} className={linkClass(pathname === "/settings")}>
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>

        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-accent">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="" width={36} height={36} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{user?.email}</p>
          </div>
          <ThemeToggle className="size-8 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-transparent" />
          <Button
            onClick={logout}
            variant="ghost"
            size="icon-sm"
            aria-label="Log out"
            title="Log out"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
