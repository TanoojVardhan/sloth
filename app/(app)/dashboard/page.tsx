"use client"

import { AddItemPanel } from "@/components/add-item-panel"
import { FullCalendar } from "@/components/full-calendar"
import { QuickCalendarWidget } from "@/components/quick-calendar-widget"
import { PageHeader } from "@/components/page-header"
import { useTasks, useEvents } from "@/hooks/use-firebase-data"
import { usePlanner } from "@/hooks/use-planner-store"
import { PriorityBadge } from "@/components/priority-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, Target, Calendar as CalendarIcon, Loader2, CalendarCheck, ArrowRight, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { tasks, isLoading: tasksLoading } = useTasks()
  const { events, isLoading: eventsLoading } = useEvents()
  const { goals } = usePlanner() // Goals still from localStorage

  const highPriorityTasks = tasks.filter((t) => t.priority === "high" && t.status !== "done")
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const completedTasks = tasks.filter((t) => t.status === "done")
  
  // Combine upcoming tasks and events
  const upcomingItems = [
    ...tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= new Date() && t.status !== "done")
      .map((t) => ({ ...t, type: "task" as const, date: t.dueDate!, id: t.taskId })),
    ...events
      .filter((e) => new Date(e.start) >= new Date())
      .map((e) => ({ ...e, type: "event" as const, date: e.start, id: e.eventId })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  const isLoading = tasksLoading || eventsLoading

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Get a comprehensive overview of your tasks, events, and goals in one place"
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />
      
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
                  {events.filter(e => new Date(e.start) >= new Date()).length} upcoming
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
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter(g => !g.done).length} active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
              <CardDescription>Create tasks, events, and goals fast</CardDescription>
            </CardHeader>
            <CardContent>
              <AddItemPanel />
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>Google Calendar Integration</CardTitle>
                  <CardDescription>Sync your schedule seamlessly</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to create events directly from Sloth Planner. 
                Never miss an important meeting or appointment.
              </p>
              <div className="flex gap-2">
                <Link href="/calendar-integration" className="flex-1">
                  <Button className="w-full">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Connect Calendar
                  </Button>
                </Link>
                <Link href="/calendar-integration">
                  <Button variant="outline">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

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

        <div className="space-y-6">
          <QuickCalendarWidget />

          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <FullCalendar compact />
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
                      {new Date(item.date).toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
