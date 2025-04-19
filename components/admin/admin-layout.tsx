"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Settings, Bell, Shield, Menu, X, LogOut, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SlothLogo } from "@/components/sloth-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useAdmin } from "./admin-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { LogoutButton } from "@/components/logout-button"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const { isAdmin, isSuperAdmin, isLoading } = useAdmin()

  // Generate user initials
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "A"

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const routes = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/notifications",
      label: "Notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      href: "/admin/moderation",
      label: "Content Moderation",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      href: "/admin/settings",
      label: "System Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Add super admin route if user is super admin
  if (isSuperAdmin) {
    routes.push({
      href: "/admin/roles",
      label: "Role Management",
      icon: <Shield className="h-5 w-5" />,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-slate-500">You do not have permission to access this area.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="bg-white/90 backdrop-blur-sm"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-slate-800 px-6">
            <Link href="/admin" className="flex items-center space-x-2">
              <SlothLogo size="sm" />
              <span className="font-bold text-white">Admin Panel</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === route.href
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  {route.icon}
                  <span className="ml-3">{route.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  {user?.photoURL ? (
                    <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "Admin"} />
                  ) : (
                    <AvatarFallback className="bg-slate-700">{userInitials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-white">{user?.displayName || "Admin"}</p>
                  <p className="text-xs text-slate-400">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
                </div>
              </div>
              <LogoutButton variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <LogOut className="h-5 w-5" />
              </LogoutButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
