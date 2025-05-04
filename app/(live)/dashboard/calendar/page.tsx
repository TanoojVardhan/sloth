"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CalendarInterface } from "@/components/calendar-interface"
import { useEventDialog } from "@/hooks/use-event-dialog"

export default function CalendarPage() {
  const { openEventDialog } = useEventDialog()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <DashboardShell className="container py-6">
          <DashboardHeader heading="Calendar" text="Manage your schedule and events">
            <Button 
              className="bg-slate-800 hover:bg-slate-700"
              onClick={openEventDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DashboardHeader>
          <CalendarInterface />
        </DashboardShell>
      </div>
    </div>
  )
}
