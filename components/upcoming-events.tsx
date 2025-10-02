"use client"

import { useState, useEffect } from "react"
import { FolderOpen, CalendarClock, CheckCircle, Target, Briefcase } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { getTasks } from "@/lib/services/task-service"
import { getGoals } from "@/lib/services/goal-service"
import { Badge } from "@/components/ui/badge"

interface CalendarItem {
  id: string
  title: string
  time: string
  color: string
  type: 'event' | 'task' | 'goal' | 'project'
  priority?: string
}

export default function UpcomingEvents() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchUpcomingItems = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Get current date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // End date for fetch window (next 14 days)
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 14)

        // 1. Query for upcoming events
        const eventsRef = collection(db, "events")
        const eventsQuery = query(
          eventsRef,
          where("userId", "==", user.uid),
          where("startTime", ">=", Timestamp.fromDate(today)),
          orderBy("startTime", "asc"),
          limit(10)
        )

        // 2. Prepare promises for all queries
        const eventsPromise = getDocs(eventsQuery)
        const tasksPromise = getTasks(user.uid, {
          dueAfter: today,
          dueBefore: endDate,
          completed: false
        })
        const goalsPromise = getGoals(user.uid, {
          dueAfter: today,
          dueBefore: endDate
        })

        // 3. Execute all promises concurrently
        const [eventsSnapshot, tasks, goals] = await Promise.all([
          eventsPromise,
          tasksPromise,
          goalsPromise
        ])

        const calendarItems: CalendarItem[] = []

        // Process events
        eventsSnapshot.forEach((doc) => {
          const data = doc.data()
          calendarItems.push({
            id: doc.id,
            title: data.title,
            time: formatEventTime(data.startTime.toDate(), data.endTime?.toDate()),
            color: data.color || "#3B82F6", // Default blue color
            type: 'event'
          })
        })

        // Process tasks with due dates
        tasks.forEach(task => {
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate)
            // Verify date is valid before adding it
            if (!isNaN(dueDate.getTime())) {
              calendarItems.push({
                id: task.id,
                title: task.title,
                time: formatDueDate(dueDate),
                color: getPriorityColor(task.priority),
                type: 'task',
                priority: task.priority
              })
              console.log(`Added task to upcoming events: ${task.title} due ${formatDueDate(dueDate)}`);
            } else {
              console.error(`Invalid date for task in upcoming events ${task.id}: ${task.dueDate}`);
            }
          }
        })

        // Process goals with due dates
        goals.forEach(goal => {
          if (goal.dueDate) {
            const dueDate = new Date(goal.dueDate)
            calendarItems.push({
              id: goal.id,
              title: goal.title,
              time: formatDueDate(dueDate),
              color: "#8B5CF6", // Purple for goals
              type: 'goal'
            })
          }
        })

        // Sort by date (assuming time strings are formatted properly)
        calendarItems.sort((a, b) => {
          // Extract date info from time strings for sorting
          const aHasToday = a.time.includes("Today");
          const bHasToday = b.time.includes("Today");
          const aHasTomorrow = a.time.includes("Tomorrow");
          const bHasTomorrow = b.time.includes("Tomorrow");
          
          if (aHasToday && !bHasToday) return -1;
          if (!aHasToday && bHasToday) return 1;
          if (aHasTomorrow && !bHasToday && !bHasTomorrow) return -1;
          if (bHasTomorrow && !aHasToday && !aHasTomorrow) return 1;
          
          // If both are the same day category, compare the rest of the string
          return a.time.localeCompare(b.time);
        });

        // Limit to 7 items
        setItems(calendarItems.slice(0, 7))
      } catch (error) {
        console.error("Error fetching calendar items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUpcomingItems()
  }, [user])

  // Format event time for display
  const formatEventTime = (startDate: Date, endDate?: Date) => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    
    let dateStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    
    const timeStr = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
    
    if (startDate.toDateString() === today.toDateString()) {
      dateStr = "Today"
    } else if (startDate.toDateString() === tomorrow.toDateString()) {
      dateStr = "Tomorrow"
    }
    
    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
      return `${dateStr}, ${timeStr} - ${endTimeStr}`
    }
    
    return `${dateStr}, ${timeStr}`
  }

  // Format due date for tasks and goals
  const formatDueDate = (dueDate: Date) => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    
    let dateStr = dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    
    if (dueDate.toDateString() === today.toDateString()) {
      dateStr = "Today"
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      dateStr = "Tomorrow"
    }
    
    return `Due ${dateStr}`
  }

  // Helper function to get a color for task priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "#EF4444" // red-500
      case "medium":
        return "#F59E0B" // yellow-500
      case "low":
        return "#10B981" // green-500
      default:
        return "#64748B" // slate-500
    }
  }

  // Get icon based on item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <CalendarClock className="h-4 w-4 mr-2" />
      case 'task':
        return <CheckCircle className="h-4 w-4 mr-2" />
      case 'goal':
        return <Target className="h-4 w-4 mr-2" />
      case 'project':
        return <Briefcase className="h-4 w-4 mr-2" />
      default:
        return <CalendarClock className="h-4 w-4 mr-2" />
    }
  }

  return (
    <>
      <h3 className="font-medium mb-3">Upcoming Items</h3>
      {isLoading ? (
        <div className="text-center py-6">Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
          <FolderOpen className="h-12 w-12 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Nothing coming up.</p>
          <p className="text-xs text-slate-500">Your scheduled items will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center p-2 rounded-md border border-slate-200 bg-slate-50"
            >
              <div
                className="w-2 h-10 rounded-full mr-3 upcoming-bar"
                data-color={item.color}
              ></div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getItemIcon(item.type)}
                    <p className="font-medium">{item.title}</p>
                  </div>
                  {item.priority && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {item.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}