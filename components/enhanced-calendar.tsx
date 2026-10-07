"use client"

import { useState, useMemo } from "react"
import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/priority-badge"
import { cn } from "@/lib/utils"
import { formatEventTime } from "@/lib/format"

interface DayItem {
  id: string
  title: string
  type: "task" | "event" | "goal"
  date: string
  priority?: string
  status?: string
}

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const grid: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) grid.push(null)
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d))
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

const dotClass: Record<DayItem["type"], string> = {
  event: "bg-primary",
  task: "bg-warning",
  goal: "bg-chart-2",
}

export function EnhancedCalendar({ compact = false }: { compact?: boolean }) {
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { tasks } = useTasks()
  const { events } = useEvents()
  const { goals } = useGoals()

  const grid = getMonthGrid(cursor.getFullYear(), cursor.getMonth())

  // Combine all items by day
  const itemsByDay = useMemo(() => {
    const map = new Map<string, DayItem[]>()

    tasks.forEach((task) => {
      if (!task.dueDate) return
      const d = new Date(task.dueDate)
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) return
      const key = d.toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({
        id: task.taskId,
        title: task.title,
        type: "task",
        date: task.dueDate,
        priority: task.priority,
        status: task.status,
      })
    })

    events.forEach((event) => {
      if (!event.start) return
      const d = new Date(event.start)
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) return
      const key = d.toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({
        id: event.eventId,
        title: event.title,
        type: "event",
        date: event.start,
      })
    })

    goals.forEach((goal) => {
      if (!goal.targetDate) return
      const d = new Date(goal.targetDate)
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) return
      const key = d.toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({
        id: goal.goalId,
        title: goal.title,
        type: "goal",
        date: goal.targetDate,
      })
    })

    return map
  }, [tasks, events, goals, cursor])

  const selectedItems = selectedDate ? itemsByDay.get(selectedDate.toDateString()) ?? [] : []

  return (
    <div className={cn("mx-auto w-full", compact ? "max-w-xs" : "max-w-lg")}>
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <h3 className={cn("font-semibold text-foreground", compact ? "text-base" : "text-lg")}>
          {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!compact && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}
            >
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Grid — fixed square-ish cells so the grid never stretches
          to fill whatever width it's given */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) => {
          const key = d ? d.toDateString() : ""
          const items = d ? itemsByDay.get(key) : undefined
          const isToday = d && d.toDateString() === new Date().toDateString()
          const isSelected = d && selectedDate && d.toDateString() === selectedDate.toDateString()
          const dots = items?.slice(0, 3) ?? []

          return (
            <button
              key={i}
              onClick={() => d && setSelectedDate(d)}
              disabled={!d}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-start gap-0.5 rounded-md border text-sm transition-colors",
                compact ? "pt-1" : "pt-1.5",
                d ? "bg-card hover:bg-accent cursor-pointer" : "border-transparent",
                isToday && "border-primary/40 bg-primary/10",
                isSelected && "border-primary ring-1 ring-primary/30",
                !isToday && !isSelected && d && "border-border"
              )}
            >
              {d && (
                <>
                  <span className={cn("font-medium", isToday ? "text-primary" : "text-foreground/80")}>
                    {d.getDate()}
                  </span>
                  {dots.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      {dots.map((item, idx) => (
                        <span key={idx} className={cn("h-1 w-1 rounded-full", dotClass[item.type])} />
                      ))}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Events
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Tasks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-2" /> Goals
          </span>
        </div>
      )}

      {/* Day details open as an actual popup, not a panel pushed into the
          page flow */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nothing scheduled this day.</p>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {item.type === "event" && <Circle className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                    {item.type === "task" &&
                      (item.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-1" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 fill-warning text-warning" />
                      ))}
                    {item.type === "goal" && <Target className="h-4 w-4 shrink-0 text-chart-2" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatEventTime(new Date(item.date).toISOString())}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.priority && (item.priority === "low" || item.priority === "medium" || item.priority === "high") && (
                      <PriorityBadge priority={item.priority} />
                    )}
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
