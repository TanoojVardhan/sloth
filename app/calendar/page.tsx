import type { Metadata } from "next"
import MonthCalendar from "@/components/calendar/month-calendar"

export const metadata: Metadata = {
  title: "Calendar",
  description: "Monthly calendar view",
}

export default function CalendarPage() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-4 text-balance text-3xl font-semibold">Calendar</h1>
      <p className="mb-6 text-pretty text-muted-foreground">
        Browse months, click a day to add quick notes. You can wire this up to your backend later.
      </p>
      <MonthCalendar />
    </main>
  )
}
