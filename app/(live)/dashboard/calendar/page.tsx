import type { Metadata } from "next"
import { DashboardPage } from "@/components/ui/dashboard-page"
import Calendar31 from "@/components/calendar/calendar-31"

export const metadata: Metadata = {
  title: "Calendar | Sloth AI Planner",
  description: "Monthly calendar view for your events and tasks",
}

export default function CalendarPage() {
  return (
    <DashboardPage 
      title="Calendar" 
      description="Browse months, click a day to add quick notes or view scheduled items"
    >
  <Calendar31 />
    </DashboardPage>
  )
}
