"use client"

import { FullCalendar } from "@/components/full-calendar"
import { AddItemPanel } from "@/components/add-item-panel"
import { Calendar02 } from "@/components/calendar-02"
import { PageHeader } from "@/components/page-header"
import { usePlanner } from "@/hooks/use-planner-store"
import { Calendar as CalendarIcon } from "lucide-react"

export default function CalendarPage() {
  const { scheduled } = usePlanner()
  const upcoming = scheduled
    .filter((i) => i.date && new Date(i.date) >= new Date())
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 12)

  return (
    <div className="grid gap-6">
      <PageHeader
        icon={CalendarIcon}
        title="Calendar"
        description="Visualize your schedule across months with interactive calendar tools and quick add panel"
        gradient="from-cyan-600 to-blue-600"
      />

      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold mb-2">Quick Add</h2>
        <p className="text-sm text-muted-foreground mb-4">Create a new item to add to your calendar</p>
        <AddItemPanel />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <FullCalendar />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Two-month Picker</h2>
          <Calendar02 />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">No scheduled items yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{i.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(i.date!).toLocaleString()} · {i.type}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
