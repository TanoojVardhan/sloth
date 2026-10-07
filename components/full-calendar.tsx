"use client"

import { useState, useMemo } from "react"
import { usePlanner } from "@/hooks/use-planner-store"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const grid: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) grid.push(null)
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d))
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

export function FullCalendar({ compact = false }: { compact?: boolean }) {
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const grid = getMonthGrid(cursor.getFullYear(), cursor.getMonth())
  const { scheduled } = usePlanner()

  const byDay = useMemo(() => {
    const map = new Map<string, { task: number; event: number; goal: number }>()
    for (const item of scheduled) {
      if (!item.date) continue
      const d = new Date(item.date)
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) continue
      const key = d.toDateString()
      if (!map.has(key)) map.set(key, { task: 0, event: 0, goal: 0 })
      const entry = map.get(key)!
      entry[item.type as "task" | "event" | "goal"]++
    }
    return map
  }, [scheduled, cursor])

  return (
    <div className={compact ? "" : "rounded-lg border bg-card p-6"}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) => {
          const key = d ? new Date(d).toDateString() : ""
          const counts = d ? byDay.get(key) : undefined
          const isToday = d && d.toDateString() === new Date().toDateString()
          const hasItems = counts && (counts.task || counts.event || counts.goal)
          
          return (
            <div
              key={i}
              className={`
                relative aspect-square rounded-md border p-1 text-sm transition-colors
                ${d ? "bg-card hover:bg-accent cursor-pointer" : "bg-muted/50"}
                ${isToday ? "border-primary border-2 bg-primary/5" : ""}
              `}
            >
              {d && (
                <>
                  <div className={`text-center ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {d.getDate()}
                  </div>
                  {hasItems && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {counts.event ? (
                        <span className="h-1 w-1 rounded-full bg-blue-500" title="Events" />
                      ) : null}
                      {counts.task ? (
                        <span className="h-1 w-1 rounded-full bg-orange-500" title="Tasks" />
                      ) : null}
                      {counts.goal ? (
                        <span className="h-1 w-1 rounded-full bg-purple-500" title="Goals" />
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      
      {!compact && (
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>Events</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            <span>Goals</span>
          </div>
        </div>
      )}
    </div>
  )
}
