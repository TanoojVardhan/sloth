"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  CheckSquare,
  CalendarIcon,
  Target,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  HelpCircle,
  MessageSquare,
  UserIcon,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SlothLogo } from "@/components/sloth-logo"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useMobile } from "@/hooks/use-mobile"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { LogoutButton } from "@/components/logout-button"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsList } from "@/components/notifications-list"
import { getTasks } from "@/lib/services/task-service"
import { getEvents } from "@/lib/services/event-service"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskCount, setTaskCount] = useState<number | null>(null)
  const [eventCount, setEventCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const pathname = usePathname()
  const isMobile = useMobile()
  const { startListening } = useAIAssistant()
  const { user, isLoading } = useAuth()

  // Fetch task count for the badge
  useEffect(() => {
    async function fetchTaskCount() {
      if (user) {
        try {
          const tasks = await getTasks(user.uid)
          // Only count incomplete tasks
          const incompleteTaskCount = tasks.filter((task) => !task.completed).length
          setTaskCount(incompleteTaskCount)
        } catch (error) {
          console.error("Error fetching task count:", error)
          // If there's an error, don't show the badge
          setTaskCount(null)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchTaskCount()
  }, [user])

  // Fetch upcoming events count for the badge
  useEffect(() => {
    async function fetchEventCount() {
      if (user) {
        try {
          const events = await getEvents(user.uid)
          // Count upcoming events (events that haven't passed)
          const today = new Date()
          const upcomingEventCount = events.filter(
            (event) =>
              new Date(event.startTime) > today || new Date(event.endTime) > today
          ).length
          setEventCount(upcomingEventCount)
        } catch (error) {
          console.error("Error fetching event count:", error)
          // If there's an error, don't show the badge
          setEventCount(null)
        }
      }
    }

    fetchEventCount()
  }, [user])

  // Handle unread notifications status
  const handleUnreadNotificationsChange = useCallback((hasUnread: boolean) => {
    setHasUnreadNotifications(hasUnread)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar")
      const toggleButton = document.getElementById("sidebar-toggle")

      // Don't close if clicking on the toggle button
      if (toggleButton && toggleButton.contains(event.target as Node)) {
        return
      }

      // Close if clicking outside the sidebar
      if (isMobile && sidebar && !sidebar.contains(event.target as Node) && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, sidebarOpen])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Toggle sidebar safely
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prevState) => !prevState)
  }, [])

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
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          id="sidebar-toggle"
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="bg-white/90 backdrop-blur-sm"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar overlay - only visible on mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white/90 backdrop-blur-sm shadow-lg transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <SlothLogo showText size="sm" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === route.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center">
                    {route.icon}
                    <span className="ml-3">{route.label}</span>
                  </div>
                  {route.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {route.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div className="flex flex-col items-start gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-8 w-8 mr-2">
                        {user?.photoURL ? (
                          <AvatarImage
                            src={user.photoURL || "/placeholder.svg"}
                            alt={user.displayName || "User"}
                          />
                        ) : (
                          <AvatarFallback>{userInitials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col items-start text-sm">
                        <span className="font-medium">{user?.displayName || "User"}</span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email || "user@example.com"}
                        </span>
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
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
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/70"
              onClick={startListening}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">AI Assistant</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground/70">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground/70">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                  {hasUnreadNotifications && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <NotificationsList onHasUnreadChange={handleUnreadNotificationsChange} />
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center font-medium">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </>
                    ) : (
                      <>
                        <Avatar className="h-6 w-6">
                          {user?.photoURL ? (
                            <AvatarImage
                              src={user.photoURL || "/placeholder.svg"}
                              alt={user.displayName || "User"}
                            />
                          ) : (
                            <AvatarFallback>{userInitials}</AvatarFallback>
                          )}
                        </Avatar>
                        <span>{user?.displayName?.split(" ")[0] || "User"}</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
