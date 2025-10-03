import type { Metadata } from "next"

import { DashboardPage } from "@/components/ui/dashboard-page"
import { FilterBar } from "@/components/ui/filter-bar"
import TaskList from "@/components/task-list"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { QuickActions } from "@/components/quick-actions"

export const metadata: Metadata = {
  title: "Tasks | Sloth AI Planner",
  description: "Manage your tasks with Sloth AI Planner",
}

export default function TasksPage() {
  const tabs = [
    { value: "all", label: "All Tasks" },
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" }
  ]

  return (
    <DashboardPage 
      title="Tasks" 
      description="Manage and organize all your tasks"
      headerActions={<QuickActions />}
    >
      <Tabs defaultValue="all" className="w-full">
        <FilterBar 
          tabs={tabs}
          defaultTab="all"
        />
        <TabsContent value="all">
          <TaskList />
        </TabsContent>
        <TabsContent value="today">
          <TaskList filter="today" />
        </TabsContent>
        <TabsContent value="upcoming">
          <TaskList filter="upcoming" />
        </TabsContent>
        <TabsContent value="completed">
          <TaskList filter="completed" />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
