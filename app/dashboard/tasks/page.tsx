import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import TaskList from "@/components/task-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Plus, Filter, ArrowUpDown } from "lucide-react"
import { QuickActions } from "@/components/quick-actions"

export const metadata: Metadata = {
  title: "Tasks | Sloth AI Planner",
  description: "Manage your tasks with Sloth AI Planner",
}

export default function TasksPage() {
  return (
    
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <DashboardShell className="container py-6">
            <DashboardHeader heading="Tasks" text="Manage and organize all your tasks">
              <QuickActions />
            </DashboardHeader>
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </div>
              </div>
              <TabsContent value="all" className="mt-0">
                <TaskList />
              </TabsContent>
              <TabsContent value="today" className="mt-0">
                <TaskList filter="today" />
              </TabsContent>
              <TabsContent value="upcoming" className="mt-0">
                <TaskList filter="upcoming" />
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                <TaskList filter="completed" />
              </TabsContent>
            </Tabs>
          </DashboardShell>
        </div>
        <SiteFooter />
      </div>
    
  )
}
