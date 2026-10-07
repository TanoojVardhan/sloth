"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MiniCalendar } from "./mini-calendar"
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Target, 
  CalendarDays, 
  Settings,
  ListTodo,
  CalendarCheck
} from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/schedule", label: "Schedule", icon: ListTodo },
  { href: "/calendar-integration", label: "Google Calendar", icon: CalendarCheck },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="rounded-lg border bg-card p-3">
        <h3 className="mb-2 text-sm font-semibold">Quick Calendar</h3>
        <MiniCalendar />
      </div>
    </div>
  )
}
