"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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

  return (
    <div
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Logo/Brand */}
      <Link href="/dashboard" className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <Image src="/sloth-planner-logo.png" alt="" width={32} height={32} className="rounded-lg" />
        <div>
          <h1 className="font-serif text-base font-semibold leading-tight">Sloth Planner</h1>
          <p className="text-xs text-sidebar-foreground/60">Stay organized, unhurried</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            openCommandPalette()
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-background/60 px-4 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
        >
          <Search className="h-4 w-4" />
          Search
          <kbd className="ml-auto rounded border border-sidebar-border px-1.5 text-[10px]">Ctrl K</kbd>
        </button>
        {[
          ...nav.slice(0, 3),
          ...studentNav.filter((n) => hasTool(user?.occupation, n.tool)),
          ...nav.slice(3),
        ].map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Settings */}
      <div className="space-y-2 border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary/20">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="" width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>

        <Button onClick={logout} variant="outline" className="w-full justify-start gap-3" size="sm">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
