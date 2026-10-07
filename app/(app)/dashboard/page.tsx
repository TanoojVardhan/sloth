"use client"

import { AddItemPanel } from "@/components/add-item-panel"
import { EnhancedCalendar } from "@/components/enhanced-calendar"
import { QuickCalendarWidget } from "@/components/quick-calendar-widget"
import { PageHeader } from "@/components/page-header"
import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { PriorityBadge } from "@/components/priority-badge"
import { formatEventDateTime } from "@/lib/format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, Target, Calendar as CalendarIcon, Loader2, CalendarCheck, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { tasks, isLoading: tasksLoading } = useTasks()
  const { events, isLoading: eventsLoading } = useEvents()
  const { goals, isLoading: goalsLoading } = useGoals()
  const { isConnected: isCalendarConnected } = useGoogleCalendar()

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

  return (
    <div className="space-y-5">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Get a comprehensive overview of your tasks, events, and goals in one place"
      />
      
      {/* No Data Message */}
      {!isLoading && tasks.length === 0 && events.length === 0 && (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-foreground mb-2">
              Welcome to Sloth Planner! 👋
            </p>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created any tasks or events yet. Get started by using the Quick Add panel below.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedTasks.length} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{todoTasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {highPriorityTasks.length} high priority
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">
                  {upcomingEvents.length} upcoming
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{goals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {goals.filter((g) => g.status === "active").length} active
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
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
                    <CardTitle>Google Calendar Integration</CardTitle>
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
                    Connect Calendar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>High Priority Tasks</CardTitle>
                <CardDescription>Focus on what matters most</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">View All</Button>
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
                    <li key={t.taskId} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
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
            <CardTitle>Upcoming Schedule</CardTitle>
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
                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
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
                    <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">
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
