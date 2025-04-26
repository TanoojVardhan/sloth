import type { Metadata } from "next"
import TaskList from "@/components/task-list"
import Calendar from "@/components/calendar"
import { GoalTracker } from "@/components/goal-tracker"
import { ProjectIdeas } from "@/components/project-ideas"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WelcomeBanner } from "@/components/welcome-banner"
import { VerificationBanner } from "@/components/verification-banner"
import { ActivityFeed } from "@/components/activity-feed"
import { QuickActions } from "@/components/quick-actions"
import { SiteFooter } from "@/components/site-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Set dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard | Sloth AI Planner",
  description: "Manage your tasks, schedule, and goals with Sloth AI Planner",
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <DashboardShell className="container py-6">
          <WelcomeBanner />
          <div className="my-4">
            <VerificationBanner />
          </div>
          <DashboardHeader heading="Dashboard" text="Manage your tasks, schedule, and goals">
            <QuickActions />
          </DashboardHeader>
          
          <div className="grid gap-6 md:grid-cols-7">
            <div className="md:col-span-5 space-y-6">
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="projects">Project Ideas</TabsTrigger>
                </TabsList>
                <TabsContent value="tasks">
                  <TaskList />
                </TabsContent>
                <TabsContent value="goals">
                  <GoalTracker />
                </TabsContent>
                <TabsContent value="projects">
                  <ProjectIdeas />
                </TabsContent>
              </Tabs>
              
              <div className="grid gap-6 md:grid-cols-2">
                <ActivityFeed />
                <div className="md:block hidden">
                  {/* Additional dashboard widget could go here */}
                </div>
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
  )
}
