"use client"

import { EnhancedCalendar } from "@/components/enhanced-calendar"
import { AddItemPanel } from "@/components/add-item-panel"
import { PageHeader } from "@/components/page-header"
import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { Calendar as CalendarIcon, Clock, CheckCircle2, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/priority-badge"
import { formatEventDateTime } from "@/lib/format"

export default function CalendarPage() {
  const { tasks } = useTasks()
  const { events } = useEvents()
  const { goals } = useGoals()
  
  // Combine all upcoming items
  const allUpcoming = [
    ...tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= new Date())
      .map((t) => ({ ...t, type: "task" as const, date: t.dueDate!, id: t.taskId })),
    ...events
      .filter((e) => e.start && new Date(e.start) >= new Date())
      .map((e) => ({ ...e, type: "event" as const, date: e.start, id: e.eventId })),
    ...goals
      .filter((g) => g.targetDate && new Date(g.targetDate) >= new Date())
      .map((g) => ({ ...g, type: "goal" as const, date: g.targetDate!, id: g.goalId })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 15)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarIcon}
        title="Calendar"
        description="Visualize your schedule with an interactive calendar showing all tasks, events, and goals"
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick Add</CardTitle>
          <CardDescription>Create a new task, event, or goal</CardDescription>
        </CardHeader>
        <CardContent>
          <AddItemPanel />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <EnhancedCalendar />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Schedule
              </CardTitle>
              <CardDescription>All scheduled items across tasks, events, and goals</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {allUpcoming.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {allUpcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scheduled items yet.</p>
              <p className="text-sm">Add tasks, events, or goals with dates to see them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allUpcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.type === "event" && <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />}
                    {item.type === "task" && (
                      "status" in item && item.status === "done" ? 
                        <CheckCircle2 className="h-4 w-4 text-chart-1 flex-shrink-0" /> : 
                        <Clock className="h-4 w-4 text-warning flex-shrink-0" />
                    )}
                    {item.type === "goal" && <Target className="h-4 w-4 text-chart-2 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatEventDateTime(new Date(item.date).toISOString())}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {"priority" in item && item.priority && <PriorityBadge priority={item.priority} />}
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
