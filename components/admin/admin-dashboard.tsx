"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdmin } from "./admin-provider"
import { getUserCountByRole } from "@/lib/services/user-management-service"
import { getModerationStats } from "@/lib/services/moderation-service"
import { getSystemSettings } from "@/lib/services/system-settings-service"
import Link from "next/link"
import { ArrowRight, Users, AlertTriangle, Settings, Shield } from "lucide-react"

export function AdminDashboard() {
  const { isSuperAdmin } = useAdmin()
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState({ user: 0, admin: 0, super_admin: 0 })
  const [moderationStats, setModerationStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [systemSettings, setSystemSettings] = useState<any>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [userCounts, modStats, sysSettings] = await Promise.all([
          getUserCountByRole(),
          getModerationStats(),
          getSystemSettings(),
        ])

        setUserStats(userCounts)
        setModerationStats(modStats)
        setSystemSettings(sysSettings)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500">Manage and monitor your Sloth AI Planner application.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={isLoading ? null : userStats.user + userStats.admin + userStats.super_admin}
          description="Registered users"
          icon={<Users className="h-5 w-5" />}
          href="/admin/users"
        />
        <StatsCard
          title="Admins"
          value={isLoading ? null : userStats.admin + userStats.super_admin}
          description="Admin users"
          icon={<Shield className="h-5 w-5" />}
          href="/admin/roles"
          disabled={!isSuperAdmin}
        />
        <StatsCard
          title="Pending Reports"
          value={isLoading ? null : moderationStats.pending}
          description="Content moderation"
          icon={<AlertTriangle className="h-5 w-5" />}
          href="/admin/moderation"
        />
        <StatsCard
          title="System Status"
          value={isLoading ? null : systemSettings?.maintenanceMode ? "Maintenance" : "Online"}
          description="System settings"
          icon={<Settings className="h-5 w-5" />}
          href="/admin/settings"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Regular Users</span>
                        <span className="text-sm text-slate-500">{userStats.user}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-slate-500 rounded-full dashboard-bar"
                          data-width={`${(userStats.user / (userStats.user + userStats.admin + userStats.super_admin)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Admins</span>
                        <span className="text-sm text-slate-500">{userStats.admin}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full dashboard-bar"
                          data-width={`${(userStats.admin / (userStats.user + userStats.admin + userStats.super_admin)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Super Admins</span>
                        <span className="text-sm text-slate-500">{userStats.super_admin}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full dashboard-bar"
                          data-width={`${(userStats.super_admin / (userStats.user + userStats.admin + userStats.super_admin)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Moderation Activity</CardTitle>
                <CardDescription>Content moderation statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending</span>
                        <span className="text-sm text-slate-500">{moderationStats.pending}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full dashboard-bar"
                          data-width={`${(moderationStats.pending / (moderationStats.pending + moderationStats.approved + moderationStats.rejected || 1)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Approved</span>
                        <span className="text-sm text-slate-500">{moderationStats.approved}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full dashboard-bar"
                          data-width={`${(moderationStats.approved / (moderationStats.pending + moderationStats.approved + moderationStats.rejected || 1)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rejected</span>
                        <span className="text-sm text-slate-500">{moderationStats.rejected}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full dashboard-bar"
                          data-width={`${(moderationStats.rejected / (moderationStats.pending + moderationStats.approved + moderationStats.rejected || 1)) * 100}%`}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Current system configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Site Name</span>
                    <p className="text-sm text-slate-500">{systemSettings?.siteName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Maintenance Mode</span>
                    <p className="text-sm text-slate-500">{systemSettings?.maintenanceMode ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Registration</span>
                    <p className="text-sm text-slate-500">
                      {systemSettings?.registrationEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Last Updated</span>
                    <p className="text-sm text-slate-500">{systemSettings?.updatedAt?.toLocaleDateString() || "N/A"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Activity log will be displayed here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number | string | null
  description: string
  icon: React.ReactNode
  href: string
  disabled?: boolean
}

function StatsCard({ title, value, description, icon, href, disabled = false }: StatsCardProps) {
  return (
    <Card className={cn(disabled && "opacity-70")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {value === null ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold">{value}</p>}
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <div className="rounded-full bg-slate-100 p-2">{icon}</div>
        </div>
        <div className="mt-4">
          <Button variant="link" className="p-0 h-auto text-sm" asChild disabled={disabled}>
            <Link href={disabled ? "#" : href}>
              View details <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
