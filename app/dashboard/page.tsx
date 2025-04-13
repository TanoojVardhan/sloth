import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard-layout"
import TaskList from "@/components/task-list"
import Calendar from "@/components/calendar"
import GoalTracker from "@/components/goal-tracker"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WelcomeBanner } from "@/components/welcome-banner"
import { ActivityFeed } from "@/components/activity-feed"
import { QuickActions } from "@/components/quick-actions"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Dashboard | Sloth AI Planner",
  description: "Manage your tasks, schedule, and goals with Sloth AI Planner",
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <DashboardShell className="container py-6">
            <WelcomeBanner />
            <DashboardHeader heading="Dashboard" text="Manage your tasks, schedule, and goals">
              <QuickActions />
            </DashboardHeader>
            <div className="grid gap-6 md:grid-cols-7">
              <div className="md:col-span-5 space-y-6">
                <TaskList />
                <div className="grid gap-6 md:grid-cols-2">
                  <GoalTracker />
                  <ActivityFeed />
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <Calendar />
              </div>
            </div>
          </DashboardShell>
        </div>
        <SiteFooter />
      </div>
    </DashboardLayout>
  )
}
