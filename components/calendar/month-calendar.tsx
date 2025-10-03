"use client"

import * as React from "react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import AddEventDialog from "./add-event-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"

type EventItem = {
  id: string
  title: string
  time?: string
}
type EventsMap = Record<string, EventItem[]>

export default function MonthCalendar() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date())
  const [events, setEvents] = React.useState<EventsMap>({})
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function onPrev() {
    setCurrentDate((d) => subMonths(d, 1))
  }

  function onNext() {
    setCurrentDate((d) => addMonths(d, 1))
  }

  function onToday() {
    setCurrentDate(new Date())
  }

  function openAddEvent(day: Date) {
    setSelectedDate(day)
    // Only open if not already open for this date
    setDialogOpen((prev) => {
      if (!prev || selectedDate?.getTime() !== day.getTime()) {
        return true
      }
      return prev
    })
  }

  function addEvent(payload: { title: string; time?: string }) {
    if (!selectedDate) return
    const key = format(selectedDate, "yyyy-MM-dd")
    setEvents((prev) => {
      const prevList = prev[key] || []
      return {
        ...prev,
        [key]: [
          ...prevList,
          {
            id: `${Date.now()}`,
            title: payload.title,
            time: payload.time,
          },
        ],
      }
    })
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekLabels = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), "EEE"))

  return (
    <Card className="p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold">Calendar</h2>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-md border bg-secondary px-3 py-1 text-sm font-medium">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={onNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* ... optional right-side actions could go here ... */}
      </div>

      {/* Weekday labels */}
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {weekLabels.map((lbl) => (
          <div key={lbl} aria-hidden>
            {lbl}
          </div>
        ))}
      </div>

      {/* Days grid with ARIA rows */}
      <div role="grid" aria-label="Monthly calendar" className="grid grid-cols-7 gap-2">
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, rowIdx) => (
          <div role="row" className="contents" key={rowIdx}>
            {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayEvents = events[key] || []
              const inCurrent = isSameMonth(day, currentDate)
              const today = isToday(day)
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-label={`Select ${format(day, "PPPP")}`}
                  aria-current={today ? "date" : undefined}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAddEvent(day);
                  }}
                  tabIndex={0}
                  className={cn(
                    "h-16 w-full rounded-lg border bg-card p-2 text-left transition-colors",
                    !inCurrent && "text-muted-foreground/60",
                    "hover:bg-accent",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium",
                        today
                          ? "bg-primary text-primary-foreground"
                          : !inCurrent
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  {/* dots for events */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span key={ev.id} className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    ))}
                    {dayEvents.length > 3 && <span className="text-xs text-muted-foreground">+{dayEvents.length - 3}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Upcoming items section */}
      <div className="mt-4 border-t pt-4">
        <h3 className="mb-1 text-sm font-medium">Upcoming Items</h3>
        <p className="text-xs text-muted-foreground">Nothing coming up.</p>
      </div>

      <AddEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate ?? undefined}
        onAdd={(values) => {
          addEvent(values)
          setDialogOpen(false)
        }}
      />
    </Card>
  )
}
