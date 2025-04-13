import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarView } from "@/components/calendar-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Calendar | Sloth AI Planner",
  description: "Manage your schedule with Sloth AI Planner",
}

export default function CalendarPage() {
  const currentMonth = new Date().toLocaleString("default", { month: "long" })
  const currentYear = new Date().getFullYear()

  return (
    <DashboardLayout>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <DashboardShell className="container py-6">
            <DashboardHeader heading="Calendar" text="Manage your schedule and events">
              <Button className="bg-slate-800 hover:bg-slate-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DashboardHeader>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Calendar</CardTitle>
                <div className="flex items-center space-x-2">
                  <Tabs defaultValue="month">
                    <TabsList>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-medium">
                      {currentMonth} {currentYear}
                    </h3>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    Today
                  </Button>
                </div>

                <CalendarView />

                <div className="mt-6">
                  <h3 className="font-medium mb-3">Upcoming Events</h3>
                  <div className="space-y-2">
                    <div className="flex items-center p-2 rounded-md border border-slate-200 bg-slate-50">
                      <div className="w-2 h-10 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">Team Meeting</p>
                        <p className="text-sm text-slate-500">Tomorrow, 10:00 AM - 11:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center p-2 rounded-md border border-slate-200 bg-slate-50">
                      <div className="w-2 h-10 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">Project Review</p>
                        <p className="text-sm text-slate-500">Apr 20, 2:00 PM - 3:30 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center p-2 rounded-md border border-slate-200 bg-slate-50">
                      <div className="w-2 h-10 bg-purple-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">Client Call</p>
                        <p className="text-sm text-slate-500">Apr 25, 11:30 AM - 12:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DashboardShell>
        </div>
        <SiteFooter />
      </div>
    </DashboardLayout>
  )
}
