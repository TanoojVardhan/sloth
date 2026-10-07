"use client"

import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Target,
  AlertCircle,
  TrendingUp,
  Sun,
  Moon,
  Coffee,
  History
} from "lucide-react"
import Link from "next/link"
import { PriorityBadge } from "@/components/priority-badge"

export default function SchedulePage() {
  const { tasks, isLoading: tasksLoading } = useTasks()
  const { events, isLoading: eventsLoading } = useEvents()
  const { goals, isLoading: goalsLoading } = useGoals()

  const isLoading = tasksLoading || eventsLoading || goalsLoading

  // Combine all scheduled items
  const allScheduledItems = [
    ...tasks
      .filter((t) => t.dueDate)
      .map((t) => ({ 
        ...t, 
        type: "task" as const, 
        date: t.dueDate!, 
        id: t.taskId,
        priority: t.priority,
        status: t.status 
      })),
    ...events.map((e) => ({ 
      ...e, 
      type: "event" as const, 
      date: e.start, 
      id: e.eventId,
      location: e.location 
    })),
    ...goals
      .filter((g) => g.targetDate)
      .map((g) => ({ 
        ...g, 
        type: "goal" as const, 
        date: g.targetDate!, 
        id: g.goalId,
        status: g.status 
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Categorize by time periods
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const overdue = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    if (item.type === "task") {
      return itemDate < today && item.status !== "done"
    } else if (item.type === "goal") {
      return itemDate < today && item.status !== "completed"
    }
    return itemDate < today
  })

  const todayItems = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= today && itemDate < tomorrow
  })

  const tomorrowItems = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= tomorrow && itemDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
  })

  const thisWeekItems = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
    return itemDate >= dayAfterTomorrow && itemDate < nextWeek
  })

  const laterItems = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= nextWeek
  })

  // Past items (completed or past events)
  const pastItems = allScheduledItems.filter((item) => {
    const itemDate = new Date(item.date)
    if (item.type === "task") {
      return itemDate < today && item.status === "done"
    } else if (item.type === "goal") {
      return itemDate < today && item.status === "completed"
    } else if (item.type === "event") {
      return itemDate < today
    }
    return false
  }).reverse() // Most recent first

  // Time of day categories for today
  const morningItems = todayItems.filter((item) => {
    const hour = new Date(item.date).getHours()
    return hour >= 5 && hour < 12
  })

  const afternoonItems = todayItems.filter((item) => {
    const hour = new Date(item.date).getHours()
    return hour >= 12 && hour < 17
  })

  const eveningItems = todayItems.filter((item) => {
    const hour = new Date(item.date).getHours()
    return hour >= 17 || hour < 5
  })

  const renderItem = (item: {
    type: "task" | "event" | "goal"
    date: string
    id: string
    title: string
    priority?: "low" | "medium" | "high"
    status?: string
    location?: string | null
  }) => {
    const itemTime = new Date(item.date)
    let isOverdue = itemTime < now
    if (item.type === "task") {
      isOverdue = isOverdue && item.status !== "done"
    } else if (item.type === "goal") {
      isOverdue = isOverdue && item.status !== "completed"
    }
    
    return (
      <div
        key={`${item.type}-${item.id}`}
        className={`rounded-lg border p-4 transition-all hover:bg-accent ${
          isOverdue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={
                item.type === "task" ? "default" : 
                item.type === "event" ? "secondary" : 
                "outline"
              }>
                {item.type === "task" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {item.type === "event" && <CalendarIcon className="mr-1 h-3 w-3" />}
                {item.type === "goal" && <Target className="mr-1 h-3 w-3" />}
                {item.type}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold mb-1">{item.title}</h3>
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {itemTime.toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}
            </div>
          </div>
          
          {item.priority && (
            <PriorityBadge priority={item.priority} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Clock}
        title="Schedule"
        description="View all your scheduled items organized by time periods - today, tomorrow, this week, and beyond"
        gradient="from-amber-600 to-orange-600"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdue.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sun className="h-4 w-4 text-orange-500" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-500" />
              Tomorrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4 text-purple-500" />
              Past
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : allScheduledItems.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No scheduled items</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Start by adding tasks with due dates or creating events
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Link href="/tasks">
                <Button variant="outline" size="sm">Add Task</Button>
              </Link>
              <Link href="/events">
                <Button size="sm">Add Event</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue Items */}
          {overdue.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Overdue ({overdue.length})
                </CardTitle>
                <CardDescription>Items that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdue.map(renderItem)}
              </CardContent>
            </Card>
          )}

          {/* Today's Schedule */}
          {todayItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  Today ({todayItems.length})
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {morningItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      Morning (5 AM - 12 PM)
                    </h4>
                    <div className="space-y-3">
                      {morningItems.map(renderItem)}
                    </div>
                  </div>
                )}
                
                {afternoonItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Afternoon (12 PM - 5 PM)
                    </h4>
                    <div className="space-y-3">
                      {afternoonItems.map(renderItem)}
                    </div>
                  </div>
                )}
                
                {eveningItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Evening (5 PM - 5 AM)
                    </h4>
                    <div className="space-y-3">
                      {eveningItems.map(renderItem)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tomorrow */}
          {tomorrowItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  Tomorrow ({tomorrowItems.length})
                </CardTitle>
                <CardDescription>
                  {tomorrow.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tomorrowItems.map(renderItem)}
              </CardContent>
            </Card>
          )}

          {/* This Week */}
          {thisWeekItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  This Week ({thisWeekItems.length})
                </CardTitle>
                <CardDescription>Upcoming in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {thisWeekItems.map(renderItem)}
              </CardContent>
            </Card>
          )}

          {/* Later */}
          {laterItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  Later ({laterItems.length})
                </CardTitle>
                <CardDescription>Beyond this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {laterItems.map(renderItem)}
              </CardContent>
            </Card>
          )}

          {/* Past Items */}
          {pastItems.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <History className="h-5 w-5" />
                  Past Items ({pastItems.length})
                </CardTitle>
                <CardDescription>Completed tasks, finished goals, and past events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pastItems.map(renderItem)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
