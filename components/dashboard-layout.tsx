"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, CalendarIcon, Target, Settings, Bell, Search, HelpCircle, MessageSquare, UserIcon, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { SlothLogo } from "@/components/sloth-logo"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { useAuth } from "@/contexts/auth-context"
import { NotificationsList } from "@/components/notifications-list"
import { getTasks } from "@/lib/services/task-service"
import { getEvents } from "@/lib/services/event-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"


interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { startListening } = useAIAssistant()
  const { user, isLoading } = useAuth()
  const [taskCount, setTaskCount] = React.useState<number | null>(null)
  const [eventCount, setEventCount] = React.useState<number | null>(null)
  const [hasUnreadNotifications, setHasUnreadNotifications] = React.useState(false)

  // Fetch task count for the badge
  React.useEffect(() => {
    async function fetchTaskCount() {
      if (user) {
        try {
          const tasks = await getTasks(user.uid)
          const incompleteTaskCount = tasks.filter((task) => !task.completed).length
          setTaskCount(incompleteTaskCount)
        } catch (error) {
          setTaskCount(null)
        }
      }
    }
    fetchTaskCount()
  }, [user])

  // Fetch upcoming events count for the badge
  React.useEffect(() => {
    async function fetchEventCount() {
      if (user) {
        try {
          const events = await getEvents(user.uid)
          const today = new Date()
          const upcomingEventCount = events.filter(
            (event) =>
              new Date(event.startTime) > today || new Date(event.endTime) > today
          ).length
          setEventCount(upcomingEventCount)
        } catch (error) {
          setEventCount(null)
        }
      }
    }
    fetchEventCount()
  }, [user])

  // Generate user initials
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U"

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/dashboard/tasks",
      label: "Tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      badge: taskCount !== null ? String(taskCount) : undefined,
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: <CalendarDays className="h-5 w-5" />,
      badge: eventCount !== null ? String(eventCount) : undefined,
    },
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      href: "/dashboard/goals",
      label: "Goals",
      icon: <Target className="h-5 w-5" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2">
              <SlothLogo showText size="sm" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {routes.map((route) => (
                    <SidebarMenuItem key={route.href}>
                      <Link href={route.href} className="w-full">
                        <SidebarMenuButton isActive={pathname === route.href}>
                          {route.icon}
                          <span>{route.label}</span>
                          {route.badge && (
                            <SidebarMenuBadge>{route.badge}</SidebarMenuBadge>
                          )}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <div className="mb-2">
              <Calendar mode="single" selected={new Date()} className="rounded-md border" />
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {user?.photoURL ? (
                      <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "User"} />
                    ) : (
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">{user?.displayName || "User"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <LogoutButton />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          {/* Top navigation */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 backdrop-blur-sm px-4 md:px-6">
            <div className="flex items-center md:w-56 md:flex-shrink-0">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-full bg-muted pl-8 md:max-w-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-foreground/70 hover:text-foreground"
                onClick={startListening}
                aria-label="AI Assistant"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <button type="button" className="text-foreground/70 hover:text-foreground" aria-label="Help">
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="relative">
                <Bell className="h-5 w-5 text-foreground/70" />
                {hasUnreadNotifications && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
                )}
                <div className="absolute right-0 mt-2 w-80 z-50">
                  <NotificationsList onHasUnreadChange={setHasUnreadNotifications} />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
