"use client"

import { AddItemPanel } from "@/components/add-item-panel"
import { EnhancedCalendar } from "@/components/enhanced-calendar"
import { QuickCalendarWidget } from "@/components/quick-calendar-widget"
import { useAuth } from "@/components/auth-provider"
import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { PriorityBadge } from "@/components/priority-badge"
import { formatEventDateTime } from "@/lib/format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { tasks, isLoading: tasksLoading } = useTasks()
  const { events, isLoading: eventsLoading } = useEvents()
  const { goals, isLoading: goalsLoading } = useGoals()
  const { isConnected: isCalendarConnected } = useGoogleCalendar()
  const { user } = useAuth()

  const highPriorityTasks = tasks.filter((t) => t.priority === "high" && t.status !== "done")
  const todoTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "done")
  
  // Calculate upcoming events
  const upcomingEvents = events.filter((e) => {
    try {
      const eventDate = new Date(e.start)
      const now = new Date()
      // Check if date is valid
      if (isNaN(eventDate.getTime())) {
        return false
      }
      return eventDate >= now
    } catch {
      return false
    }
  })

  // Combine upcoming tasks and events
  const upcomingItems = [
    ...tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= new Date() && t.status !== "done")
      .map((t) => ({ ...t, type: "task" as const, date: t.dueDate!, id: t.taskId })),
    ...upcomingEvents
      .map((e) => ({ ...e, type: "event" as const, date: e.start, id: e.eventId })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  const isLoading = tasksLoading || eventsLoading

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const today = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
  const stats = [
    { label: "Open tasks", value: todoTasks.length, note: `${completedTasks.length} done`, href: "/tasks", loading: tasksLoading },
    { label: "High priority", value: highPriorityTasks.length, note: "to do first", href: "/tasks", loading: tasksLoading },
    { label: "Upcoming events", value: upcomingEvents.length, note: `of ${events.length}`, href: "/events", loading: eventsLoading },
    { label: "Active goals", value: goals.filter((g) => g.status === "active").length, note: `of ${goals.length}`, href: "/goals", loading: goalsLoading },
  ]

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          {greeting}
          {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-foreground sm:text-5xl">{today}</h1>
      </header>

      {!isLoading && tasks.length === 0 && events.length === 0 ? (
        <p className="rounded-xl bg-accent px-5 py-4 text-sm text-accent-foreground">
          Nothing here yet. Add your first task or event below and it will show up on this page.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-y-5 rounded-xl border bg-card py-5 lg:grid-cols-4 lg:divide-x">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group px-6">
              <dt className="text-sm text-muted-foreground group-hover:text-foreground">{s.label}</dt>
              <dd className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold tabular-nums">{s.loading ? "–" : s.value}</span>
                {!s.loading && <span className="text-xs text-muted-foreground">{s.note}</span>}
              </dd>
            </Link>
          ))}
        </dl>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Quick add</CardTitle>
              <CardDescription>Create tasks, events, and goals fast</CardDescription>
            </CardHeader>
            <CardContent>
              <AddItemPanel />
            </CardContent>
          </Card>

          {!isCalendarConnected && (
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <CalendarCheck className="h-6 w-6 text-foreground/80" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>Sync your schedule seamlessly</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to automatically sync tasks and events. 
                  Never miss an important meeting or appointment.
                </p>
                <Link href="/calendar-integration">
                  <Button className="w-full">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Connect calendar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>High priority</CardTitle>
                <CardDescription>Focus on what matters most</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : highPriorityTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No high priority tasks.</p>
              ) : (
                <ul className="space-y-2">
                  {highPriorityTasks.slice(0, 5).map((t) => (
                    <li key={t.taskId} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                      <div className="flex-1">
                        <div className="font-medium">{t.title}</div>
                        {t.dueDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(t.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <QuickCalendarWidget />

          <Card>
            <CardContent className="p-4">
              <EnhancedCalendar compact />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coming up</CardTitle>
            <CardDescription>Your next scheduled items</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/tasks">
              <Button variant="ghost" size="sm">Tasks</Button>
            </Link>
            <Link href="/events">
              <Button variant="ghost" size="sm">Events</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No upcoming items scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingItems.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatEventDateTime(new Date(item.date).toISOString())}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.type === "task" && "priority" in item && (
                      <PriorityBadge priority={item.priority} />
                    )}
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                      {item.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
