"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, addMonths, subMonths, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

// Event type for slots
export type CalendarEvent = {
  id: string
  title: string
  date: Date
  time?: string
}

export default function Calendar31() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")

  function handlePrev() {
    setCurrentMonth((d) => subMonths(d, 1))
  }
  function handleNext() {
    setCurrentMonth((d) => addMonths(d, 1))
  }
  function handleSelect(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date)
    setShowAdd(true)
  }
  function handleAddEvent() {
    if (!selectedDate || !newTitle.trim()) return
    setEvents((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        title: newTitle,
        date: selectedDate,
      },
    ])
    setShowAdd(false)
    setNewTitle("")
  }
  // Filter events for selected date
  const dayEvents = selectedDate
    ? events.filter((ev) => isSameDay(ev.date, selectedDate))
    : []

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-md border bg-secondary px-3 py-1 text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ShadCalendar
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={handleSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="mb-4"
      />
      {selectedDate && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Events for {format(selectedDate, "PPP")}:</span>
            <Button size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {showAdd && (
            <div className="flex gap-2 mb-2">
              <input
                className="border rounded px-2 py-1 text-sm flex-1"
                placeholder="Event title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <Button size="sm" onClick={handleAddEvent}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          )}
          <ul className="space-y-1">
            {dayEvents.length === 0 && <li className="text-xs text-muted-foreground">No events.</li>}
            {dayEvents.map((ev) => (
              <li key={ev.id} className="rounded bg-accent px-2 py-1 text-sm">
                {ev.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-t pt-4">
        <h3 className="mb-1 text-sm font-medium">All Events</h3>
        <ul className="space-y-1 max-h-32 overflow-auto">
          {events.length === 0 && <li className="text-xs text-muted-foreground">No events scheduled.</li>}
          {events.map((ev) => (
            <li key={ev.id} className="rounded bg-card px-2 py-1 text-xs flex items-center gap-2">
              <span className="font-medium">{format(ev.date, "MMM d")}</span>
              <span>{ev.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
