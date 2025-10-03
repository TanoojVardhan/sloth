import type { Metadata } from "next"
import { DashboardPage } from "@/components/ui/dashboard-page"
import { FilterBar } from "@/components/ui/filter-bar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { QuickActions } from "@/components/quick-actions"
import EventList from "@/components/event-list"

export const metadata: Metadata = {
  title: "Events | Sloth AI Planner",
  description: "Manage your events with Sloth AI Planner",
}

export default function EventsPage() {
  const tabs = [
    { value: "all", label: "All Events" },
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" }
  ]

  return (
    <DashboardPage 
      title="Events" 
      description="Manage and organize all your events"
      headerActions={<QuickActions />}
    >
      <Tabs defaultValue="all" className="w-full">
        <FilterBar 
          tabs={tabs}
          defaultTab="all"
        />
        <TabsContent value="all">
          <EventList />
        </TabsContent>
        <TabsContent value="today">
          <EventList filter="today" />
        </TabsContent>
        <TabsContent value="upcoming">
          <EventList filter="upcoming" />
        </TabsContent>
        <TabsContent value="past">
          <EventList filter="past" />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}