"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Settings, Bell, Shield, AlertTriangle } from "lucide-react"
import { SlothLogo } from "@/components/sloth-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useAdmin } from "./admin-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { LogoutButton } from "@/components/logout-button"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
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
          <a href="/dashboard" className="mt-4 inline-block text-primary underline">Return to Dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar variant="sidebar" collapsible="offcanvas">
          <SidebarHeader>
            <Link href="/admin" className="flex items-center gap-2">
              <SlothLogo size="sm" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                {routes.map((route) => (
                  <SidebarMenuItem key={route.href}>
                    <Link href={route.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === route.href}
                        variant={pathname === route.href ? "default" : "outline"}
                      >
                        <span className="flex items-center gap-2">
                          {route.icon}
                          <span>{route.label}</span>
                        </span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Mini Calendar</SidebarGroupLabel>
              <div className="px-2 pb-2">
                <Calendar mode="single" selected={new Date()} disabled />
              </div>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "Admin"} />
                ) : (
                  <AvatarFallback>{userInitials}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col text-xs">
                <span className="font-medium">{user?.displayName || "Admin"}</span>
                <span className="text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</span>
              </div>
              <div className="ml-auto">
                <LogoutButton variant="ghost" size="icon" />
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto bg-slate-50">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
