import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Filter, ArrowUpDown } from "lucide-react"
import { QuickActions } from "@/components/quick-actions"
import EventList from "@/components/event-list"

export const metadata: Metadata = {
  title: "Events | Sloth AI Planner",
  description: "Manage your events with Sloth AI Planner",
}

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <DashboardShell className="container py-6">
          <DashboardHeader heading="Events" text="Manage and organize all your events">
            <QuickActions />
          </DashboardHeader>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
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
              <EventList />
            </TabsContent>
            <TabsContent value="today" className="mt-0">
              <EventList filter="today" />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-0">
              <EventList filter="upcoming" />
            </TabsContent>
            <TabsContent value="past" className="mt-0">
              <EventList filter="past" />
            </TabsContent>
          </Tabs>
        </DashboardShell>
      </div>
      <SiteFooter />
    </div>
  )
}